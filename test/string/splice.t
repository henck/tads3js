#charset "utf-8"
#include <tads.h>
#include <strbuf.h>
#include <bytearr.h>

/*
 *   splice(index, deleteLength, insertString?) deletes and inserts
 *   characters; negative index counts from the end.
 */
_main(args)
{
    return 'abcdefgh'.splice(3, 4, 'xx') == 'abxxgh'
        && 'abcdefgh'.splice(100, 0, 'xx') == 'abcdefghxx'
        && 'abcdefgh'.splice(-2, 1, 'x') == 'abcdefxh'
        && 'abcdefgh'.splice(2, 3) == 'aefgh'
        && 'abc'.splice(2, 0, 'X') == 'aXbc'
        && 'abc'.splice(1, 3, '') == '';
}
