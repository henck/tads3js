#include <tads.h>
#include <bignum.h>
#include <strbuf.h>
#include "../runtimeError.h"

/*
 *   In a plain text console: clearScreen(), morePrompt() and
 *   flushOutput() have no visible effect; there are no banners
 *   (bannerCreate() returns nil) or multimedia resources; systemInfo()
 *   describes a text-only interpreter.
 */

_main(args)
{
    // (The compiler runs _main during preinit, where input would wait for the keyboard.)
    if(t3GetVMPreinitMode())
        return true;
    tadsSay('before ');
    clearScreen();
    morePrompt();
    flushOutput();
    tadsSay('after\n');
    local b = bannerCreate(nil, BannerFirst, nil, BannerTypeText, BannerAlignTop, 1, BannerSizeAbsolute, 0);
    return b == nil && resExists('foo.jpg') == nil
        && systemInfo(SysInfoInterpClass) == SysInfoIClassText
        && systemInfo(SysInfoBanners) == 0 && systemInfo(SysInfoJpeg) == 0
        && systemInfo(SysInfoTextColors) == SysInfoTxcAnsiFgBg
        && getLocalCharSet(CharsetDisplay) == 'utf-8' && getLocalCharSet(99) == nil
        && setLogFile('test.log') == true && setLogFile(nil) == true
        && setLogFile('nodir/test.log') == nil
        && timeDelay(1) == nil;
}
