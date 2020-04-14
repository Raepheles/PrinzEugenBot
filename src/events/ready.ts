import Event from '../structures/Event';
import { Guild } from 'discord.js';
import { createGuild } from '../Database';

export default class extends Event {
  once = true;

  execute() {
    this.client.guilds.cache.forEach((guild: Guild) => {
      createGuild(this.client, guild);
    });
  }
}