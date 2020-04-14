import { Collection } from 'discord.js';
import Event from '../structures/Event';
import Cluster from '../structures/Cluster';
import klaw from 'klaw';
import { join, parse } from 'path';

export default class EventHandler extends Collection<string, Event> {
  public isInit: boolean = false;
  client: Cluster;

  constructor(client: Cluster) {
    super();

    this.client = client;
  }

  init() {
    return new Promise<boolean>((resolve, reject) => {
      const path = join(__dirname, '..', 'events');
      const start = Date.now();

      klaw(path)
        .on('data', (item) => {
          const file = parse(item.path);
          if (!file.ext || file.ext !== '.js') return;

          const e = ((r) => r.default || r)(require(join(file.dir, file.base)));
          const event: Event = new e(this.client, file.name, join(file.dir, file.base));

          this.set(file.name, event);

          this.client[event.once ? 'once' : 'on'](event.name, (...args: unknown[]) => event.execute(...args));
        })
        .on('end', () => {
          this.client.logger.info(`Loaded ${this.size} Events in ${Date.now() - start}ms`);
          this.isInit = true;
          resolve();
        })
        .on('error', (err) => {
          reject(err);
        });
    });
  }
}