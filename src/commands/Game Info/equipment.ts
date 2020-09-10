import { MessageEmbed } from 'discord.js';
import Command from '../../structures/Command';
import { CommandExecArgs } from '../../types/CommandExecArgs';
import Flag from '../../structures/Flag';
import { Colors, getColorForRarity } from '../../utils/ColorUtils';
import { EquipmentType } from '../../types/ParseData';
import { getEquipment, getEquipmentType } from '../../utils/EquipmentUtils';

export default class extends Command {
  dm = true;
  minParam = 1;
  aliases = ['eq'];
  acceptedFlags = [
    new Flag('type1', 1),
    new Flag('type2', 1),
    new Flag('type3', 1),
    new Flag('type0', 1)
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

    const equipment = getEquipment(params.join(' '), this.client.equipments);

    if(equipment) {
      const type: string = flags ? flags[0] : '';
      let equipmentType: EquipmentType | undefined;
      if(type) {
        equipmentType = getEquipmentType(equipment, type);
        if(!equipmentType) {
          embed.setDescription(this.client.translate('commands/equipment:EQUIPMENT_TYPE_NOT_FOUND', {
            guild,
            args: { equipmentName: equipment.name, type }
          }))
          .setColor(Colors.ERROR_COLOR);
          return message.channel.send(embed);
        }
      } else {
        equipmentType = getEquipmentType(equipment, 'type0')
          || getEquipmentType(equipment, 'type3')
          || getEquipmentType(equipment, 'type2')
          || getEquipmentType(equipment, 'type1');
      }
      if(!equipmentType) {
        embed.setDescription(this.client.translate('commands/equipment:NO_EQUIPMENT_TYPE', {
          guild,
          args: { equipmentName: equipment.name }
        }))
        .setColor(Colors.ERROR_COLOR);
        return message.channel.send(embed);
      }

      const stats: string[] = [];

      Object.keys(equipmentType.stats).forEach(key => {
        const value = equipmentType?.stats[key];
        stats.push(`**${key}:** ${value}`);
      });

      const info: string[] = [];
      info.push(`**Type:** ${equipment.type}`);
      info.push(`**Nation:** ${equipment.nation}`);
      info.push(`**Main Users:** ${equipment.mainUsers.join(', ')}`);
      if(equipment.secondaryUsers) info.push(`**Secondary Users:** ${equipment.secondaryUsers.join(', ')}`);

      const additionalInfo = `**Obtained From:** ${equipmentType.obtainedFrom}\n**Notes:** ${equipmentType.notes}`;

      embed.setTitle(`${equipment.name}`)
      .setURL(`${equipment.url}`)
      .addFields([{
        name: 'Info',
        value: info.join('\n'),
        inline: false
      }, {
        name: 'Stats',
        value: stats.slice(0, stats.length/2).join('\n'),
        inline: true
      }, {
        name: 'Stats',
        value: stats.slice(stats.length/2, stats.length).join('\n'),
        inline: true
      }, {
        name: 'Additional Info',
        value: additionalInfo,
        inline: false
      }])
      .setColor(getColorForRarity(equipmentType.rarity));

      if(equipment.image) embed.setThumbnail(equipment.image);

      return message.channel.send(embed);
    } else {
      embed.setDescription(this.client.translate('commands/equipment:EQUIPMENT_NOT_FOUND', {
        guild,
        args: { equipmentName: params.join(' ') }
      }))
      .setColor(Colors.ERROR_COLOR);
      return message.channel.send(embed);
    }
  }
}