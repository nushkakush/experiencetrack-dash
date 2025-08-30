/**
 * Convert a number to its ordinal word representation
 * @param num - The number to convert
 * @returns The ordinal word (e.g., "first", "second", "third")
 */
export function numberToOrdinalWord(num: number): string {
  const ordinals = [
    'first',
    'second',
    'third',
    'fourth',
    'fifth',
    'sixth',
    'seventh',
    'eighth',
    'ninth',
    'tenth',
    'eleventh',
    'twelfth',
    'thirteenth',
    'fourteenth',
    'fifteenth',
    'sixteenth',
    'seventeenth',
    'eighteenth',
    'nineteenth',
    'twentieth',
    'twenty-first',
    'twenty-second',
    'twenty-third',
    'twenty-fourth',
    'twenty-fifth',
    'twenty-sixth',
    'twenty-seventh',
    'twenty-eighth',
    'twenty-ninth',
    'thirtieth',
    'thirty-first',
    'thirty-second',
    'thirty-third',
    'thirty-fourth',
    'thirty-fifth',
    'thirty-sixth',
    'thirty-seventh',
    'thirty-eighth',
    'thirty-ninth',
    'fortieth',
  ];

  if (num >= 1 && num <= ordinals.length) {
    return ordinals[num - 1];
  }

  // Fallback for numbers beyond our list
  return `${num}${getOrdinalSuffix(num)}`;
}

/**
 * Get the ordinal suffix for a number
 * @param num - The number
 * @returns The ordinal suffix (e.g., "st", "nd", "rd", "th")
 */
function getOrdinalSuffix(num: number): string {
  const j = num % 10;
  const k = num % 100;

  if (j === 1 && k !== 11) {
    return 'st';
  }
  if (j === 2 && k !== 12) {
    return 'nd';
  }
  if (j === 3 && k !== 13) {
    return 'rd';
  }
  return 'th';
}
