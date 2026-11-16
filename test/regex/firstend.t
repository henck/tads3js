#charset "utf-8"
#include <tads.h>

/*
 *   By default (<FirstBegin>/<FB>) the match that begins earliest wins;
 *   <FirstEnd>/<FE> picks the match that ends earliest.
 */
_main(args)
{
    return rexSearch('<FE>(abc|b)', 'abc') == [2, 1, 'b']
        && rexSearch('<FirstEnd>(abc|b)', 'abc') == [2, 1, 'b']
        && rexSearch('<FB>(abc|b)', 'abc') == [1, 3, 'abc']
        && rexSearch('(abc|b)', 'abc') == [1, 3, 'abc'];
}
