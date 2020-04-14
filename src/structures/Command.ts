import { Message, PermissionResolvable, GuildChannel } from 'discord.js';
import { CommandOptions } from '../types/CommandOptions';
import Cluster from './Cluster';

export default class Command {
  client: Cluster;
  name: string;
  path: string;
  aliases: string[];
  requiredPerms: PermissionResolvable[];
  dm: boolean;

  constructor(client: Cluster, name: string, path: string, options?: CommandOptions) {
    this.client = client;
    this.name = name;
    this.path = path;
    this.aliases = (options && options.aliases) || [];
    this.dm = (options && options.dm) || false;
    this.requiredPerms = (options && options.requiredPerms) || [];
  }

  execute(_message: Message, _params?: string[]): Promise<any> {
    throw Error('Your command doesn\'t have an execute method');
  }

  postExecute(message: Message, _params?: string[], _error?: string) {
    const user = `${message.author.username}#${message.author.discriminator}`;
    const userId = message.author.id;
    const guildName = message.guild?.name;
    const guildId = message.guild?.id;
    let channelName = '';
    let channelId = '';
    if(message.channel.type === 'dm') {
      channelName = 'DM_CHANNEL';
      channelId = 'DM_CHANNEL';
    } else if(message.channel.type === 'text') {
      const channel = message.channel as GuildChannel;
      channelName = channel.name;
      channelId = channel.id;
    }
    const msg = `\`${user} (${userId})\` has used command \`${message.content}\` in guild \`${guildName} (${guildId})\` in channel \`${channelName} (${channelId})\``;
    this.client.logger.trace(msg);
    this.client.discordLogger.log(`${msg} | ${_error ? _error : 'SUCCESS'}`);
  }
}