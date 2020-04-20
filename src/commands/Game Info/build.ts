import { MessageEmbed } from 'discord.js';
import Command from '../../structures/Command';
import { CommandExecArgs } from '../../types/CommandExecArgs';
import { Colors } from '../../utils/ColorUtils';

export default class extends Command {
  dm = true;
  maxParam = 1;
  minParam = 1;

  async execute(args: CommandExecArgs) {
    const message = args.message;
    const params = args.params;
    if(!params) return;

    const guild = message.guild;

    const embed = new MessageEmbed()
    .setColor(Colors.DEFAULT_COLOR)
    .setTimestamp()
    .setFooter(this.client.translate('commands/general:REQUESTED_BY', {
      guild,
      args: {
        user: message.author.username,
        hash: message.author.discriminator
      }
    }));

    const [...split] = params[0].split(':');

    if(split.length !== 2 && split.length !== 3) {
      embed.setDescription(this.client.translate('commands/build:PARSE_ERROR', {
        guild,
        args: { time: params[0] }
      }));
      return message.channel.send(embed);
    }

    split.forEach((val, i, arr) => {
      arr[i] = ('0' + val).slice(-2);
    });

    for(const arg of split) {
      if(isNaN(Number(arg)) || arg.length > 2) {
        embed.setDescription(this.client.translate('commands/build:NAN', {
          guild,
          args: { arg }
        }));
        return message.channel.send(embed);
      }
    }

    const timeString = split.length === 3 ? split.join(':') : split.join(':') + ':00';

    const result: string[] = [];

    this.client.ships.filter(ship => ship.construction.time === timeString).forEach(ship => {
      result.push(`[${ship.id} - ${ship.name}](${ship.url})`);
    });

    if(result.length === 0) {
      embed.setDescription(this.client.translate('commands/build:NO_SHIP_FOUND', {
        guild,
        args: {
          time: timeString
        }
      }));
      return message.channel.send(embed);
    }

    embed.setDescription(this.client.translate('commands/build:DESCRIPTION', {
      guild,
      args: {
        ships: result.join('\n'),
        time: timeString
      }
    }));

    return message.channel.send(embed);
  }
}
