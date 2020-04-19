export function didYouMean(text: string, list: string[], args?: { minSimilarity?: number, count?: number }): string[] {
  const minSimilarity = (args && args.minSimilarity) ? args.minSimilarity : 0.5;
  const count = (args && args.count) ? args.count : 1;
  const json: { text: string, distance: number }[] = [];
  for(const str of list) {
    const distance = levenshteinDistance(text, str);
    const similarity: number = 1 - distance / text.length;
    if(similarity >= minSimilarity) json.push({ text: str, distance });
  }
  json.sort((a, b) => {
    if(a.distance > b.distance) return 1;
    if(a.distance < b.distance) return -1;
    else return 0;
  });
  return json.map(v => v.text).slice(0, count);
}

export function levenshteinDistance(str1: string, str2: string): number {
  const distanceMatrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i += 1) {
    distanceMatrix[0][i] = i;
  }

  for (let j = 0; j <= str2.length; j += 1) {
    distanceMatrix[j][0] = j;
  }

  for (let j = 1; j <= str2.length; j += 1) {
    for (let i = 1; i <= str1.length; i += 1) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      distanceMatrix[j][i] = Math.min(
        distanceMatrix[j][i - 1] + 1, // deletion
        distanceMatrix[j - 1][i] + 1, // insertion
        distanceMatrix[j - 1][i - 1] + indicator, // substitution
      );
    }
  }

  return distanceMatrix[str2.length][str1.length];
}