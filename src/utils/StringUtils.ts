interface DidYouMeanArgs {
  caseSensitive?: boolean;
  count?: number;
  minWordMatch?: number;
  minSimilarity?: number;
}

/**
 * @param text String to search for
 * @param list List of string to search text in
 * @param args.caseSensitive Case sensitivity while searching text in list
 * @param args.count How many results should be returned
 * @param args.minWordMatch How many words should match in order to add results. By default
 * this value is 1. As long as 1 word matches no matter the distance it'll be added to results.
 * @param args.minSimilarity Minimum similarity required to add string to results. Similarity
 * is calculated this way: (checkedWord - distance) / checkWord.length
 */
export function didYouMean(text: string, list: string[], args?: DidYouMeanArgs): string[] {
  const caseSensitive = (args && args.caseSensitive) || false;
  const count = (args && args.count) || 1;
  const minSimilarity = (args && args.minSimilarity) || 0.5;
  const minWordMatch = (args && args.minWordMatch) || 1;
  if(!caseSensitive) list = list.flatMap(e => e.toLowerCase());
  const json: { text: string, distance: number, matchedWordCount: number }[] = [];
  for(const str of list) {
    const distance = levenshteinDistance(text, str, true);
    const matchedWordCount = wordMatch(text, str);
    const similarity = (str.length - distance) / str.length;
    if(matchedWordCount >= minWordMatch || similarity >= minSimilarity) {
      json.push({
        text: str,
        distance,
        matchedWordCount
      });
    }
  }
  json.sort((a, b) => {
    if(a.matchedWordCount > b.matchedWordCount) return -1;
    if(a.matchedWordCount < b.matchedWordCount) return 1;
    if(a.matchedWordCount === b.matchedWordCount) {
      if(a.distance < b.distance) return -1;
      if(a.distance > b.distance) return 1;
      return 0;
    }
    return 0;
  });
  return json.map(v => v.text).slice(0, count);
}

/**
 * Returns how many words in first string matches with words in second.
 * @param str1 First string
 * @param str2 Second string
 */
export function wordMatch(str1: string, str2: string): number {
  const words1 = str1.split(' ');
  const words2 = str2.split(' ');
  let count = 0;
  for(const word of words1) {
    if(words2.includes(word)) count++;
  }
  return count;
}

/**
 * Returns levenshtein distance between str1 and str2.
 * @param str1 First string
 * @param str2 Second string
 * @param ignoreSpace Whether or not to ignore spaces
 */
export function levenshteinDistance(str1: string, str2: string, ignoreSpace: boolean): number {
  if(ignoreSpace) {
    str1 = str1.replace(/ /g, '');
    str2 = str2.replace(/ /g, '');
  }
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