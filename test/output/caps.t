#include <tads.h>
#include <bignum.h>
#include <strbuf.h>
#include "../runtimeError.h"

/*
 *   \^ capitalizes the next letter and \v makes it lower case (whatever
 *   comes in between, and the last one wins).
 */
_main(args)
{
    tadsSay('\^lower \vUPPER\n');
    tadsSay('caps \^<b>word</b> and \^ space\n');
    tadsSay('\^1a \^&eacute;t\n');
    tadsSay('a\v B\vc\^\v d\n');
    return true;
}
