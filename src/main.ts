import Cluster from './structures/Cluster';
import { createConnection } from 'mongoose';
import config from '../config.json';
import { CronJob } from 'cron';
import { readFile } from 'fs-extra';
import { Ship, ShipParse, UnreleasedShip } from './types/Ship';
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

  try {
    const obj = await loadOrParseShips();
    ships = obj.ships;
    unreleasedShips = obj.unreleasedShips;
    date = obj.date;
  } catch(err) {
    logger.error(`Got error while parsing the ships and there is no ship data present. Exiting the app. Error: ${err}`);
    process.exit(1);
  }

  const conn = await createConnection(config.mongoUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  const client = new Cluster(conn, logger, ships, unreleasedShips, date);
  await client.commands.init();
  await client.events.init();
  await client.login(client.config.token);

  const cronJob = new CronJob('0 3 * * *', async () => {
    parseShips(client);
  }, null, true, 'Europe/Istanbul');
  cronJob.start();
}


async function loadOrParseShips() {
  try {
    return await loadShips();
  } catch(err) {
    logger.error(`There was an error while loading ships: ${err}`);
  }
  return await parseShips();
}

async function loadShips() {
  const buffer = await readFile(`${config.shipsFileName}.json`, 'utf8');
  const obj = JSON.parse(buffer);
  if(!obj.date || !obj.ships || !obj.unreleasedShips) throw Error(`Invalid ${config.shipsFileName}.json`);
  const date = new Date(obj.date);
  const ships: Ship[] = obj.ships;
  const unreleasedShips: UnreleasedShip[] = obj.unreleasedShips;
  return {
    date,
    ships,
    unreleasedShips
  };
}

async function parseShips(client?: Cluster) {
  const parser = new Parser(logger, config.wikiBaseUrl, config.shipListUrl);
  const parseData: ShipParse = await parser.parse();
  const ships = parseData.ships;
  const date = parseData.date;
  const unreleasedShips = parseData.unreleasedShips;
  const obj = {
    date,
    ships,
    unreleasedShips
  };
  if(client) {
    client.lastDataUpdate = date;
    client.ships = ships;
    client.unreleasedShips = unreleasedShips;
  }
  await writeFile(`${config.shipsFileName}.json`, JSON.stringify(obj));
  return {
    date,
    ships,
    unreleasedShips
  };
}
