import { MessageEmbed } from 'discord.js';
import Command from '../../structures/Command';
import { getShipNameForAlias, getShip, getUnreleasedShip } from '../../utils/ShipUtils';
import { CommandExecArgs } from '../../types/CommandExecArgs';
import { Colors, getColorForRarity } from '../../utils/ColorUtils';

export default class extends Command {
  dm = true;
  minParam = 1;
  aliases = ['htg'];

  async execute(args: CommandExecArgs) {
    const message = args.message;
    const params = args.params;
    if(!params) return;

    const guild = message.guild;

    const embed = new MessageEmbed()
    .setTimestamp()
    .setFooter(this.client.translate('commands/general:REQUESTED_BY', {
      guild,
      args: {
        user: message.author.username,
        hash: message.author.discriminator
      }
    }));

    const shipName = getShipNameForAlias(params.join(' '), this.client.shipAliases, guild?.id);
    const ship = getShip(shipName, this.client.ships);
    const unreleasedShip = getUnreleasedShip(shipName, this.client.unreleasedShips);

    if(ship) {
      embed.setTitle(`${ship.id} - ${ship.name}`)
      .setURL(`${ship.url}`)
      .addFields([{
        name: 'Construction',
        value: ship.construction.text,
        inline: false
      }, {
        name: 'Drop',
        value: ship.construction.drop || this.client.translate('commands/howtoget:NO_DROP', { guild }),
        inline: false
      }]);

      if(ship.construction.additional) embed.addField('Additional', ship.construction.additional, false);

      embed.setColor(getColorForRarity(ship.rarity));

      if(ship.images.icon) embed.setThumbnail(ship.images.icon);

      return message.channel.send(embed);
    } else if(unreleasedShip) {
      embed.setTitle(`${unreleasedShip.id} - ${unreleasedShip.name}`)
      .setURL(`${unreleasedShip.url}`)
      .setColor(getColorForRarity(unreleasedShip.rarity))
      .setDescription(this.client.translate('commands/howtoget:UNRELEASED_SHIP', { guild }));

      if(unreleasedShip.image) embed.setImage(unreleasedShip.image);

      return message.channel.send(embed);
    } else {
      embed.setDescription(this.client.translate('commands/general:SHIP_NOT_FOUND', {
        guild,
        args: { shipName }
      }))
      .setColor(Colors.ERROR_COLOR);
      return message.channel.send(embed);
    }
  }
}