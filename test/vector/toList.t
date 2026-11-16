#include <tads.h>
#include <vector.h>

/*
 *   toList(start?, count?) returns a List of the elements, from
 *   start, for count elements. The vector is unchanged.
 */
_main(args)
{
    local x = new Vector(['a', 'b', 'c']);
    local l = x.toList();
    return l == ['a', 'b', 'c']
        && dataType(l) == TypeList
        && x.toList(2) == ['b', 'c']
        && x.toList(2, 1) == ['b']
        && new Vector().toList() == []
        && x.length() == 3;
}
