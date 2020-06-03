#include <tads.h>
#include <bignum.h> 
#include "strbuf.h"
    
_main(args)
{
    return 'one two three'.findAll(R'%w+') == ['one', 'two', 'three']
        && 'one two three'.findAll(R'%w+', {m: m.toUpper()}) == ['ONE', 'TWO', 'THREE']
        && 'one two three'.findAll(R'%w+', {m, idx: idx}) ==  [1, 5, 9]
        && 'one two three'.findAll(R'(%w)%w*', {m, i, g1: g1}) == ['o', 't', 't']
        && 'one two three'.findAll(R'(%w)%w*', {m, i, g1, g2: g2}) == [nil, nil, nil];
}


