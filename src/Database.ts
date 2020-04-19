import Cluster from './structures/Cluster';
import { Guild } from 'discord.js';
import { GuildSchema } from './models/Guild';
import { GuildSettings } from './types/GuildSettings';
import { Document } from 'mongoose';
import { ShipAlias } from './types/ParseData';
import { AliasSchema } from './models/Alias';

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

export async function getGuild(client: Cluster, guildId: string) {
  return new Promise<GuildSettings>((resolve, reject) => {
    const GuildModel = client.database.model('guild', GuildSchema);
    GuildModel.findById(guildId, (err, doc: Document) => {
      if(err) reject(err);
      if(doc) resolve(doc.toJSON());
      reject();
    });
  });
}

export function getShipAliases(client: Cluster): Promise<ShipAlias[]> {
  return new Promise<ShipAlias[]>((resolve, reject) => {
    const shipAliases: ShipAlias[] = [];
    const ShipAliasModel = client.database.model('shipAliases', AliasSchema);
    ShipAliasModel.find((err, docs: Document[]) => {
      if(err) reject(err);
      if(docs) {
        docs.forEach(doc => shipAliases.push(doc.toJSON()));
        resolve(shipAliases);
      }
      reject();
    });
  });
}