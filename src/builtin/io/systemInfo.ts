import { VmInt, VmNil, VmSstring, VmData } from "../../types";

const SysInfoVersion        = 2;
const SysInfoOsName         = 3;
const SysInfoJpeg           = 5;
const SysInfoPng            = 6;
const SysInfoWav            = 7;
const SysInfoMidi           = 8;
const SysInfoWavMidiOvl     = 9;
const SysInfoWavOvl         = 10;
const SysInfoPrefImages     = 11;
const SysInfoPrefSounds     = 12;
const SysInfoPrefMusic      = 13;
const SysInfoPrefLinks      = 14;
const SysInfoMpeg           = 15;
const SysInfoMpeg1          = 16;
const SysInfoMpeg2          = 17;
const SysInfoMpeg3          = 18;
const SysInfoLinksHttp      = 20;
const SysInfoLinksFtp       = 21;
const SysInfoLinksNews      = 22;
const SysInfoLinksMailto    = 23;
const SysInfoLinksTelnet    = 24;
const SysInfoPngTrans       = 25;
const SysInfoPngAlpha       = 26;
const SysInfoOgg            = 27;
const SysInfoMng            = 28;
const SysInfoMngTrans       = 29;
const SysInfoMngAlpha       = 30;
const SysInfoTextHilite     = 31;
const SysInfoTextColors     = 32;
const SysInfoBanners        = 33;
const SysInfoInterpClass    = 34;
const SysInfoAudioFade      = 35;
const SysInfoAudioCrossfade = 36;

/* SysInfoTextColors support level codes */
const SysInfoTxcNone        = 0;
const SysInfoTxcParam       = 1;
const SysInfoTxcAnsiFg      = 2;
const SysInfoTxcAnsiFgBg    = 3;
const SysInfoTxcRGB         = 4;

/* SysInfoInterpClass codes */
const SysInfoIClassText    = 1;
const SysInfoIClassTextGUI = 2;
const SysInfoIClassHTML    = 3;

/* SysInfoAudioFade and SysInfoAudioCrossfade result codes */
const SysInfoFadeMPEG      = 0x0001;
const SysInfoFadeOGG       = 0x0002;
const SysInfoFadeWAV       = 0x0004;
const SysInfoFadeMIDI      = 0x0008;

export function builtin_systemInfo(vmInfoType: VmInt, ...args: VmData[]): VmData {
  switch(vmInfoType.unpack()) {
    case SysInfoInterpClass:
      return new VmInt(SysInfoIClassHTML);
    case SysInfoVersion:
      return new VmSstring('3.0.10');
    case SysInfoOsName:
      return new VmSstring('JavaScript');
    case SysInfoJpeg:
    case SysInfoPng:
    case SysInfoWav:
    case SysInfoMidi:
    case SysInfoWavMidiOvl:
    case SysInfoWavOvl:
    case SysInfoMpeg:
    case SysInfoMpeg1:
    case SysInfoMpeg2:
    case SysInfoMpeg3:
    case SysInfoLinksHttp:
    case SysInfoLinksFtp:
    case SysInfoLinksNews:
    case SysInfoLinksMailto:
    case SysInfoLinksTelnet:
    case SysInfoPngTrans:
    case SysInfoPngAlpha:
    case SysInfoOgg:
    case SysInfoMng:
    case SysInfoMngTrans:
    case SysInfoMngAlpha:
    case SysInfoTextHilite:
    case SysInfoBanners:
      return new VmInt(1);
    case SysInfoAudioFade:
    case SysInfoAudioCrossfade:
      return new VmInt(SysInfoFadeMPEG | SysInfoFadeOGG | SysInfoFadeWAV | SysInfoFadeMIDI);
    case SysInfoTextColors:
      return new VmInt(SysInfoTxcRGB);
    case SysInfoPrefImages:
    case SysInfoPrefSounds:
    case SysInfoPrefMusic:
    case SysInfoPrefLinks:
      return new VmInt(1);
    default:
      return new VmNil();
  }
}
