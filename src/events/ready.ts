import Event from '../structures/Event';
import { Guild } from 'discord.js';
import { createGuild, getShipAliases } from '../Database';

export default class extends Event {
  once = true;

  execute() {
    // Load ship aliases
    getShipAliases(this.client)
      .then(shipAliases => this.client.shipAliases = shipAliases)
      .catch(err => this.client.logger.error(`Error while getting ship aliases: ${err}`));

    this.client.guilds.cache.forEach((guild: Guild) => {
      createGuild(this.client, guild);
    });
  }
}