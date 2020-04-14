import { Message, MessageEmbed } from 'discord.js';
import config from '../../../config.json';
import Command from '../../structures/Command';

export default class extends Command {
  dm = true;

  execute(message: Message, _params?: string[]) {
    if(_params && _params.length > 0) return message.channel.send('test').then(() => Promise.reject('Too many params'));
    const client = message.client;
    const guilds = client.guilds.cache.size;
    const users = client.users.cache.filter(user => !user.bot).size;
    const uptime = getTimeFromMs(client.uptime);
    const username = client.user?.username;
    const avatar = client.user?.avatarURL({dynamic: true, size: 256, format: 'png'});
    const embed = new MessageEmbed()
    .setColor('RED')
    .setTitle(username)
    .setDescription(this.client.translate('common:DESCRIPTION', message.guild, {
      botName: username,
      supportServerUrl: config.supportServer
    }))
    .setFooter(this.client.translate('common:ABOUT_FOOTER', message.guild, {
      owner: username,
      supportServerUrl: config.supportServer
    }))
    .setTimestamp()
    .addFields([{
      name: 'Number of guilds',
      value: `${guilds}`,
      inline: true,
    },{
      name: 'Number of users',
      value: `${users}`,
      inline: true,
    },{
      name: 'Uptime',
      value: `${uptime}`,
      inline: true,
    }]);

    if(avatar) embed.setThumbnail(avatar);

    return message.channel.send(embed);
  }
}

function getTimeFromMs(ms: number | null): string {
  if(!ms) return '00:00:00';
  let seconds = Math.floor(ms / 1000);
  let minutes = Math.floor(seconds / 60);
  seconds -= minutes * 60;
  let hours = Math.floor(minutes / 60);
  minutes -= hours * 60;
  const days = Math.floor(hours / 24);
  hours -= days * 24;

  const hh = hours > 9 ? `${hours}` : `0${hours}`;
  const mm = minutes > 9 ? `${minutes}` : `0${minutes}`;
  const ss = seconds > 9 ? `${seconds}` : `0${seconds}`;

  if(days) {
    return `${days} days, ${hh} hours, ${mm} mins, ${ss} secs`;
  } else if(hours) {
    return `${hh} hours, ${mm} mins, ${ss} secs`;
  } else if(minutes) {
    return `${mm} mins, ${ss} secs`;
  } else {
    return `${ss} secs`;
  }
}