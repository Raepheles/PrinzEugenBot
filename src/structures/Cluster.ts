import { Logger } from 'log4js';
import { Client } from 'discord.js';
import CommandHandler from '../handlers/CommandHandler';
import config from '../../config.json';
import EventHandler from '../handlers/EventHandler';
import { DiscordLogger } from '../utils/DiscordLogger';
import { Connection } from 'mongoose';
import { TFunction } from 'i18next';
import i18n from '../i18n';
import { GuildSettingsList } from '../types/GuildSettings';
import { ShipAlias, Ship, UnreleasedShip } from '../types/Ship';
import { TranslateArgs } from '../types/TranslateArgs';

export default class Cluster extends Client {
  public logger: Logger;
  public database: Connection;
  public guildSettings: GuildSettingsList;
  public lastDataUpdate: Date;
  public ships: Ship[];
  public unreleasedShips: UnreleasedShip[];
  public config = config;
  public shipAliases: ShipAlias[] = [];
  public i18n: Map<string, TFunction> = new Map();
  public discordLogger = new DiscordLogger(this);
  public commands = new CommandHandler(this);
  public events = new EventHandler(this);

  public constructor(conn: Connection, logger: Logger, ships: Ship[], unreleasedShips: UnreleasedShip[], lastDataUpdate: Date) {
    super();
    this.logger = logger;
    this.guildSettings = {};
    this.database = conn;
    this.ships = ships;
    this.lastDataUpdate = lastDataUpdate;
    this.unreleasedShips = unreleasedShips;
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

  public translate(key: string, translateArgs?: TranslateArgs): string {
    const guild = translateArgs && translateArgs.guild;
    const args = translateArgs && translateArgs.args;
    let language = 'en-US';
    if(guild && this.guildSettings[guild.id] && this.guildSettings[guild.id].language) {
      language = this.guildSettings[guild.id].language;
    }

    const res = this.i18n.get(language);

    if(!res) throw Error('Invalid language set in settings');

    return res(key, args);
  }
}