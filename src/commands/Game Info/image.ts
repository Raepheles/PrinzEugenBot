import { MessageEmbed, User, MessageReaction } from 'discord.js';
import Command from '../../structures/Command';
import { getShipNameForAlias, getShip, getUnreleasedShip } from '../../utils/ShipUtils';
import { CommandExecArgs } from '../../types/CommandExecArgs';
import Flag from '../../structures/Flag';
import { Colors, getColorForRarity } from '../../utils/ColorUtils';
import { getReactionFromNumber, getNumberFromReaction } from '../../utils/ReactionUtils';

export default class extends Command {
  dm = true;
  minParam = 1;
  aliases = ['img'];
  acceptedFlags = [
    new Flag('skins', 1),
    new Flag('skin', 1),
    new Flag('chibi', 2)
  ];

  async execute(args: CommandExecArgs) {
    const message = args.message;
    const params = args.params;
    const flags = args.flags;
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

    const skinFlag = (flags && (flags.includes('skins') || flags.includes('skin'))) || false;
    const chibiFlag = (flags && flags.includes('chibi')) || false;

    if(ship && skinFlag) {
      embed.setTitle(`${ship.id} - ${ship.name}`)
      .setURL(`${ship.url}`);

      const skins = chibiFlag ? ship.images.chibis : ship.images.skins;

      if(!skins || skins.length === 0) {
        embed.setDescription(this.client.translate('commands/image:NO_SKINS', {
          guild,
          args: { shipName }
        }))
        .setColor(Colors.ERROR_COLOR);

        return message.channel.send(embed);
      }

      const timeout = 30;
      const maxChoices = skins.length;
      const desc = this.client.translate('commands/image:SKIN_EMBED_DESCRIPTION', {
        guild,
        args: { timeout }
      });
      const list: string[] = [];

      skins.forEach((skin, i) => list.push(`**${i+1}. ${skin.name}**`));
      embed.setDescription(`${desc}\n\n${list.join('\n')}`)
      .setColor(Colors.SUCCESS_COLOR);

      const response = await message.channel.send(embed);

      const reactionFilter = (reaction: MessageReaction, user: User) => {
        const reactionNo = getNumberFromReaction(reaction.emoji.toString());
        return reactionNo >= 1 && reactionNo <= maxChoices && user.id === message.author.id;
      };

      const collector = response.createReactionCollector(reactionFilter, { time: timeout * 1000, dispose: true });

      for(let i = 1; i <= maxChoices; i++) {
        response.react(getReactionFromNumber(i)).catch(err => err);
      }

      const reactionHandle = (reaction: MessageReaction) => {
        const selection = getNumberFromReaction(reaction.emoji.toString());
        const selectedSkin = skins[selection-1];
        const newResponse = response.embeds[0]
        .setDescription('')
        .setTitle(`${ship.id} - ${shipName} - ${selectedSkin.name}`)
        .setURL(`${ship.url}`)
        .setImage(selectedSkin.url)
        .setColor(getColorForRarity(ship.rarity, selectedSkin.name.toLowerCase() === 'retrofit'));
        message.channel.send(newResponse);
        collector.stop();
      };

      collector.on('collect', reactionHandle);
      collector.on('remove', reactionHandle);

      collector.on('end', () => {
        response.delete();
      });

    } else if(ship) {
      embed.setTitle(`${ship.id} - ${ship.name}`)
      .setURL(`${ship.url}`);

      if(chibiFlag && ship.images.chibi) {
        embed.setImage(ship.images.chibi);
      } else if(ship.images.default) {
        embed.setImage(ship.images.default);
      } else {
        embed.setDescription(this.client.translate('commands/image:IMAGE_NOT_FOUND', {
          guild,
          args: { shipName }
        })).setColor(Colors.ERROR_COLOR);
      }

      return message.channel.send(embed);
    } else if(unreleasedShip) {
      embed.setTitle(`${unreleasedShip.id} - ${unreleasedShip.name}`)
      .setURL(`${unreleasedShip.url}`)
      .setColor(getColorForRarity(unreleasedShip.rarity))
      .setFooter(this.client.translate('common:UNRELEASED_SHIP', { guild }));

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