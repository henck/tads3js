//#charset "utf-8"

#include <tads.h>
#include <bignum.h> 
#include "strbuf.h"
#include "dict.h"
    

class Coin: object
    createCoin() { return createInstance(); }
;

class GoldCoin: Coin;
class SilverCoin: Coin;
class CopperCoin: Coin;

_main(args)
{
    local instance = GoldCoin.createInstance();
    return instance.getSuperclassList() == [GoldCoin];
}
