#charset "us-ascii"
#include <adv3.h>
#include <en_us.h>

versionInfo: GameID
    IFID = '7a8d2c11-4b5e-4f3a-9c1d-123456789abd'
    name = 'Test Game Two'
    byline = 'by Tester'
    authorEmail = 'Tester <tester@example.com>'
    desc = 'A bigger test.'
    version = '1'
;

gameMain: GameMainDef
    initialPlayerChar = me
    showIntro() { "Welcome to the second test.\b"; }
;

hall: Room 'Great Hall'
    "A great hall. A kitchen lies north, and a cellar door is set into the floor. "
    north = kitchen
    down = cellarDoor
;

+ me: Actor;
+ redBall: Thing 'red ball*balls' 'red ball' "A red rubber ball. ";
+ blueBall: Thing 'blue ball*balls' 'blue ball' "A blue rubber ball. ";
+ chest: OpenableContainer 'wooden chest' 'wooden chest' "A sturdy chest. "
    initiallyOpen = nil
;
++ coin: Thing 'gold coin' 'gold coin' "Shiny. ";
+ cellarDoor: Door 'cellar door' 'cellar door' "A trapdoor. ";
+ table: Fixture, Surface 'table' 'table' "An oak table. ";
++ lamp: Flashlight 'brass lamp' 'brass lamp' "A lamp. ";

kitchen: Room 'Kitchen'
    "A kitchen. The hall is south. "
    south = hall
;
+ dial: NumberedDial 'dial' 'dial' "A dial from 1 to 10, set to <<curSetting>>. "
    minSetting = 1 maxSetting = 10 curSetting = '1'
;

cellar: DarkRoom 'Cellar'
    "A damp cellar. "
    up = cellarDoorUp
;
+ cellarDoorUp: Door ->cellarDoor 'cellar door' 'cellar door';
