# Changelog

- [v0.3.0](#v030)
- [v0.2.1](#v021)
- [v0.2.0](#v020)
- [v0.1.1](#v011)
- [v0.1.0](#v010)

## v0.3.0

- Notification feature has been added to the bot.
  - Bot will check news (English only) from homepage of [wiki](https://azurlane.koumakan.jp) every 30th min. That means 02.00, 02.30, 03.00 and so on.
  - If you have notifications active in your server, bot will send **all** notifications that you haven't got so far.
  - Simply use `!set notificationchannel` in the channel where you want notifications to be posted.
  - At the moment there is no way to turn off notifications. Although if for some reason you don't want to get them any more you can delete the channel, take bot's permission to send message to notification channel or contact me on my personal server. You can get the invite link from `!about` command.
- Custom prefixes are finaly here.
  - Use `!set prefix [new-prefix]` to change prefix for your server.
  - For now there is no way for you to learn bot's prefix in your server. If you change it, don't forget it.
- Prinz channel.
  - This is a special channel for bot owner (that's me) to send news regarding the bot. These are mostly bot updates (like this one).
  - Use `!set prinzchannel` in the channel where you want news to be posted.
  - You can use the same channel as both `prinz channel` and `notification channel`. I'd suggest to use it like that.

## v0.2.1

- Optimized and improved bot's guesses on your equipment searches.

## v0.2.0

- Bot now parses equipments as well.
- Added `!equipment` command.

## v0.1.1

- i18n fixes
- Bot version added to `about` command.
- Bug fixes.

## v0.1.0

- Initial version.