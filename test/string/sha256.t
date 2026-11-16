#charset "utf-8"
#include <tads.h>
#include <strbuf.h>
#include <bytearr.h>

/*
 *   sha256() returns the SHA-256 hash as 64 (upper-case) hex digits.
 */
_main(args)
{
    return 'abc'.sha256() == 'BA7816BF8F01CFEA414140DE5DAE2223B00361A396177A9CB410FF61F20015AD'
        && ''.sha256() == 'E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855';
}
