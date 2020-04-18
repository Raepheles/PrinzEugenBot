import { Message, MessageEmbed, User } from 'discord.js';
import { getPermissionName } from '../utils/PermissionUtils';
import Event from '../structures/Event';
import { Colors } from '../utils/ColorUtils';

export default class extends Event {
  antiSpam: Map<User, number> = new Map();

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

    const authorPastMessageCount = this.antiSpam.get(message.author);
    if(authorPastMessageCount && authorPastMessageCount >= this.client.config.antiSpam.maxMessages) {
      return;
    }

    const [split, ...rest] = message.content.trim().replace(/\s\s+/g, ' ').split(' ');

    const prefix = this.client.config.prefix;
    if(!prefix || !message.content.startsWith(prefix)) return;

    // lower case command
    const command = this.client.commands.fetch(split.slice(prefix.length).toLowerCase());
    const params: string[] = [];
    const flags: string[] = [];

    let flagFound = false;
    let parseError = false;
    rest.forEach(val => {
      if(val.startsWith('-')) {
        flagFound = true;
        flags.push(val.slice(1).toLowerCase()); // lower case all flags
      } else {
        if(flagFound) {
          parseError = true;
          return;
        }
        params.push(val.toLowerCase()); // lower case all parameters
      }
    });

    if(parseError) return message.channel.send(new MessageEmbed()
      .setDescription(this.client.translate('common:COMMAND_PARSE_ERROR', { guild: message.guild }))
      .setTimestamp()
    );

    if(!command) return;
    if(!message.member)
      await message.guild.members.fetch(message.author.id);
    if(!message.member) return;

    const requiredPerms = command.requiredPerms;
    for(const requiredPerm of requiredPerms) {
      if(!message.member.hasPermission(requiredPerm)) return message.reply(`You need \`${getPermissionName(requiredPerm)}\` permission to use this command.`);
    }

    if(message.author.id !== this.client.config.ownerId) {
      this.antiSpam.set(message.author, authorPastMessageCount ? authorPastMessageCount + 1 : 1);
      setTimeout(() => {
        const current = this.antiSpam.get(message.author);
        if(!current) return;
        if(current === 1) this.antiSpam.delete(message.author);
        else this.antiSpam.set(message.author, current - 1);
      }, this.client.config.antiSpam.timeout);
    }

    const isSuccess = await command.preExecute({ message, params, flags });
    if(isSuccess) {
      try {
        await command.execute({ message, params: params.length !== 0 ? params : undefined, flags });
        command.postExecute(message);
      } catch(err) {
        command.postExecute(message, err);
      }
    }
  }

  async handleDM(message: Message) {
    if(!message.content.startsWith(this.client.config.prefix)) return;

    const [split, ...rest] = message.content.split(' ');

    const command = this.client.commands.get(split.slice(this.client.config.prefix.length));
    const params: string[] = [];
    const flags: string[] = [];

    let flagFound = false;
    let parseError = false;
    rest.forEach(val => {
      if(val.startsWith('-')) {
        flagFound = true;
        flags.push(val.slice(1));
      } else {
        if(flagFound) {
          parseError = true;
          return;
        }
        params.push(val);
      }
    });

    if(parseError) return message.channel.send(new MessageEmbed()
      .setDescription(this.client.translate('common:COMMAND_PARSE_ERROR', { guild: message.guild }))
      .setColor(Colors.ERROR_COLOR)
      .setTimestamp()
    );

    if(!command || !command.dm) return;

    const isSuccess = await command.preExecute({ message, params, flags });
    if(isSuccess) {
      try {
        await command.execute({ message, params: params.length !== 0 ? params : undefined, flags });
        command.postExecute(message);
      } catch(err) {
        message.channel.send(new MessageEmbed()
          .setDescription(this.client.translate('common:COMMAND_EXECUTE_ERROR', { guild: message.guild }))
          .setColor(Colors.ERROR_COLOR)
          .setTimestamp()
        );
        command.postExecute(message, err);
      }
    }
  }
}