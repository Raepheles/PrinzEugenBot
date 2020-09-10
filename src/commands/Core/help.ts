import { MessageEmbed } from 'discord.js';
import Command from '../../structures/Command';
import { CommandExecArgs } from '../../types/CommandExecArgs';
import { Colors } from '../../utils/ColorUtils';

interface ModulesObject {
  [key: string]: string[];
}

export default class extends Command {
  dm = true;

  async execute(args: CommandExecArgs) {
    const message = args.message;
    const params = args.params;

    const guild = message.guild;
    const settings = guild ? this.client.guildSettings[guild.id] : undefined;
    const prefix = settings ? settings.prefix : this.client.config.prefix;
    const username = this.client.user?.username;
    const avatar = this.client.user?.avatarURL({dynamic: true, size: 256, format: 'png'});
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

    const modules: ModulesObject = {};
      this.client.commands.forEach(command => {
        if(!modules[command.module]) modules[command.module] = [];
        modules[command.module].push(`${command.name}`);
      });

    if(params) {
      const param = params.join(' ');
      const filtered = this.client.commands.filter(comm => comm.name === param || comm.aliases.includes(param));
      const command = filtered.first();
      if(!command || (command.admin && message.author.id !== this.client.config.ownerId) ) {
        embed.setTitle(this.client.translate('commands/help:COMMAND_NOT_FOUND_TITLE', { guild }))
          .setDescription(this.client.translate('commands/help:COMMAND_NOT_FOUND_DESCRIPTION', { guild }));
      } else {
        const translateArgs = { example: randomCommand(modules) };
        return message.channel.send(command.getEmbed(message.guild, translateArgs));
      }
    } else {
      embed.setTitle(username)
      .setDescription(this.client.translate('commands/help:DESCRIPTION', {
        guild,
        args: {
          prefix,
          example: randomCommand(modules)
        }
      }));
      for(const key in modules) {
        if(key === 'Admin') continue;
        if(!key) continue;
        const str = modules[key].join(', ');
        embed.addField(key, str, true);
      }
    }

    if(avatar) embed.setThumbnail(avatar);

    return message.channel.send(embed);
  }
}

function randomCommand(obj: ModulesObject): string {
  const keys = Object.keys(obj);
  const arr = obj[keys[Math.floor(Math.random() * keys.length)]];
  return arr[Math.floor(Math.random() * arr.length)];
}