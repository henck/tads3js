#include <tads.h>
#include <vector.h>
#include <strbuf.h>
#include "../runtimeError.h"

/*
 *   dataType(val) returns the TypeXxx code of a value.
 */

enum red;
f() { }
someObj: object;

_main(args)
{
    local v = nil, t = true;
    return dataType(v) == TypeNil
        && dataType(t) == TypeTrue
        && dataType(1) == TypeInt
        && dataType('a') == TypeSString
        && dataType([1]) == TypeList
        && dataType(someObj) == TypeObject
        && dataType(new Vector()) == TypeObject
        && dataType(&foo) == TypeProp
        && dataType(f) == TypeFuncPtr
        && dataType(red) == TypeEnum;
}
