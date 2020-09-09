import Cluster from './structures/Cluster';
import { createConnection } from 'mongoose';
import config from '../config.json';
import { CronJob } from 'cron';
import { readFile } from 'fs-extra';
import { Ship, ParseData, UnreleasedShip, Equipment } from './types/ParseData';
import { Parser } from './Parser';
import { getLogger, configure } from 'log4js';
import { writeFile } from 'fs-extra';

const logConfig = {
  appenders: {
    outFilter: { type: 'stdout' },
    debugFile: { type: 'dateFile', filename: 'log/debug.log', pattern: 'yyyy-MM-dd', keepFileExt: true, alwaysIncludePattern: true },
    traceFile: { type: 'dateFile', filename: 'log/trace.log', pattern: 'yyyy-MM-dd', keepFileExt: true, alwaysIncludePattern: true },
    out: { type: 'logLevelFilter', level: config.logLevel, appender: 'outFilter' },
    debug: { type: 'logLevelFilter', level: 'debug', appender: 'debugFile' },
    trace: { type: 'logLevelFilter', level: 'trace', appender: 'traceFile' }
  },
  categories: {
    default: {
      appenders: [ 'out', 'debug' ],
      level: 'trace'
    }
  }
};

if(config.traceFileLogsOn) logConfig.categories.default.appenders.push('trace');

configure(logConfig);
const logger = getLogger();

start().catch(err => {
  console.error(`There was an error starting the application: ${err}`);
  process.exit(2);
});

async function start() {
  let ships;
  let date;
  let unreleasedShips;
  let equipments;

  try {
    const obj = await loadOrParseData();
    ships = obj.ships;
    unreleasedShips = obj.unreleasedShips;
    equipments = obj.equipments;
    date = obj.date;
  } catch(err) {
    logger.error(`Got error while parsing the data and there is no data present. Exiting the app. Error: ${err}`);
    process.exit(1);
  }

  const conn = await createConnection(config.mongoUrl, {
    useFindAndModify: false,
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  const client = new Cluster(conn, logger, ships, unreleasedShips, equipments, date);
  await client.commands.init();
  await client.events.init();
  await client.notificationHandler.init();
  await client.login(client.config.token);

  const cronJob = new CronJob('0 3 * * *', async () => {
    parseData(client);
  }, null, true, 'Europe/Istanbul');
  cronJob.start();
}


async function loadOrParseData() {
  try {
    return await loadData();
  } catch(err) {
    logger.error(`There was an error while loading data: ${err}`);
  }
  return await parseData();
}

async function loadData() {
  const buffer = await readFile(`${config.dataFileName}.json`, 'utf8');
  const obj = JSON.parse(buffer);
  if(!obj.date || !obj.ships || !obj.unreleasedShips || !obj.equipments) throw Error(`Invalid ${config.dataFileName}.json`);
  const date = new Date(obj.date);
  const ships: Ship[] = obj.ships;
  const unreleasedShips: UnreleasedShip[] = obj.unreleasedShips;
  const equipments: Equipment[] = obj.equipments;
  return {
    date,
    ships,
    unreleasedShips,
    equipments
  };
}

async function parseData(client?: Cluster) {
  const parser = new Parser(logger, config.wikiBaseUrl, config.shipListUrl, config.equipmentListUrl);
  const data: ParseData = await parser.parse();
  const ships = data.ships;
  const date = data.date;
  const unreleasedShips = data.unreleasedShips;
  const equipments = data.equipments;
  const obj = {
    date,
    ships,
    unreleasedShips,
    equipments
  };
  if(client) {
    client.lastDataUpdate = date;
    client.ships = ships;
    client.unreleasedShips = unreleasedShips;
    client.equipments = equipments;
  }
  await writeFile(`${config.dataFileName}.json`, JSON.stringify(obj));
  return {
    date,
    ships,
    unreleasedShips,
    equipments
  };
}
