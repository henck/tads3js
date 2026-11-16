#include <tads.h>
#include <lookup.h>

/*
 *   getBucketCount() returns the bucket count specified at creation.
 */
_main(args)
{
    local t = new LookupTable(256, 1024);
    local d = new LookupTable();
    return t.getBucketCount() == 256
        && d.getBucketCount() > 0;
}
