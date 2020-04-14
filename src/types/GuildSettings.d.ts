export interface GuildSettings {
  _id: string;
  name: string;
  ownerId: string;
  prefix?: string;
  language: string;
  created_date: Date;
  last_update: Date;
}

export interface GuildSettingsList {
  [key: string]: GuildSettings;
}