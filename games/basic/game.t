#charset "us-ascii"
#include <adv3.h>
#include <en_us.h>

versionInfo: GameID
    IFID = '7a8d2c11-4b5e-4f3a-9c1d-123456789abc'
    name = 'Test Game'
    byline = 'by Tester'
    authorEmail = 'Tester <tester@example.com>'
    desc = 'A test.'
    version = '1'
;

gameMain: GameMainDef
    initialPlayerChar = me
    showIntro() { "Welcome to the test.\b"; }
;

startRoom: Room 'Start Room'
    "This is the start room. A door leads north. "
;

+ box: Container 'small box' 'small box'
    "It's a small box. "
;

+ me: Actor
;
