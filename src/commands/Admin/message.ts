import { MessageEmbed } from 'discord.js';
import Command from '../../structures/Command';
import { CommandExecArgs } from '../../types/CommandExecArgs';
import { Colors } from '../../utils/ColorUtils';

export default class extends Command {
  admin = true;
  minParam = 2;
  dm = true;
  aliases = ['msg'];

  async execute(args: CommandExecArgs) {
    const message = args.message;
    const guild = message.guild;
    const params = args.params;
    if(!params) return;

    const ownerUser = await this.client.users.fetch(this.client.config.ownerId);
    const ownerAvatar = ownerUser.avatarURL({ dynamic: true, size: 256, format: 'png' });
    let user;
    try {
      user = await this.client.users.fetch(params[0]);
    } catch(err) {
      return message.channel.send(new MessageEmbed()
      .setColor(Colors.ERROR_COLOR)
      .setDescription(this.client.translate('commands/message:USER_NOT_FOUND', {
        guild,
        args: {
          id: params[0]
        }
      })));
    }

    const messageToSend = params.slice(1).join(' ');

    const embed = new MessageEmbed()
    .setColor(Colors.DEFAULT_COLOR)
    .setDescription(messageToSend)
    .setTimestamp();

    if(ownerAvatar) embed.setAuthor(`${ownerUser.username}#${ownerUser.discriminator}`, ownerAvatar);
    else embed.setAuthor(`${ownerUser.username}#${ownerUser.discriminator}`);

    return user.send(embed);
  }
}