#include <tads.h>
#include <vector.h>
#include <lookup.h>
#include <strbuf.h>
#include <bytearr.h>
#include <bignum.h>
#include <dict.h>
#include <strcomp.h>

/*
 *   Objects created during preinit are stored in the image file. Property values of every type, including negative integers.
 */
class Thing: object weight = 3;
holder: object a = nil b = nil;

_main(args)
{
    if(t3GetVMPreinitMode()) {
        holder.a = [-1, -2147483648, 2147483647, 'str', &a, nil, true, holder];
        return true;
    }
    return holder.a == [-1, -2147483648, 2147483647, 'str', &a, nil, true, holder];
}
