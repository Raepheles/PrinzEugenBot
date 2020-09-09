import Cluster from '../structures/Cluster';
import { CronJob } from 'cron';
import { JSDOM } from 'jsdom';
import request from 'request-promise';
import { setLastNotification } from '../Database';
import { MessageEmbed, TextChannel } from 'discord.js';
import { Colors } from '../utils/ColorUtils';

interface News {
  url: string;
  title: string;
  content: string;
  label: string;
}

export default class NotificationHandler {
  public isInit: boolean = false;
  public cronJob: CronJob | undefined;
  client: Cluster;

  constructor(client: Cluster) {
    this.client = client;
  }

  init() {
    return new Promise<void>(resolve => {
      this.cronJob = new CronJob('*/30 * * * *', () => {
        this.getNews().then(async news => {
          for(const key of Object.keys(this.client.guildSettings)) {
            const currentSettings = this.client.guildSettings[key];
            const notificationChannelId = currentSettings.notification?.en.notificationChannelId;
            const lastNotification = currentSettings.notification?.en.lastNotification;
            if(!lastNotification) {
              try {
                await setLastNotification(this.client, key, news[0].content);
              } catch(err) {
                this.client.logger.error(err);
              }
              continue;
            }
            if(lastNotification && news[0].content === lastNotification) continue;
            if(!notificationChannelId) continue;
            let channel;
            try {
              channel = await this.client.channels.fetch(notificationChannelId);
            } catch(err) {
              this.client.logger.error(err);
              continue;
            }
            if(channel.type !== 'text') continue;
            channel = channel as TextChannel;
            // At this point we have our notification channel
            // And we we got new notification
            // Find which notification is last
            const lastIndex = news.findIndex(n => n.content === lastNotification);
            if(lastIndex === -1) {
              // We are missing all notifications or something is buggy.
              // Just send last notification
              this.sendNotification(channel, news, key, 1)
                .catch(this.client.logger.error);
            } else {
              this.sendNotification(channel, news, key, lastIndex)
                .catch(this.client.logger.error);
            }
          }
        });
      }, null, true, 'Europe/Istanbul');
      this.isInit = true;
      resolve();
    });
  }

  async sendNotification(channel: TextChannel, news: News[], guildId: string, count: number) {
    if(count < 1) return;
    const newsToSend = news.slice(0, count + 1).reverse();
    const embed = new MessageEmbed()
      .setTimestamp();
    for(const n of newsToSend) {
      if(n.label === 'UPDATE') embed.setColor(Colors.NOTIFICATION_UPDATE);
      if(n.label === 'EVENT') embed.setColor(Colors.NOTIFICATION_EVENT);
      embed.setURL(n.url);
      embed.setTitle(n.title);
      embed.setDescription(n.content);
      try {
        await channel.send(embed);
        await setLastNotification(this.client, guildId, n.content);
      } catch(err) {
        this.client.logger.error(err);
        break;
      }
    }
  }

  async getNews() {
    const body = await request(this.client.config.wikiBaseUrl);
    const doc = new JSDOM(body).window.document;

    const returnNews = [];

    const blueBox = doc.querySelector('.azl_box.blue');
    if(!blueBox) {
      this.client.logger.error("Notification handler couldn't find blue box");
      return [];
    }
    const news = blueBox.getElementsByClassName('azl_news');
    for(const n of news) {
      const temp: News = {
        title: 'NULL',
        label: 'NULL',
        content: 'NULL',
        url: this.client.config.wikiBaseUrl
      };
      // Title
      const elTitles = n.getElementsByClassName('azl_news_title');
      if(elTitles.length === 0) {
        this.client.logger.error("NotificationHandler couldn't find 'azl_news_title'");
        continue;
      }
      temp.title = elTitles[0].textContent || '';
      // Content
      const elContents = n.getElementsByClassName('azl_news_message');
      if(elContents.length === 0) {
        this.client.logger.error("NotificationHandler couldn't find 'azl_news_message'");
        continue;
      }
      temp.content = elContents[0].textContent || '';
      const elUrl = elContents[0].getElementsByTagName('a');
      if(elUrl.length === 0) {
        this.client.logger.error("NotificationHandler couldn't find <a href> for the news.");
      }
      temp.url = temp.url + elUrl[0].getAttribute('href') || '';
      // Label
      const elLabels = n.getElementsByClassName('azl_news_label');
      if(elLabels.length === 0) {
        this.client.logger.error("NotificationHandler couldn't find 'azl_news_label'");
        continue;
      }
      temp.label = elLabels[0].textContent || '';
      returnNews.push(temp);
    }
    return returnNews;
  }
}