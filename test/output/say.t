#include <tads.h>
#include <bignum.h>
#include <strbuf.h>
#include "../runtimeError.h"

/*
 *   t3SetSay() sets the default display function (for double-quoted
 *   strings and embedded expressions, which it gets as they are), or with
 *   a property, the default display method, which is used instead when
 *   self defines it. Without a display function, a double-quoted string
 *   is error 2305. t3SetSay returns the previous function or method, or
 *   T3SetSayNoFunc/T3SetSayNoMethod.
 */

sayFunc(val) { tadsSay('[' + (dataType(val) == TypeInt ? 'int ' : '') + val + ']'); }
say1() { "x"; }
obj: object
    sayMethod(val) { tadsSay('{' + val + '}'); }
    show() { "Method: <<1>>\n"; }
;
plain: object
    show() { "No method: <<2>>\n"; }
;

_main(args)
{
    local r1 = t3SetSay(sayFunc);
    local r2 = t3SetSay(&sayMethod);
    "Function: <<42>> <<'str'>>\n";
    obj.show();
    plain.show();
    local r3 = t3SetSay(T3SetSayNoMethod);
    obj.show();
    local r4 = t3SetSay(T3SetSayNoFunc);
    local e = errnoOf({: say1() });
    t3SetSay(sayFunc);
    "\n";
    return r1 == T3SetSayNoFunc && r2 == T3SetSayNoMethod && r3 == &sayMethod
        && r4 == sayFunc && e == 2305;
}
