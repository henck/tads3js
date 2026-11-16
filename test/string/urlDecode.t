#charset "utf-8"
#include <tads.h>
#include <strbuf.h>
#include <bytearr.h>

/*
 *   urlDecode() converts + to a space and %xx (including multi-byte
 *   UTF-8) sequences to characters.
 */
_main(args)
{
    return 'a+b%2Cc-d_e'.urlDecode() == 'a b,c-d_e'
        && '%C3%A1'.urlDecode() == 'á'
        && '%41%62'.urlDecode() == 'Ab'
        && 'plain'.urlDecode() == 'plain';
}
