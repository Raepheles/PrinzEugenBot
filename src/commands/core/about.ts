import { MessageEmbed } from 'discord.js';
import config from '../../../config.json';
import Command from '../../structures/Command';
import { CommandExecArgs } from '../../types/CommandExecArgs';
import { getTimeFromMs } from '../../utils/TimeUtils';
import moment from 'moment';
import { Colors } from '../../utils/ColorUtils';

export default class extends Command {
  dm = true;

  async execute(args: CommandExecArgs) {
    const message = args.message;

    const client = message.client;
    const guilds = client.guilds.cache.size;
    const users = client.users.cache.filter(user => !user.bot).size;
    const uptime = getTimeFromMs(client.uptime);
    const username = client.user?.username;
    const avatar = client.user?.avatarURL({dynamic: true, size: 256, format: 'png'});
    const owner = await client.users.fetch(this.client.config.ownerId);
    const ownerName = owner.username;
    const ownerHash = owner.discriminator;
    const embed = new MessageEmbed()
    .setColor(Colors.DEFAULT_COLOR)
    .setTitle(username)
    .setDescription(this.client.translate('commands/about:DESCRIPTION', {
      guild: message.guild,
      args: {
        botName: username,
        supportServerUrl: config.supportServer
      }
    }))
    .setFooter(this.client.translate('commands/about:FOOTER', {
      guild: message.guild,
      args: {
        ownerName,
        ownerHash
      }
    }))
    .setTimestamp()
    .addFields([{
      name: 'Number of guilds',
      value: `${guilds}`,
      inline: true,
    }, {
      name: 'Number of users',
      value: `${users}`,
      inline: true,
    }, {
      name: 'Uptime',
      value: `${uptime}`,
      inline: true,
    }, {
      name: 'Last Data Update (UTC)',
      value: `${moment(this.client.lastDataUpdate).utc().format('LLLL')}`,
      inline: true
    }, {
      name: 'Spam Protection',
      value: `Max ${this.client.config.antiSpam.maxMessages} messages in ${this.client.config.antiSpam.timeout / 1000} seconds.`,
      inline: true
    }]);

    if(avatar) embed.setThumbnail(avatar);

    return message.channel.send(embed);
  }
}