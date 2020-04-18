export interface ShipWrapper {
  code: string;
  name: string;
  rarity: string;
  retrofit?: ShipWrapper;
}

export interface Ship {
  name: string;
  id: string;
  url: string;
  rarity: string;
  type: string;
  nationality: string;
  construction: ShipConstruction;
  misc: ShipMisc;
  skills: ShipSkill[];
  stats: { [key: string]: ShipStats };
  images: ShipImages;
  retrofit?: ShipRetrofit;
  class: string;
}

export interface ShipMisc {
  [key: string]: { name: string, url?: string };
}

export interface ShipSkill {
  type: string;
  name: string;
  description: string;
}

export interface ShipRetrofit {
  stats: { [key: string]: ShipStats };
}

export interface ShipImages {
  skins?: { name: string, url: string}[];
  chibis?: { name: string, url: string}[];
  default?: string;
  chibi?: string;
  icon?: string;
}

export interface ShipStats {
  evasion: string;
  aviation: string;
  health: string;
  luck: string;
  armor: string;
  reload: string;
  antiAir: string;
  torpedo: string;
  oilConsumption: string;
  antiSubmarine: string;
  firepower: string;
}

export interface ShipConstruction {
  drop?: string;
  additional?: string;
  text: string;
  time: string;
}

export interface ShipParse {
  date: Date;
  ships: Ship[];
  unreleasedShips: UnreleasedShip[];
}


export interface UnreleasedShip {
  name: string;
  id: string;
  rarity: string;
  url: string;
  description?: string;
  image?: string;
}

export interface ShipAlias {
  alias: string;
  shipName: string;
  guildId?: string;
}