import { BitFieldResolvable, PermissionString } from 'discord.js';

export function getPermissionName(bit: BitFieldResolvable<PermissionString>): string {
  const hexBit = bit.toString(16);
  switch(hexBit) {
    case '1': return 'CREATE_INSTANT_INVITE';
    case '2': return 'KICK_MEMBERS';
    case '4': return 'BAN_MEMBERS';
    case '8': return 'ADMINISTRATOR';
    case '10': return 'MANAGE_CHANNELS';
    case '20': return 'MANAGE_GUILD';
    case '40': return 'ADD_REACTIONS';
    case '80': return 'VIEW_AUDIT_LOG';
    case '400': return 'VIEW_CHANNEL';
    case '800': return 'SEND_MESSAGES';
    case '1000': return 'SEND_TTS_MESSAGES';
    case '2000': return 'MANAGE_MESSAGES';
    case '4000': return 'EMBED_LINKS';
    case '8000': return 'ATTACH_FILES';
    case '10000': return 'READ_MESSAGE_HISTORY';
    case '20000': return 'MENTION_EVERYONE';
    case '40000': return 'USE_EXTERNAL_EMOJIS';
    case '80000': return 'VIEW_GUILD_INSIGHTS';
    case '100000': return 'CONNECT';
    case '200000': return 'SPEAK';
    case '400000': return 'MUTE_MEMBERS';
    case '800000': return 'DEAFEN_MEMBERS';
    case '1000000': return 'MOVE_MEMBERS';
    case '2000000': return 'USE_VAD';
    case '100': return 'PRIORITY_SPEAKER';
    case '200': return 'STREAM';
    case '4000000': return 'CHANGE_NICKNAME';
    case '8000000': return 'MANAGE_NICKNAMES';
    case '10000000': return 'MANAGE_ROLES';
    case '20000000': return 'MANAGE_WEBHOOKS';
    case '40000000': return 'MANAGE_EMOJIS';
    default: return 'UNKOWN_PERMISSION_BIT';
  }
}