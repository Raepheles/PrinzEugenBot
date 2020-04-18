import { MessageEmbed, TextChannel } from 'discord.js';
import Command from '../../structures/Command';
import { CommandExecArgs } from '../../types/CommandExecArgs';
import { Colors } from '../../utils/ColorUtils';


export default class extends Command {
  dm = true;
  minParam = 1;
  aliases = ['fb'];

  async execute(args: CommandExecArgs) {
    const message = args.message;
    const guild = message.guild;
    const params = args.params;
    const author = message.author;
    const avatar = author.avatarURL({ dynamic: true, size: 256, format: 'png' });
    const settings = guild ? this.client.guildSettings[guild.id] : undefined;
    const prefix = settings ? settings.prefix : this.client.config.prefix;
    const botName = this.client.user?.username;

    if(!params) return; // This shouldn't happen because of minParam = 1 value.

    const msg: string = params.join(' ');
    const embedAuthor: string = `${message.author.username}#${message.author.discriminator} - ${message.author.id}`;

    const embed = new MessageEmbed()
    .setTimestamp()
    .setAuthor(embedAuthor)
    .setDescription(msg)
    .setColor(Colors.DEFAULT_COLOR);

    if(avatar) embed.setThumbnail(avatar);

    try {
      const feedbackChannel = await this.client.channels.fetch(this.client.config.feedbackChannelId) as TextChannel;
      await feedbackChannel.send(embed);
      return message.channel.send(new MessageEmbed()
          .setDescription(this.client.translate('commands/feedback:SUCCESS', { guild: message.guild }))
          .setColor(Colors.SUCCESS_COLOR)
        );
    } catch(err) {
      this.client.logger.error(err);
      return message.channel.send(new MessageEmbed()
          .setDescription(this.client.translate('commands/feedback:FAIL', {
            guild: message.guild,
            args: {
              prefix,
              botName
            }
          }))
          .setColor(Colors.ERROR_COLOR)
        );
    }
  }
}