import { ShipWrapper, Ship, ShipSkill, ShipStats, ShipImages, ShipMisc, ShipConstruction, ShipRetrofit, UnreleasedShip, ParseData, Equipment, EquipmentType, EquipmentStats } from './types/ParseData';
import request from 'request-promise';
import { JSDOM } from 'jsdom';
import { Logger } from 'log4js';
import { getTimeFromMs } from './utils/TimeUtils';

interface ShipData {
  ships: Ship[];
  unreleasedShips: UnreleasedShip[];
}

interface EquipmentMisc {
  obtainedFrom?: string;
  notes?: string;
}

interface EquipmentUsers {
  mainUsers: string[];
  secondaryUsers?: string[];
}

export class Parser {
  logger: Logger;
  wikiUrl: string;
  shipsUrl: string;
  equipmentsUrl: string;

  constructor(logger: Logger, wikiUrl: string, shipsUrl: string, equipmentsUrl: string) {
    this.logger = logger;
    this.wikiUrl = wikiUrl;
    this.shipsUrl = shipsUrl;
    this.equipmentsUrl = equipmentsUrl;
  }

  public async parse(): Promise<ParseData> {
    const { ships, unreleasedShips } = await this.parseShips();
    const equipments = await this.parseEquipments();
    return {
      date: new Date(),
      ships,
      unreleasedShips,
      equipments
    };
  }

  public async parseShips(): Promise<ShipData> {
    const start = Date.now();
    this.logger.info('Started parsing ships.');
    const shipWrappers: ShipWrapper[] = await this.getShipList();
    this.logger.info(`Parsed ship list in ${getTimeFromMs(Date.now() - start, true)}`);
    const ships: Ship[] = [];
    const unreleasedShips: UnreleasedShip[] = [];
    const total = shipWrappers.length;
    let failed = 0;

    for(const shipWrapper of shipWrappers) {
      try {
        const shipParseStart = Date.now();
        const ship: Ship | UnreleasedShip = await this.getShip(shipWrapper);
        this.logger.trace(`Parsed ${shipWrapper.name} in ${getTimeFromMs(Date.now() - shipParseStart, true)}`);
        if('image' in ship) unreleasedShips.push(ship as UnreleasedShip);
        else ships.push(ship as Ship);
      } catch(err) {
        failed++;
        const errStr = `${err}`;
        this.logger.error(`Error while parsing ${shipWrapper.name}: ${errStr.length >= 128 ? errStr.substr(0, 127) : errStr}`);
      }
    }
    this.logger.info(`Parsed ${total - failed} ships out of ${total} in ${getTimeFromMs(Date.now() - start, true)}`);
    return {
      ships,
      unreleasedShips
    };
  }

  public async parseEquipments(): Promise<Equipment[]> {
    const start = Date.now();
    this.logger.info('Started parsing equipments.');
    const equipmentNames: string[] = await this.getEquipmentList();
    this.logger.info(`Parsed equipment list in ${getTimeFromMs(Date.now() - start, true)}`);
    const equipments: Equipment[] = [];
    const total = equipmentNames.length;
    let failed = 0;

    for(const equipmentName of equipmentNames) {
      try {
        const equipmentParseStart = Date.now();
        const equipment = await this.getEquipment(equipmentName);
        this.logger.trace(`Parsed ${equipmentName} in ${getTimeFromMs(Date.now() - equipmentParseStart, true)}`);
        equipments.push(equipment);
      } catch(err) {
        failed++;
        const errStr = `${err}`;
        this.logger.error(`Error while parsing ${equipmentName}: ${errStr.length >= 128 ? errStr.substr(0, 127) : errStr}`);
      }
    }
    this.logger.info(`Parsed ${total - failed} equipments out of ${total} in ${getTimeFromMs(Date.now() - start, true)}`);
    return equipments;
  }

  private async getEquipmentList(): Promise<string[]> {
    const mainBody = await request(this.equipmentsUrl);
    const mainDoc = new JSDOM(mainBody).window.document;

    const equipmentNames: string[] = [];

    const list = mainDoc.getElementById('Equipment_Lists')?.parentElement?.nextElementSibling?.children;
    if(!list) throw Error("Couldn't find <ul> children in equipment lists page.");

    for(const li of list) {
      const href = li.firstElementChild?.getAttribute('href');
      if(!href) continue;
      const body = await request(this.wikiUrl + href);
      const doc = new JSDOM(body).window.document;

      const tbody = doc.querySelector('.tabbertab > table')?.getElementsByTagName('tbody').item(0);
      if(!tbody) throw Error("Couldn't find tbody under first element with tabbertab class.");

      for(const td of tbody.children) {
        const name = td.firstElementChild?.textContent?.trim();
        if(!name || equipmentNames.includes(name)) continue;
        equipmentNames.push(name);
      }
    }

    return equipmentNames;
  }

  private async getEquipment(equipmentName: string): Promise<Equipment> {
    const url = `${this.wikiUrl}/${encodeURI(equipmentName)}`;
    const body = await request(url);
    const doc = new JSDOM(body).window.document;

    const name = equipmentName;
    let image = doc.querySelector('.image > img')?.getAttribute('src') || undefined;
    if(image) image = this.wikiUrl + image;
    let type1: EquipmentType | undefined;
    let type2: EquipmentType | undefined;
    let type3: EquipmentType | undefined;
    let type0: EquipmentType | undefined;

    const eqBoxes = doc.getElementsByClassName('eq-box');
    if(!eqBoxes) throw Error(`Couldn't find elements with class 'eq-box' for ${equipmentName}`);

    const firstEqBox = eqBoxes.item(0);
    if(!firstEqBox) throw Error(`eqBoxes is empty for ${equipmentName}`);

    // Parsing head
    const eqHead = firstEqBox.getElementsByClassName('eq-head').item(0);
    if(!eqHead) throw Error(`Couldn't find eq-head under eq-box for ${equipmentName}`);

    const eqInfo = eqHead.querySelector('.eq-gen > .eq-info');
    if(!eqInfo) throw Error(`Couldn't find eq-info under eq-gen for ${equipmentName}}`);

    const eqInfoTbody = eqInfo.getElementsByTagName('tbody').item(0);
    if(!eqInfoTbody) throw Error(`Couldn't find tbody under eq-info for ${equipmentName}`);

    const tds = eqInfoTbody.getElementsByTagName('td');
    if(!tds) throw Error(`Couldn't find any td under tbody under eq-info for ${equipmentName}`);

    const type = tds.item(0)?.textContent?.trim();
    const nation = tds.item(2)?.textContent?.trim();
    if(!type || !nation) {
      throw Error(`Couldn't get type, rarity or nation for ${equipmentName}`);
    }

    const { mainUsers, secondaryUsers } = this.getEquipmentUsers(firstEqBox, equipmentName);

    for(const eqBox of eqBoxes) {
      const eqBoxHead = eqBox.getElementsByClassName('eq-head').item(0);
      if(!eqBoxHead) throw Error(`Couldn't find eq-head for ${equipmentName}`);

      const tier = eqBoxHead.querySelector('.eq-title > .eqtech')?.textContent;
      if(!tier) throw Error(`Couldn't find equipment tier for ${equipmentName}`);

      const rarity = eqBox.getElementsByClassName('eq-head')
      .item(0)
      ?.querySelector('.eq-gen > .eq-info')
      ?.getElementsByTagName('tbody').item(0)
      ?.getElementsByTagName('td')
      .item(1)
      ?.textContent
      ?.trim()
      .replace(/★/g, '');
      if(!rarity) throw Error(`Couldn't get rarity for ${equipmentName} - ${tier}`);

      const stats = this.getEquipmentStats(eqBox, equipmentName, tier);
      const { obtainedFrom, notes } = this.getEquipmentMisc(eqBox);
      const tmp: EquipmentType = {
        stats,
        rarity,
        obtainedFrom,
        notes
      };
      switch(tier) {
        case 'T0':
          type0 = tmp;
          break;
        case 'T1':
          type1 = tmp;
          break;
        case 'T2':
          type2 = tmp;
          break;
        case 'T3':
          type3 = tmp;
          break;
        default:
          throw Error(`Unknown tier ${tier} for ${equipmentName}`);
      }
    }

    return {
      name,
      url,
      image,
      mainUsers,
      secondaryUsers,
      type,
      nation,
      type1,
      type2,
      type3,
      type0
    };
  }

  private getEquipmentStats(eqBox: Element, eqName: string, eqTier: string): EquipmentStats {
    const eqStatsTbody = eqBox.getElementsByClassName('eq-stats').item(0)?.getElementsByTagName('tbody').item(0);
    if(!eqStatsTbody) throw Error(`Couldn't find eq-stats tbody for ${eqName} - ${eqTier}`);

    const eqStats: EquipmentStats = {};

    for(const child of eqStatsTbody.children) {
      if(child.children.length !== 2) continue;
      const key = child.firstElementChild?.firstElementChild?.getAttribute('alt') || child.firstElementChild?.textContent?.trim();
      const value = child.lastElementChild?.textContent?.trim();
      if(!key || !value) continue;
      eqStats[key] = value;
    }

    return eqStats;
  }

  private getEquipmentMisc(eqBox: Element): EquipmentMisc {
    let obtainedFrom: string | undefined;
    let notes: string | undefined;

    const trs = eqBox.getElementsByTagName('tr');
    for(const tr of trs) {
      const thContent = tr.firstElementChild?.textContent?.toLowerCase().trim();
      const tdContent = tr.lastElementChild?.textContent?.trim();
      if(thContent === 'obtained from') {
        obtainedFrom = tdContent;
      } else if(thContent === 'notes') {
        notes = tdContent;
      }
    }

    return {
      obtainedFrom,
      notes
    };
  }

  private getEquipmentUsers(eqBox: Element, eqName: string): EquipmentUsers {
    const trs = eqBox.getElementsByClassName('eq-fits').item(0)?.getElementsByTagName('tr');
    if(!trs) throw Error(`Couldn't find <tr> elements under eq-fits for ${eqName}`);

    const mainUsers: string[] = [];
    const secondaryUsers: string[] = [];

    for(const tr of trs) {
      const tdFirst = tr.firstElementChild?.textContent?.trim();
      const tdLastClass = tr.lastElementChild?.getAttribute('class');
      if(!tdFirst || !tdLastClass) continue;
      if(tdLastClass === 'yes') {
        mainUsers.push(tdFirst);
      } else if(tdLastClass === 'maybe') {
        secondaryUsers.push(tdFirst);
      }
    }
    return {
      mainUsers,
      secondaryUsers: secondaryUsers.length !== 0 ? secondaryUsers : undefined
    };
  }

  private async getShipList(): Promise<ShipWrapper[]> {
    const body = await request(this.shipsUrl);
    const doc = new JSDOM(body).window.document;

    const elements = doc.querySelectorAll('[data-sort-value]');

    const ships: ShipWrapper[] = [];

    if(!elements) return ships;

    for(let i = 0; i < elements.length; i += 2) {
      if(elements.length <= i+1) throw Error('Ship elements out of boundary. Wiki changed?');

      const e = elements[i];
      const code = e.textContent;
      if(!code) throw Error('Code is empty.');
      if(!e.firstElementChild) throw Error('Element doesn\'t have first child (name element). Wiki changed?');
      const name = e.firstElementChild.getAttribute('title');
      if(!name) throw Error('Ship name is empty.');
      const rarity = elements[i+1].textContent;
      if(!rarity) throw Error('Rarity is empty.');
      let isRetrofit = false;

      if(code.startsWith('3') && code.length === 4) {
        isRetrofit = true;
      }
      if(!isRetrofit) {
        ships.push({ name, code, rarity });
      } else {
        for(const j in ships) {
          if(ships[j].code === code.substr(1)) {
            ships[j] = { ...ships[j], retrofit: { code, name, rarity } };
            break;
          }
        }
      }
    }
    return ships;
  }

  private async getShip(shipWrapper: ShipWrapper): Promise<Ship | UnreleasedShip> {
    const body = await request(`${this.wikiUrl}/${this.urlEncode(shipWrapper.name)}`);
    const doc = new JSDOM(body).window.document;

    const name = shipWrapper.name;
    const id = shipWrapper.code;
    const rarity = shipWrapper.rarity;

    // Check if ship is unreleased
    let unreleased = false;
    const els = doc.getElementsByClassName('mw-parser-output').item(0)?.children;
    if(!els) {
      unreleased = true;
    } else {
      for(const el of els) {
        const hel = el as HTMLElement;
        if(!hel) continue;
        if(hel.tagName.toLowerCase() === 'div' && hel.style.display.toLowerCase() === 'none') unreleased = true;
      }
    }
    if(unreleased && els) {
      const imageQuerySelector = doc.querySelector(`[alt*="${name}"`);
      let image = imageQuerySelector?.getAttribute('src');
      if(!image) {
        image = undefined;
      } else {
        image = this.wikiUrl + image;
        image = image.substr(0, image.indexOf('.png')) + '.png';
        image = image.replace(/\/thumb/g, '');
      }

      const description = els[0].tagName.toLowerCase() === 'p' ? els[0].textContent?.trim() : undefined;
      const unreleasedShip: UnreleasedShip = {
        name,
        description,
        id,
        rarity,
        image,
        url: `${this.wikiUrl}/${this.urlEncode(name)}`
      };
      return unreleasedShip;
    }

    const skills = this.getShipSkills(doc, name);
    const stats = {
      lv120: this.getShipStats(doc, 'lv120', name),
      lv100: this.getShipStats(doc, 'lv100', name),
      base: this.getShipStats(doc, 'base', name)
    };
    const images = await this.getShipImages(doc, name);
    const misc = this.getMisc(doc, name);
    const construction  = this.getConstruction(doc, name);
    let retrofit;
    if(shipWrapper.retrofit) retrofit = this.getRetrofit(doc, name);

    const tables = doc.getElementsByTagName('table');

    const type = tables
      .item(1)
      ?.firstElementChild
      ?.children.item(2)
      ?.children.item(1)
      ?.textContent?.trim();

    if(!type) throw Error(`Error while getting type of ${shipWrapper.name}`);

    const nationality = tables
      .item(1)
      ?.firstElementChild
      ?.children.item(1)
      ?.children.item(1)
      ?.textContent?.trim();

    if(!nationality) throw Error(`Error while getting nationality of ${shipWrapper.name}`);

    const shipClass = tables
      .item(0)
      ?.firstElementChild
      ?.children.item(2)
      ?.children.item(1)
      ?.textContent?.trim();

    if(!shipClass) throw Error(`Error while getting class of ${shipWrapper.name}`);

    const json = {
      images,
      skills,
      stats,
      rarity,
      id,
      name,
      misc,
      construction,
      retrofit,
      type,
      class: shipClass,
      nationality,
      url: `${this.wikiUrl}/${this.urlEncode(name)}`
    };

    return json;
  }

  private getShipSkills(doc: Document, shipName: string): ShipSkill[] {
    const tables = doc.getElementsByClassName('wikitable');
    const skills: ShipSkill[] = [];
    for(const table of tables) {
      if(table.textContent?.includes('Skills')) {
        const tbody = table.firstElementChild;
        if(!tbody) throw Error(`Couldn't find tbody under skills table for ${shipName}`);
        const skillElements = tbody.children;
        for(let i = 1; i < skillElements.length; i++) {
          const skillElement = skillElements[i];
          if(skillElement.children.length < 4) continue;

          const skillStyle = skillElement.children[2].getAttribute('Style');
          if(!skillStyle) throw Error(`Skill type background color not found for ${shipName}.`);

          let skillType = '';
          if(skillStyle.includes('background-color:DeepSkyBlue')) {
            skillType = 'Defensive';
          } else if(skillStyle.includes('background-color:Pink')) {
            skillType = 'Offensive';
          } else if(skillStyle.includes('background-color:Gold')) {
            skillType = 'Support';
          } else {
            continue;
          }

          let skillName = skillElement.children[2].textContent?.trim();
          if(skillName?.includes('CN:')) {
            skillName = skillName.substring(0, skillName.indexOf('CN:'));
          }
          const skillDesc = skillElement.children[3].textContent?.trim();

          if(skillDesc && skillType && skillName) {
            skills.push({
              name: skillName,
              type: skillType,
              description: skillDesc
            });
          }
        }
      }
    }
    return skills;
  }

  private getShipStats(doc: Document, key: string, shipName: string, retrofit?: boolean): ShipStats {
    let title;
    switch(key) {
      case 'lv120':
        title = 'Level 120';
        break;
      case 'lv100':
        title = 'Level 100';
        break;
      case 'base':
        title = 'Base Stats';
        break;
      default:
        throw Error('Invalid stat key.');
    }

    if(retrofit && key !== 'base') title = `${title} Retrofit`;
    const selector = doc.querySelectorAll(`[title="${title}"]`);
    const el = selector.length >= 1 ? selector.item(0) : undefined;
    if(!el) throw Error(`Couldn't find ${key} stats for ${shipName}`);

    const tables = el.getElementsByTagName('table');
    if(tables.length === 0) throw Error(`Tables length is 0. Stats: ${key}, Ship: ${shipName}`);

    const tbody = tables.item(0)?.firstElementChild;
    if(!tbody) throw Error(`Tbody null. Stats: ${key}, Ship: ${shipName}`);

    const stats: { [key: string]: string } = {};

    for(const child of tbody.children) {
      let k = '';
      for(const e of child.children) {
        if(e.tagName.toLowerCase() === 'th') {
          const temp = e.firstElementChild?.getAttribute('title');
          if(!temp) {
            throw Error(`Couldn't get stat key. Stats: ${key}, Ship: ${shipName}`);
          }
          else k = temp;
        } else if(e.tagName.toLowerCase() === 'td') {
          const v = e.textContent ? e.textContent.trim() : '';
          if(k.length !== 0) stats[k.toLowerCase()] = v;
          k = '';
        }
      }
    }

    return {
      evasion: stats.evasion || '',
      aviation: stats.aviation || '',
      health: stats.health || '',
      luck: stats.luck || '',
      armor: stats.armor || '',
      reload: stats.reload || '',
      antiAir: stats['anti-air'] || '',
      torpedo: stats.torpedo || '',
      oilConsumption: stats['oil consumption'] || '',
      antiSubmarine: stats['anti-submarine warfare'] || '',
      firepower: stats.firepower || ''
    };
  }

  private async getShipImages(mainDoc: Document, shipName: string): Promise<ShipImages> {
    const body = await request(`${this.wikiUrl}/${this.urlEncode(shipName)}/Gallery`);
    const doc = new JSDOM(body).window.document;

    const tabbers = doc.getElementsByClassName('tabber');
    if(!tabbers || tabbers.length === 0) throw Error(`Couldn't find element with class name 'tabber' for Gallery of ${shipName}`);
    const imageElements = tabbers[0].children;

    if(!imageElements || imageElements.length === 0) throw Error(`Couldn't find any element with 'tabbertab' class. ${shipName}`);

    const images: ShipImages = {};

    const iconElement = mainDoc.querySelector('[alt*="Icon.png"');
    if(!iconElement) throw Error(`Couldn't find icon element for ${shipName}`);
    const iconUrl = iconElement.getAttribute('src');
    if(!iconUrl) throw Error(`Couldn't get icon url from icon element for ${shipName}`);

    images.icon = this.wikiUrl + iconUrl;

    for(const el of imageElements) {
      if(el.classList.contains('tabbernav')) continue;
      const name = el.getAttribute('title');
      if(!name) throw Error(`Couldn't find 'title' attribute on one of the skill tabs for ${shipName}`);
      const tabInTab = el.getElementsByClassName('tabbertab');
      if(tabInTab && tabInTab.length > 0) {
        for(const el2 of tabInTab) this.insertImages(el2, shipName, images, el, name);
      } else {
        this.insertImages(el, shipName, images);
      }
    }
    return images;
  }

  private getMisc(doc: Document, shipName: string): ShipMisc {
    const tables = doc.getElementsByClassName('wikitable');
    if(!tables) throw Error(`Couldn't find any wikitable for ${shipName}.`);
    const miscTable = tables.item(2);
    if(!miscTable) throw Error(`Couldn't get misc table for ${shipName}.`);

    const tbody = miscTable.firstElementChild;
    if(!tbody) throw Error(`Couldn't get tbody from misc table for ${shipName}`);

    const misc: ShipMisc = {};

    for(let i = 1; i < tbody.children.length; i++) {
      const child = tbody.children.item(i);
      if(!child) continue;
      if(child.children.length < 2) break;
      const key = child.children.item(0)?.textContent?.trim();
      const val = child.children.item(1)?.textContent?.trim();
      if(!key || !val) continue;
      const els = child.children.item(1)?.children;
      if(!els) continue;
      if(els.length >= 1) {
        const link = els.item(0)?.getAttribute('href');
        if(!link) continue;
        if(link.startsWith('http')) {
          misc[key] = { name: val, url: link };
        } else {
          misc[key] = { name: val, url: `${this.wikiUrl}/${link}` };
        }
      } else {
        misc[key] = { name: val };
      }
    }
    return misc;
  }

  private getConstruction(doc: Document, shipName: string): ShipConstruction {
    const el = doc.getElementById('Construction');
    if(!el) throw Error(`Couldn't get element with id 'Construction' for ${shipName}`);

    const drops: boolean[][] = [];
    for(let i = 0; i < 13; i++) drops[i] = [];
    const types: boolean[] = [];

    const tbody = el.firstElementChild?.firstElementChild;
    if(!tbody) {
      // Construction table couldn't be found. It might be research ship.
      return {
        text: '**Type:**\n**Time: Research Only**',
        drop: undefined,
        additional: undefined,
        time: 'Research Only'
      };
    }
    const constTime = tbody?.children.item(1)?.children.item(0)?.textContent?.trim();
    if(!tbody) throw Error(`Couldn't get tbody from Construction table for ${shipName}`);
    if(!constTime) throw Error(`Couldn't get construction time from construction table for ${shipName}`);

    let info = tbody.children.length === 6 ? tbody.lastElementChild?.children[1].textContent : '';
    if(!info) info = undefined;

    // 0th child has headers ignore that
    for(let i = 1; i < tbody.children.length; i++) {
      const child = tbody.children.item(i);
      if(!child) continue;
      let index = 0;
      for(let j = 0; j < child?.children.length; j++) {
        const tdContent = child.children.item(j)?.textContent?.trim();
        if(!tdContent) continue;
        if(i === 3 && j < 5) {
          if(tdContent === '-') {
            types[j] = false;
          } else if(tdContent === '✓') {
            types[j] = true;
          } else if(tdContent.startsWith('⚪')) {
            types[j] = true;
          }
          continue;
        }
        if(tdContent === '-') {
          drops[index++][i-1] = false;
        } else if(tdContent === '✓') {
          drops[index++][i-1] = true;
        } else if(tdContent.startsWith('⚪')) {
          drops[index++][i-1] = true;
        }
      }
    }

    const dropLocations: string[] = [];
    for(let i = 0; i < drops.length; i++) {
      const temp: string[] = [];
      let hasDrops: boolean = false;
      for(let j = 0; j < drops[i].length; j++) {
        if(drops[i][j]) {
          temp.push(j === 3 ? '4 + SOS' : `${j+1}`);
          hasDrops = true;
        }
      }
      if(hasDrops) dropLocations.push(`**Ch.${i+1}:** ${temp.join(', ')}`);
    }

    const constTypesResult: string[] = [];
    if(types[0]) {
      constTypesResult.push('Light');
    }
    if(types[1]) {
      constTypesResult.push('Heavy');
    }
    if(types[2]) {
      constTypesResult.push('Aviation');
    }
    if(types[3]) {
      constTypesResult.push('Limited');
    }
    if(types[4]) {
      constTypesResult.push('Exchange');
    }

    const construction = `**Type:** ${constTypesResult.join(', ')}\n**Time:** ${constTime}`;
    const dropText = dropLocations.length !== 0 ? dropLocations.join('\n') : undefined;
    return {
      text: construction,
      drop: dropText,
      additional: info,
      time: constTime
    };
  }

  private getRetrofit(doc: Document, shipName: string): ShipRetrofit {
    const stats = {
      lv120: this.getShipStats(doc, 'lv120', shipName, true),
      lv100: this.getShipStats(doc, 'lv100', shipName, true)
    };
    return {
      stats
    };
  }


  private insertImages(el: Element, shipName: string, images: ShipImages, mainTab?: Element, mainTabName?: string) {
    const title = el.getAttribute('title');
    if(!title) throw Error(`Couldn't find 'title' attribute on one of the skill tabs for ${shipName}`);
    let name: string;
    if(mainTabName) {
      name = `${mainTabName} (${title})`;
    } else {
      name = title;
    }

    const imgElements = el.getElementsByTagName('img');
    let skinUrl = imgElements.item(0)?.getAttribute('src');
    if(!skinUrl) throw Error(`Couldn't get ${name} skin url for ${shipName}`);
    skinUrl = skinUrl.substr(0, skinUrl.indexOf('.png')) + '.png';
    skinUrl = skinUrl.replace(/\/thumb/g, '');

    let chibiUrl;
    if(mainTab) {
      const mainImgElements = mainTab.getElementsByTagName('img');
      for(let i = mainImgElements.length-1; i >= 0; i--) {
        const tmp = mainImgElements.item(i);
        if(tmp && tmp.getAttribute('alt')?.toLowerCase() === 'chibi') {
          chibiUrl = tmp.getAttribute('src');
          break;
        }
      }
    } else {
      for(let i = imgElements.length-1; i >= 0; i--) {
        const tmp = imgElements.item(i);
        if(tmp && tmp.getAttribute('alt')?.toLowerCase() === 'chibi') {
          chibiUrl = tmp.getAttribute('src');
          break;
        }
      }
    }

    if(name.toLowerCase() === 'default') {
      images.default = this.wikiUrl + skinUrl;
      if(chibiUrl) images.chibi = this.wikiUrl + chibiUrl;
    } else {
      if(!images.skins) images.skins = [];
      if(!images.chibis) images.chibis = [];
      const skinImage = {
        name,
        url: this.wikiUrl + skinUrl
      };
      const skinChibiImage = {
        name,
        url: this.wikiUrl + chibiUrl
      };
      images.skins.push(skinImage);
      if(!images.chibis.find(c => c.name === name) && chibiUrl) {
        images.chibis.push(skinChibiImage);
      }
    }
  }

  private urlEncode(name: string): string {
    return encodeURI(name);
  }

}
