/**
 * Edit distance as used by Dictionary.correctSpelling: the smallest number
 * of single-character insertions, deletions, replacements and transpositions
 * of adjacent characters needed to turn one string into the other
 * ("optimal string alignment" distance). Among the cheapest edit sequences,
 * the one with the fewest replacements is chosen, and that number of
 * replacements is reported as well.
 * @param a Input string
 * @param b Dictionary word
 * @param eq Optional character equality test (input char, word char), for
 * approximations that don't count as edits (e.g. case folding)
 * @param minPrefix If non-zero, the word may be truncated to any prefix at
 * least this long at no cost
 * @returns Distance and number of replacements
 */
export function editDistance(a: string, b: string,
    eq?: (x: string, y: string) => boolean, minPrefix?: number): { dist: number, repl: number } {
  let same = eq ?? ((x: string, y: string) => x === y);
  let as = Array.from(a);
  let bs = Array.from(b);

  // d[i][j] = [distance, replacements] for as[0..i) -> bs[0..j)
  let d: [number, number][][] = [];
  for(let i = 0; i <= as.length; i++) {
    d.push([]);
    for(let j = 0; j <= bs.length; j++) {
      if(i == 0) { d[i].push([j, 0]); continue; }
      if(j == 0) { d[i].push([i, 0]); continue; }
      let candidates: [number, number][] = [
        [d[i-1][j][0] + 1, d[i-1][j][1]],             // deletion
        [d[i][j-1][0] + 1, d[i][j-1][1]],             // insertion
        same(as[i-1], bs[j-1])
          ? [d[i-1][j-1][0], d[i-1][j-1][1]]          // match
          : [d[i-1][j-1][0] + 1, d[i-1][j-1][1] + 1]  // replacement
      ];
      if(i > 1 && j > 1 && same(as[i-1], bs[j-2]) && same(as[i-2], bs[j-1])) {
        candidates.push([d[i-2][j-2][0] + 1, d[i-2][j-2][1]]); // transposition
      }
      d[i].push(best(candidates));
    }
  }

  // The full word, or with truncation, any long enough prefix of it.
  let ends: [number, number][] = [d[as.length][bs.length]];
  if(minPrefix) {
    for(let j = minPrefix; j < bs.length; j++) ends.push(d[as.length][j]);
  }
  let [dist, repl] = best(ends);
  return { dist: dist, repl: repl };
}

// Lowest distance, then fewest replacements.
function best(candidates: [number, number][]): [number, number] {
  return candidates.reduce((b, c) => (c[0] < b[0] || (c[0] == b[0] && c[1] < b[1])) ? c : b);
}
