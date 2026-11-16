#include <tads.h>
#include <vector.h>

/*
 *   [] gets and sets elements. Assigning past the end extends the
 *   vector, filling the gap with nil. Vectors have reference semantics:
 *   all references see a change.
 */
_main(args)
{
    local v = new Vector([1, 2, 3]);
    local w = v;
    v[2] = 'b';
    v[5] = 'e';
    w[1] = 'a';
    return v[1] == 'a'
        && v[2] == 'b'
        && v.length() == 5
        && v.toList() == ['a', 'b', 3, nil, 'e']
        && w.length() == 5;
}
