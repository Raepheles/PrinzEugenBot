import { Message } from 'discord.js';

export interface CommandExecArgs {
  message: Message;
  params?: string[];
  flags?: string[];
}