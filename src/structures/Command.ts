import { Message, PermissionResolvable, GuildChannel, Guild, MessageEmbed } from 'discord.js';
import { CommandOptions } from '../types/CommandOptions';
import Cluster from './Cluster';
import { CommandExecArgs } from '../types/CommandExecArgs';
import Flag from './Flag';
import { Colors } from '../utils/ColorUtils';

export default class Command {
  description: string;
  usage: string;
  client: Cluster;
  name: string;
  module: string;
  path: string;
  maxParam: number;
  minParam: number;
  acceptedFlags: Flag[];
  aliases: string[];
  requiredPerms: PermissionResolvable[];
  dm: boolean;
  admin: boolean;

  constructor(client: Cluster, name: string, module: string, path: string, options?: CommandOptions) {
    this.client = client;
    this.name = name;
    this.path = path;
    this.module = module;
    this.description = (options && options.description) || '';
    this.maxParam = (options && options.maxParam) || Number.MAX_SAFE_INTEGER;
    this.minParam = (options && options.minParam) || Number.MIN_SAFE_INTEGER;
    this.usage = (options && options.usage) || '';
    this.acceptedFlags = (options && options.acceptedFlags) || [];
    this.aliases = (options && options.aliases) || [];
    this.dm = (options && options.dm) || false;
    this.requiredPerms = (options && options.requiredPerms) || [];
    this.admin = (options && options.admin) || false;
  }

  getEmbed(guild: Guild | null, args?: object): MessageEmbed {
    const settings = guild ? this.client.guildSettings[guild.id] : undefined;
    const prefix = settings ? settings.prefix : this.client.config.prefix;
    const avatar = this.client.user?.avatarURL({dynamic: true, size: 256, format: 'png'});

    const embed = new MessageEmbed()
    .setColor(Colors.DEFAULT_COLOR)
    .setTimestamp();

    embed.setTitle(this.client.translate('commands/help:COMMAND_FOUND_TITLE', {
      guild,
      args: {
        command: this.name
      }
    }))
    .addFields({
      name: this.client.translate('commands/general:DESCRIPTION', { guild }),
      value: this.getDescription(guild, args) || this.client.translate('commands/general:NO_DESCRIPTION', { guild }),
      inline: false
    }, {
      name: this.client.translate('commands/general:USAGE', { guild }),
      value: this.getUsage(guild, { ...args, prefix }) || this.client.translate('commands/general:NO_USAGE', { guild }),
      inline: false
    });

    if(this.aliases.length !== 0) {
      const aliases: string[] = [];
      this.aliases.forEach(alias => aliases.push(`\`${alias}\``));
      embed.addField(
        this.client.translate('commands/general:ALIASES', { guild }),
        aliases.join(', ') || this.client.translate('commands/general:NO_ALIASES', { guild }),
        false
      );
    }
    if(this.acceptedFlags.length !== 0) {
      const flags: string[] = [];
      this.acceptedFlags.forEach(flag => flags.push(`\`${flag.name}\``));
      embed.addField(
        this.client.translate('commands/general:ACCEPTED_FLAGS', { guild }),
        flags.join(', ') || this.client.translate('commands/general:NO_FLAGS', { guild }),
        false
      );
    }

    if(avatar) embed.setThumbnail(avatar);

    return embed;
  }

  private sendMessage(message: Message, key: string, args?: object) {
    const embed = this.getEmbed(message.guild).setDescription(this.client.translate(key, { guild: message.guild, args}));
    message.channel.send(embed);
  }

  getDescription(guild: Guild | null, args?: object) {
    const description = this.client.translate(`commands/${this.name}:COMMAND_DESCRIPTION`, { guild, args });
    if(description !== 'COMMAND_DESCRIPTION') return description;
    else return this.description;
  }

  getUsage(guild: Guild | null, args?: object) {
    const usage = this.client.translate(`commands/${this.name}:COMMAND_USAGE`, { guild, args });
    if(usage !== 'COMMAND_DESCRIPTION') return usage;
    else return this.usage;
  }

  async preExecute(args: CommandExecArgs) {
    const params = args.params && args.params.length > 0 ? args.params : undefined;
    const message = args.message;
    const flagNames = args.flags;
    const flags: Flag[] = [];

    if(flagNames) {
      for(const flagName of flagNames) {
        const index = this.acceptedFlags.map(f => f.name).indexOf(flagName);
        if(index !== -1) {
          const flagToAdd = new Flag(this.acceptedFlags[index].name, this.acceptedFlags[index].group);
          const conflicts = flags.filter(f => f.group === flagToAdd.group);
          if(conflicts.length > 0) {
            conflicts.push(flagToAdd);
            conflicts.forEach((val, i, arr) => {
              arr[i].name = `\`${val.name}\``;
            });
            const conflictedFlags = conflicts.map(f => f.name).join(', ');
            this.sendMessage(message, 'commands/general:CONFLICTED_FLAGS', { flags: conflictedFlags });
            return false;
          }
          flags.push(flagToAdd);
        } else {
          this.sendMessage(message, 'commands/general:INVALID_FLAG', { flag: flagName });
          return false;
        }
      }
    }

    if((this.minParam > 0 && !params) || (params && (params.length < this.minParam || params.length > this.maxParam))) {
      this.sendMessage(message, 'commands/general:PARAM_ERROR');
      return false;
    }

    return true;
  }

  execute(_args: CommandExecArgs): Promise<any> {
    throw Error('Your command doesn\'t have an execute method');
  }

  postExecute(message: Message, error?: string) {
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
    const msg = this.client.translate('common:USER_USED_COMMAND', {
      args: {
        user,
        userId,
        command: message.content,
        guildName,
        guildId,
        channelName,
        channelId
      }
    });
    this.client.logger.trace(`${msg} | ${error ? error : 'SUCCESS'}`);
    this.client.discordLogger.log(`${msg} | ${error ? error : 'SUCCESS'}`);
  }
}