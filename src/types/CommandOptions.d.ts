import { PermissionResolvable } from 'discord.js';
import Flag from '../structures/Flag';

export interface CommandOptions {
  description?: string;
  usage?: string;
  aliases?: string[];
  dm?: boolean;
  requiredPerms?: PermissionResolvable[];
  acceptedFlags?: Flag[];
  maxParam?: number;
  minParam?: number;
  admin?: boolean;
}