import { Message } from 'discord.js';
import { getPermissionName } from '../utils/PermissionUtils';
import Event from '../structures/Event';

export default class extends Event {
  execute(message: Message) {
    if(message.partial || (message.author && message.author.bot)) return;

    if(message.channel.type === 'dm')
      return this.handleDM(message);
    return this.handleGuild(message);
  }

  async handleGuild(message: Message) {
    if(!message.guild) return;
    if(!message.guild.available) return;
    if(!message.guild.me)
      await message.guild.members.fetch(this.client.config.id);

    const [split, ...params] = message.content.split(' ');

    const prefix = this.client.config.prefix;
    if(!prefix || !message.content.startsWith(prefix)) return;

    const command = this.client.commands.fetch(split.slice(prefix.length).toLowerCase());

    if(!command) return;
    if(!message.member)
      await message.guild.members.fetch(message.author.id);
    if(!message.member) return;

    const requiredPerms = command.requiredPerms;
    for(const requiredPerm of requiredPerms) {
      if(!message.member.hasPermission(requiredPerm)) return message.reply(`You need \`${getPermissionName(requiredPerm)}\` permission to use this command.`);
    }

    command.execute(message, params)
      .then(() => command.postExecute(message, params))
      .catch(err => command.postExecute(message, params, err));
  }

  handleDM(message: Message) {
    if(!message.content.startsWith(this.client.config.prefix)) return;

    const [split, ...params] = message.content.split(' ');

    const command = this.client.commands.get(split.slice(this.client.config.prefix.length));

    if(!command || !command.dm) return;

    command.execute(message, params)
      .then(() => command.postExecute(message, params))
      .catch(err => command.postExecute(message, params, err));
  }
}