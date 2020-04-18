import { Guild } from 'discord.js';

export interface TranslateArgs {
  guild?: Guild | null;
  args?: object;
}