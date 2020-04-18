import { ShipAlias, Ship, UnreleasedShip } from '../types/Ship';

export function getShipNameForAlias(alias: string, shipAliases: ShipAlias[], guildId?: string): string {
  const filtered = shipAliases.filter(a => {
    const check1 = a.alias.toLowerCase() === alias.toLowerCase();
    const check2 = guildId ? (!a.guildId || a.guildId === guildId) : (!a.guildId);
    return check1 && check2;
  });
  if(filtered.length === 1) return filtered[0].shipName;
  else return alias;
}

export function getShip(nameOrId: string, ships: Ship[]): Ship | undefined {
  const filtered = ships.filter(s => s.name.toLowerCase() === nameOrId.toLowerCase() || s.id.toLowerCase() === nameOrId.toLowerCase());
  if(filtered.length === 1) return filtered[0];
}

export function getUnreleasedShip(nameOrId: string, ships: UnreleasedShip[]): UnreleasedShip | undefined {
  const filtered = ships.filter(s => s.name.toLowerCase() === nameOrId.toLowerCase() || s.id.toLowerCase() === nameOrId.toLowerCase());
  if(filtered.length === 1) return filtered[0];
}