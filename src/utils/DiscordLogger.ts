import Cluster from '../structures/Cluster';
import { TextChannel } from 'discord.js';

export class DiscordLogger {
  client: Cluster;
  logChannelId: string;

  constructor(client: Cluster) {
    this.client = client;
    this.logChannelId = this.client.config.logChannelId;
  }

  async log(message: string) {
    if(!this.logChannelId) return;
    await this.client.channels.fetch(this.logChannelId)
      .then(channel => {
        if(channel.type === 'text') {
          const textChannel = channel as TextChannel;
          textChannel.send(message);
        } else {
          this.client.logger.error('Error trying to log to discord channel: Discord channel is not type of "text".');
        }
      })
      .catch(err => {
        this.client.logger.error(`Error trying to log to discord channel: ${err}`);
      });
  }
}