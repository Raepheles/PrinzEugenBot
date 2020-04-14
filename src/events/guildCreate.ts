import Event from '../structures/Event';
import { Guild } from 'discord.js';
import { createGuild } from '../Database';

export default class extends Event {
  async execute(guild: Guild) {
    if(!guild.available) return;
    createGuild(this.client, guild);
  }
}