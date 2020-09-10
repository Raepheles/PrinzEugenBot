import { MessageEmbed, PermissionResolvable } from 'discord.js';
import Command from '../../structures/Command';
import { CommandExecArgs } from '../../types/CommandExecArgs';
import { setPrinzChannel, setPrefix, setNotificationChannel } from '../../Database';
import { Colors } from '../../utils/ColorUtils';

export default class extends Command {
  dm = false;
  minParam = 1;
  requiredPerms: PermissionResolvable[] = ['MANAGE_CHANNELS'];

  async execute(args: CommandExecArgs) {
    const message = args.message;
    const params = args.params;
    if(!params) return;

    const guild = message.guild;
    const settings = guild ? this.client.guildSettings[guild.id] : undefined;
    const prefix = settings ? settings.prefix : this.client.config.prefix;
    if(!guild) return;

    const embed = new MessageEmbed()
      .setTimestamp()
      .setFooter(this.client.translate('commands/general:REQUESTED_BY', {
        guild,
        args: {
          user: message.author.username,
          hash: message.author.discriminator
        }
      }));

    const mainParam = params[0];

    switch(mainParam) {
      case 'prinzchannel':
        try {
          await setPrinzChannel(this.client, guild.id, message.channel.id);
          embed.setDescription(this.client.translate('commands/set:SUCCESS_PRINZ_CHANNEL', {
            guild,
            args: {
              ping: message.channel.toString()
            }
          }))
            .setColor(Colors.SUCCESS_COLOR);
        } catch(err) {
          this.client.logger.error(err);
          embed.setDescription(this.client.translate('commands/set:ERROR_PRINZ_CHANNEL', {
            guild,
            args: {
              ping: message.channel.toString()
            }
          }))
            .setColor(Colors.ERROR_COLOR);
        }
        break;
      case 'prefix':
        if(!params[1]) {
          embed.setDescription(this.client.translate('commands/set:MISSING_PREFIX', {
            guild,
            args: {
              prefix
            }
          }))
            .setColor(Colors.ERROR_COLOR);
        } else if(params[1] && params[1].length > 3) {
          embed.setDescription(this.client.translate('commands/set:PREFIX_LENGTH', {
            guild
          }))
            .setColor(Colors.ERROR_COLOR);
        } else {
          const newPrefix = params[1];
          try {
            await setPrefix(this.client, guild.id, newPrefix);
            embed.setDescription(this.client.translate('commands/set:SUCCESS_PREFIX', {
              guild,
              args: {
                prefix: newPrefix
              }
            }))
              .setColor(Colors.SUCCESS_COLOR);
          } catch(err) {
            this.client.logger.error(err);
            embed.setDescription(this.client.translate('commands/set:ERROR_PREFIX', {
              guild,
              args: {
                prefix: newPrefix
              }
            }))
              .setColor(Colors.ERROR_COLOR);
          }
        }
        break;
      case 'notificationchannel':
        try {
          await setNotificationChannel(this.client, guild.id, message.channel.id);
          embed.setDescription(this.client.translate('commands/set:SUCCESS_NOTIFICATION_CHANNEL', {
            guild,
            args: {
              ping: message.channel.toString()
            }
          }))
            .setColor(Colors.SUCCESS_COLOR);
        } catch(err) {
          this.client.logger.error(err);
          embed.setDescription(this.client.translate('commands/set:ERROR_NOTIFICATION_CHANNEL', {
            guild,
            args: {
              ping: message.channel.toString()
            }
          }))
            .setColor(Colors.ERROR_COLOR);
        }
        break;
      default:
        embed.setDescription(this.client.translate('commands/set:UNKNOWN_OPTION', {
          guild,
          args: {
            option: mainParam
          }
        }))
          .setColor(Colors.ERROR_COLOR);
        break;
    }
    return message.channel.send(embed);
  }
}