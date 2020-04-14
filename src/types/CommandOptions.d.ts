import { PermissionResolvable } from 'discord.js';

export interface CommandOptions {
  description?: string;
  usage?: string;
  aliases?: string[];
  dm?: boolean;
  requiredPerms?: PermissionResolvable[];
}