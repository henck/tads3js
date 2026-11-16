#include <tads.h>
#include <file.h>

/*
 *   Resources embedded in the image (from resource.res/): resExists(),
 *   File.openTextResource() (lines end in '\n' whatever the line ending in
 *   the file: CR/LF, LF or CR; the last line has none; nil at the end) and
 *   File.openRawResource() (readBytes() into a ByteArray, file size and
 *   position).
 */
_main(args)
{
    if(t3GetVMPreinitMode())
        return true;

    local f = File.openTextResource('words.txt');
    local lines = [];
    local l;
    while((l = f.readFile()) != nil)
        lines += l;
    f.closeFile();

    local r = File.openRawResource('data.bin');
    local size = r.getFileSize();
    local b = new ByteArray(8);
    local n = r.readBytes(b, 2, 3);
    local pos = r.getPos();
    local n2 = r.readBytes(b, 6);
    local pos2 = r.getPos();
    r.setPos(1);
    local b2 = new ByteArray(2);
    r.readBytes(b2);
    r.closeFile();

    return resExists('words.txt') && resExists('data.bin') && !resExists('missing.txt')
        && lines == ['alpha\n', 'beta\n', 'gamma\n', 'delta']
        && size == 5 && n == 3 && pos == 3 && n2 == 2 && pos2 == 5
        && b[1] == 0 && b[2] == 1 && b[3] == 2 && b[4] == 255 && b[5] == 0
        && b[6] == 0 && b[7] == 127 && b[8] == 0
        && b2[1] == 2 && b2[2] == 255;
}
