#include <tads.h>
#include <file.h>

/*
 *   Writing and reading files: text mode (lines; FileAccessReadWriteKeep
 *   keeps the contents, and writing at the end appends), data mode
 *   (integers, strings, true; nil at the end of the file) and raw mode
 *   (writeBytes/readBytes, file size). The files are left behind as
 *   file-test-*.tmp (gitignored).
 */
_main(args)
{
    if(t3GetVMPreinitMode())
        return true;

    // Text mode
    local f = File.openTextFile('file-test-text.tmp', FileAccessWrite, 'utf-8');
    f.writeFile('first line\n');
    f.writeFile('second ');
    f.writeFile('line\n');
    f.closeFile();
    f = File.openTextFile('file-test-text.tmp', FileAccessReadWriteKeep, 'utf-8');
    f.setPosEnd();
    f.writeFile('third');
    f.setPos(0);
    local lines = [];
    local l;
    while((l = f.readFile()) != nil)
        lines += l;
    f.closeFile();

    // Data mode
    f = File.openDataFile('file-test-data.tmp', FileAccessWrite);
    f.writeFile(42);
    f.writeFile(-7);
    f.writeFile('hello');
    f.writeFile(true);
    f.closeFile();
    f = File.openDataFile('file-test-data.tmp', FileAccessRead);
    local vals = [];
    local v;
    while((v = f.readFile()) != nil)
        vals += v;
    local dataSize = f.getFileSize();
    f.closeFile();

    // Raw mode
    local b = new ByteArray(4);
    b[1] = 10; b[2] = 20; b[3] = 30; b[4] = 255;
    f = File.openRawFile('file-test-raw.tmp', FileAccessWrite);
    f.writeBytes(b, 2, 3);
    local rawSize = f.getFileSize();
    f.closeFile();
    f = File.openRawFile('file-test-raw.tmp', FileAccessRead);
    local c = new ByteArray(5);
    local n = f.readBytes(c);
    f.closeFile();

    return lines == ['first line\n', 'second line\n', 'third']
        && vals == [42, -7, 'hello', true] && dataSize == 5 + 5 + 3 + 5 + 1
        && rawSize == 3 && n == 3 && c[1] == 20 && c[2] == 30 && c[3] == 255 && c[4] == 0
        && File.getRootName('a/b/c.txt') == 'c.txt';
}
