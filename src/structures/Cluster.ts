import { getLogger, Logger } from 'log4js';
import { Client, Guild } from 'discord.js';
import CommandHandler from '../handlers/CommandHandler';
import config from '../../config.json';
import EventHandler from '../handlers/EventHandler';
import { DiscordLogger } from '../utils/DiscordLogger';
import { Connection } from 'mongoose';
import { TFunction } from 'i18next';
import i18n from '../i18n';
import { GuildSettingsList } from '../types/GuildSettings';

export default class Cluster extends Client {
  public logger: Logger;
  public database: Connection;
  public guildSettings: GuildSettingsList;
  public config = config;
  public i18n: Map<string, TFunction> = new Map();
  public discordLogger = new DiscordLogger(this);
  public commands = new CommandHandler(this);
  public events = new EventHandler(this);

  public constructor(conn: Connection) {
    super();
    this.logger = getLogger();
    this.logger.level = config.logLevel;
    this.guildSettings = {};
    this.database = conn;
  }

  public async login(token: string): Promise<string> {
    if(!this.commands.isInit) {
      throw new Error('Use init() method on CommandHandler first.');
    } else if(!this.events.isInit) {
      throw new Error('Use init() method on EventHandler first.');
    }
    this.i18n = await i18n();
    return super.login(token);
  }

  public translate(key: string, guild?: Guild | null, args?: object): string {
    let language = 'en-US';
    if(guild && this.guildSettings[guild.id] && this.guildSettings[guild.id].language) {
      language = this.guildSettings[guild.id].language;
    }

    const res = this.i18n.get(language);

    if(!res) throw Error('Invalid language set in settings');

    return res(key, args);
  }
}