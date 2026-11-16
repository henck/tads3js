import { VmData } from "../types";

/**
 * Sort in place with the reference VM's algorithm: a quicksort that
 * partitions around the rightmost element. It isn't stable, and games can
 * depend on the order it leaves equal elements in (adv3 lists objects in
 * that order, for example), so we use the same algorithm.
 * @param a Array to sort
 * @param cmp Comparison: negative, zero or positive
 */
export function quickSort<T>(a: T[], cmp: (x: T, y: T) => number) {
  // Use an explicit stack rather than recursion, for long lists.
  let ranges: [number, number][] = [[0, a.length - 1]];
  while(ranges.length) {
    let [l, r] = ranges.pop();
    if(r <= l) continue;
    let v = a[r], i = l - 1, j = r;
    for(;;) {
      while(cmp(a[++i], v) < 0) ;
      while(j > l && cmp(a[--j], v) > 0) ;
      if(i >= j) break;
      let t = a[i]; a[i] = a[j]; a[j] = t;
    }
    let t = a[i]; a[i] = a[r]; a[r] = t;
    // (The order doesn't matter: the ranges are disjoint.)
    ranges.push([l, i - 1], [i + 1, r]);
  }
}

/**
 * Sort VM values as List.sort() and Vector.sort() do: with a comparison
 * function (which returns a number), or else by comparing the values; in
 * descending order, the comparison is reversed.
 */
export function sortValues(a: VmData[], descending: boolean, func?: VmData) {
  let cmp = (x: VmData, y: VmData): number => {
    let c = func ? func.invoke(x, y).unpack() : (x.eq(y) ? 0 : x.lt(y) ? -1 : 1);
    return descending ? -c : c;
  };
  quickSort(a, cmp);
}
