#charset "utf-8"
#include <tads.h>
#include <strbuf.h>
#include <bytearr.h>

/*
 *   findAll(target, func?) returns all matches, or func(match, index,
 *   groups...) for each match; func may take fewer arguments, and
 *   missing groups are nil.
 */
_main(args)
{
    return 'one two three'.findAll(R'%w+') == ['one', 'two', 'three']
        && 'one two three'.findAll(R'%w+', {m: m.toUpper()}) == ['ONE', 'TWO', 'THREE']
        && 'one two three'.findAll(R'%w+', {m, idx: idx}) == [1, 5, 9]
        && 'one two three'.findAll(R'(%w)%w*', {m, i, g1: g1}) == ['o', 't', 't']
        && 'one two three'.findAll(R'(%w)%w*', {m, i, g1, g2: g2}) == [nil, nil, nil]
        && 'a-b-c'.findAll('-') == ['-', '-']
        && 'abc'.findAll('x') == [];
}
