//#charset "utf-8"

#include <tads.h>
#include <bignum.h> 
#include "strbuf.h"
#include "dict.h"
    

class A: object
    v1 = 0
    v2 = 0
    one(x) { }
;

class B: object
    v3 = 0
    v4 = 0
    none() { }
    vary(x,...) {}
;  

class C: A, B
    v5 = 0
    v6 = 0
    two(x,y) {}
    opt(x,y?) {}
;

_main(args)
{
    return C.propDefined(&v5) == true
        && C.propDefined(&v4) == true;
        
}
