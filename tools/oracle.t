#include <tads.h>

/*
 *   Oracle wrapper for the test suite (npm test -- --oracle).
 *
 *   The test is compiled with -D _main=_testMain, so its entry point
 *   becomes _testMain. This module supplies the real _main, which runs
 *   the test on the reference TADS VM (t3run) and prints the result on a
 *   line of its own, after the test's output.
 */
#undef _main

_main(args)
{
    local r = _testMain(args);
    tadsSay(r == true ? '\nORACLE:PASS' : '\nORACLE:FAIL');
}
