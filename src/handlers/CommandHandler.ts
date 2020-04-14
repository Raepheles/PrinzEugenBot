import { Collection } from 'discord.js';
import Command from '../structures/Command';
import klaw from 'klaw';
import { join, parse } from 'path';
import Cluster from '../structures/Cluster';

export default class CommandHandler extends Collection<string, Command> {
  public isInit: boolean = false;
  client: Cluster;

  constructor(client: Cluster) {
    super();
    this.client = client;
  }

  async init() {
    return new Promise<boolean>((resolve, reject) => {
      const path = join(__dirname, '..', 'commands');
      const start = Date.now();

      klaw(path)
        .on('data', (item) => {
          const file = parse(item.path);
          if(!file.ext || file.ext !== '.js') return;

          const req = ((r) => r.default || r)(require(join(file.dir, file.base)));
          const newReq = new req(this.client, file.name, join(file.dir, file.base));

          this.set(file.name, newReq);
        })
        .on('end', () => {
          this.client.logger.info(`Loaded ${this.size} Commands in ${(Date.now() - start)}ms`);
          this.isInit = true;
          resolve();
        })
        .on('error', err => {
          reject(err);
        });
    });
  }

  fetch(name: string) {
    if(this.has(name)) return this.get(name) as Command;

    const commandAlias = this.find((c) => c.aliases.includes(name));
    if(commandAlias) return commandAlias;
  }
}