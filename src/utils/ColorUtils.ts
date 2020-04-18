import { ColorResolvable } from 'discord.js';

export class Colors {
  public static DEFAULT_COLOR: ColorResolvable = [66, 138, 245];
  public static SUCCESS_COLOR: ColorResolvable = [66, 245, 99];
  public static ERROR_COLOR: ColorResolvable = [245, 87, 66];
  public static NORMAL_COLOR: ColorResolvable = [254, 254, 254];
  public static RARE_COLOR: ColorResolvable = [176, 224, 230];
  public static ELITE_COLOR: ColorResolvable = [221, 160, 221];
  public static SUPER_RARE_COLOR: ColorResolvable = [238, 232, 170];
  public static ULTRA_RARE_COLOR: ColorResolvable = [200, 255, 0];
}

export function getColorForRarity(rarity: string, retrofit?: boolean) {
  switch(rarity.toUpperCase()) {
    case 'NORMAL':
      return retrofit ? Colors.RARE_COLOR : Colors.NORMAL_COLOR;
    case 'RARE':
      return retrofit ? Colors.ELITE_COLOR : Colors.RARE_COLOR;
    case 'ELITE':
      return retrofit ? Colors.SUPER_RARE_COLOR : Colors.ELITE_COLOR;
    case 'SUPER RARE':
      return retrofit ? Colors.ULTRA_RARE_COLOR : Colors.SUPER_RARE_COLOR;
    case 'PRIORITY':
      return Colors.SUPER_RARE_COLOR;
    case 'DECISIVE':
      return Colors.ULTRA_RARE_COLOR;
    case 'UNRELEASED':
      return Colors.NORMAL_COLOR;
    default:
      return Colors.DEFAULT_COLOR;
  }
}