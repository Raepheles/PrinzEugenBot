import { MessageEmbed } from 'discord.js';
import Command from '../../structures/Command';
import { getShipNameForAlias, getShip, getUnreleasedShip } from '../../utils/ShipUtils';
import { CommandExecArgs } from '../../types/CommandExecArgs';
import Flag from '../../structures/Flag';
import { Colors, getColorForRarity } from '../../utils/ColorUtils';
import { ShipStats } from '../../types/Ship';

export default class extends Command {
  dm = true;
  minParam = 1;
  acceptedFlags = [
    new Flag('lv100', 1),
    new Flag('lv120', 1),
    new Flag('base', 1),
    new Flag('retrofit', 2)
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

    if(ship) {
      const isRetrofit: boolean = (flags && flags.includes('retrofit')) || false;
      if(flags && flags.includes('retrofit') && !ship.retrofit) {
        embed.setDescription(this.client.translate('commands/ship:SHIP_RETROFIT_NOT_FOUND', {
          guild,
          args: { shipName }
        }))
        .setColor(Colors.ERROR_COLOR);
        return message.channel.send(embed);
      }

      const stats1: string[] = [];
      const stats2: string[] = [];

      let stats: ShipStats;
      if(flags && flags.includes('lv120')) {
        stats = flags.includes('retrofit') && ship.retrofit ? ship.retrofit.stats.lv120 : ship.stats.lv120;
      } else if(flags && flags.includes('lv100')) {
        stats = flags.includes('retrofit') && ship.retrofit ? ship.retrofit.stats.lv100 : ship.stats.lv120;
      } else if(flags && flags.includes('base')) {
        stats = ship.stats.base;
      } else {
        stats = ship.stats.lv100;
      }

      stats1.push(`**Evasion:** ${stats.evasion}`);
      stats1.push(`**Aviation:** ${stats.aviation}`);
      stats1.push(`**Health:** ${stats.health}`);
      stats1.push(`**Luck:** ${stats.luck}`);
      stats1.push(`**Armor:** ${stats.armor}`);
      stats1.push(`**Reload:** ${stats.reload}`);

      stats2.push(`**Anti-air:** ${stats.antiAir}`);
      stats2.push(`**Torpedo:** ${stats.torpedo}`);
      stats2.push(`**Oil consumption:** ${stats.oilConsumption}`);
      stats2.push(`**Anti-submarine:** ${stats.antiSubmarine}`);
      stats2.push(`**Firepower:** ${stats.firepower}`);

      const skills: string[] = [];
      ship.skills.forEach(skill => skills.push(`**[${skill.type}] ${skill.name}:** ${skill.description}`));

      const misc: string[] = [];
      Object.keys(ship.misc).forEach(key => {
        const url = ship.misc[key].url;
        const name = ship.misc[key].name;
        if(url) misc.push(`**${key}:** [${name}](${url})`);
        else misc.push(`**${key}:** ${name}`);
      });

      embed.setTitle(`${ship.id} - ${ship.name}`)
      .setURL(`${ship.url}`)
      .addFields([{
        name: 'Class',
        value: ship.class,
        inline: true
      }, {
        name: 'Nationality',
        value: ship.nationality,
        inline: true
      }, {
        name: 'Type',
        value: ship.type,
        inline: true
      }, {
        name: 'Construction Time',
        value: ship.construction.time,
        inline: true
      }, {
        name: 'Stats',
        value: stats1.join('\n'),
        inline: true
      }, {
        name: 'Stats',
        value: stats2.join('\n'),
        inline: true
      }, {
        name: 'Skills',
        value: skills.join('\n'),
        inline: false
      }, {
        name: 'Misc',
        value: misc.join('\n'),
        inline: false
      }])
      .setColor(getColorForRarity(ship.rarity, isRetrofit));

      if(ship.images.icon) embed.setThumbnail(ship.images.icon);

      return message.channel.send(embed);
    } else if(unreleasedShip) {
      embed.setTitle(`${unreleasedShip.id} - ${unreleasedShip.name}`)
      .setURL(`${unreleasedShip.url}`)
      .setColor(getColorForRarity(unreleasedShip.rarity))
      .setFooter(this.client.translate('common:UNRELEASED_SHIP', { guild }));

      if(unreleasedShip.image) embed.setImage(unreleasedShip.image);
      if(unreleasedShip.description) embed.setDescription(unreleasedShip.description);

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