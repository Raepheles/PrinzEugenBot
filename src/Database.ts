import Cluster from './structures/Cluster';
import { Guild } from 'discord.js';
import { GuildSchema } from './models/Guild';
import { GuildSettings } from './types/GuildSettings';
import { Document } from 'mongoose';

/**
 * Creates a guild entry on database if the guild doesn't exist on database.
 * @param client Cluster object
 * @param guild Guild to insert database
 */
export function createGuild(client: Cluster, guild: Guild) {
  const GuildModel = client.database.model('guild', GuildSchema);
  // Look for guild in database, save it if it doesn't exist.
  GuildModel.findById(guild.id, (_err, doc: Document) => {
    if(doc) {
      if(!client.guildSettings.hasOwnProperty(guild.id)) {
        client.guildSettings[guild.id] = doc.toJSON();
      }
      return client.logger.debug(`Guild joined ${guild.name} (${guild.id}), already exists on database.`);
    }
    const newGuild = new GuildModel({
      _id: `${guild.id}`,
      name: `${guild.name}`,
      ownerId: `${guild.ownerID}`
    });
    newGuild.save(err => {
      if(err) return client.logger.error(`Error during guild create: ${err}`);
      client.guildSettings[guild.id] = newGuild.toJSON();
      client.logger.debug(`Guild saved to database: ${guild.name} (${guild.id}).`);
    });
  });
}

export function getGuild(client: Cluster, guildId: string) {
  return new Promise<GuildSettings>((resolve, reject) => {
    const GuildModel = client.database.model('guild', GuildSchema);
    GuildModel.findById(guildId, (err, doc: Document) => {
      if(err) reject(err);
      if(doc) resolve(doc.toJSON());
      reject();
    });
  });
}