import Cluster from './Cluster';
import { ClientEvents } from 'discord.js';

export default class Event {
  client: Cluster;
  name: keyof ClientEvents;
  once = false;

  constructor(client: Cluster, name: keyof ClientEvents) {
    this.client = client;
    this.name = name;
  }

  execute(..._args: unknown[]) {
    throw Error('Your event doesn\'t have an execute method.');
  }
}