import { Equipment, EquipmentType } from '../types/ParseData';
import { didYouMean } from './StringUtils';

export function getEquipment(name: string, equipments: Equipment[]): Equipment | undefined {
  const suggestions = didYouMean(name, equipments.map(e => e.name));
  if(suggestions.length > 0) name = suggestions[0].toLowerCase();
  return equipments.find(eq => eq.name.toLowerCase() === name);
}

export function getEquipmentType(equipment: Equipment, type: string): EquipmentType | undefined {
  switch(type) {
    case 'type0':
      return equipment.type0;
    case 'type1':
      return equipment.type1;
    case 'type2':
      return equipment.type2;
    case 'type3':
      return equipment.type3;
  }
}