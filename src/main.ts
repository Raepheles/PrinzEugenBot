import Cluster from './structures/Cluster';
import { createConnection } from 'mongoose';
import * as config from '../config.json';

createConnection(config.mongoUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(async conn => {
    const client = new Cluster(conn);
    await client.commands.init();
    await client.events.init();
    return client.login(client.config.token);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });