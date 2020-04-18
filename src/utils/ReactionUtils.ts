export function getReactionFromNumber(num: number): string {
  switch(num) {
    case 0:
      return '0⃣';
    case 1:
      return '1⃣';
    case 2:
      return '2⃣';
    case 3:
      return '3⃣';
    case 4:
      return '4⃣';
    case 5:
      return '5⃣';
    case 6:
      return '6⃣';
    case 7:
      return '7⃣';
    case 8:
      return '8⃣';
    case 9:
      return '9⃣';
    default:
      return '';
  }
}

export function getNumberFromReaction(reaction: string): number {
  switch(reaction) {
    case '0⃣':
      return 0;
    case '1⃣':
      return 1;
    case '2⃣':
      return 2;
    case '3⃣':
      return 3;
    case '4⃣':
      return 4;
    case '5⃣':
      return 5;
    case '6⃣':
      return 6;
    case '7⃣':
      return 7;
    case '8⃣':
      return 8;
    case '9⃣':
      return 9;
    default:
      return -1;
  }
}