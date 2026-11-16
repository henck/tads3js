#include <tads.h>
#include <vector.h>

/*
 *   sort(descending?, comparisonFunction?) sorts the vector in place.
 *   (The sort isn't stable, so comparison-function cases avoid ties.)
 */
_main(args)
{
    local u = new Vector([1, 5, 3, 2, 4]);
    local v = new Vector([1, 2, 3, 4, 5]);
    local w = new Vector(['hello', 'world!', 'out', 'me']);
    local s = new Vector(['pear', 'apple', 'fig']);
    u.sort();
    v.sort(true);
    w.sort(nil, {a, b: a.length() - b.length()});
    local w2 = new Vector(['hello', 'world!', 'out', 'me']);
    w2.sort(true, {a, b: a.length() - b.length()});
    s.sort();
    return u.toList() == [1, 2, 3, 4, 5]
        && v.toList() == [5, 4, 3, 2, 1]
        && w.toList() == ['me', 'out', 'hello', 'world!']
        && w2.toList() == ['world!', 'hello', 'out', 'me']
        && s.toList() == ['apple', 'fig', 'pear'];
}
