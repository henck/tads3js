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
    return String.getPropParams(&substr) == [1, 1, nil]
        && C.getPropParams(&none) == [0,0,nil]
        && C.getPropParams(&one) == [1,0,nil]
        && C.getPropParams(&two) == [2,0,nil]
        && C.getPropParams(&opt) == [1,1,nil]
        && C.getPropParams(&vary) == [1,0,true]
        && C.getPropParams(&dontexist) == [0,0,nil];
}
