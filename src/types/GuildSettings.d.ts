export interface GuildSettings {
  _id: string;
  name: string;
  ownerId: string;
  prefix: string;
  language: string;
  prinzChannelId: string;
  notification?: { [key: string]: NotificationSettings };
  created_date: Date;
  last_update: Date;
}

export interface NotificationSettings {
  notificationChannelId: string;
  lastNotification: string;
}

export interface GuildSettingsList {
  [key: string]: GuildSettings;
}