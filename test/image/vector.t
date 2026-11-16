#include <tads.h>
#include <vector.h>

/*
 *   Objects created during preinit are stored in the image file: a Vector
 *   keeps its elements (of any type).
 */
holder: object v = nil empty = nil;

_main(args)
{
    if(t3GetVMPreinitMode()) {
        holder.v = new Vector(10, [1, 'two', [3, 4], holder, &v, nil, true]);
        holder.empty = new Vector(5);
        return true;
    }
    local v = holder.v;
    return v.length() == 7 && v[1] == 1 && v[2] == 'two' && v[3] == [3, 4]
        && v[4] == holder && v[5] == &v && v[6] == nil && v[7] == true
        && holder.empty.length() == 0;
}
