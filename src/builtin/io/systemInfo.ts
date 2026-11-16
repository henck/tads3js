import { Platform } from "../../Platform";
import { Vm } from "../../Vm";
import { VmData, VmInt, VmNil, VmTrue, VmSstring } from "../../types";

const SysInfoVersion = 2;
const SysInfoOsName = 3;

/**
 * Answers of an HTML TADS interpreter (a host in HTML mode): JPEG, PNG
 * (with transparency and alpha), WAV, MIDI, MP3 and Ogg sounds, all
 * multimedia preferences on, links, text highlighting, RGB colours,
 * banners, interpreter class SysInfoIClassHTML. No MNG, no audio fades.
 */
const HTML_INFO: { [type: number]: number } = {
  5: 1, 6: 1, 7: 1, 8: 1, 9: 1, 10: 1, 11: 1, 12: 1, 13: 1, 14: 1,
  15: 1, 16: 1, 17: 1, 18: 1, 20: 1, 21: 1, 22: 1, 23: 1, 24: 1,
  25: 1, 26: 1, 27: 1, 28: 0, 29: 0, 30: 0, 31: 1, 32: 4, 33: 1, 34: 3, 35: 0, 36: 0
};

/**
 * systemInfo(infoType, ...): information about the interpreter. Unless
 * the host is in HTML mode, we answer like the reference text-only
 * interpreter (t3run): no multimedia, no banners, ANSI colours,
 * interpreter class SysInfoIClassText.
 */
export function builtin_systemInfo(vmInfoType: VmData, ...args: VmData[]): VmData {
  let type = vmInfoType instanceof VmInt ? vmInfoType.value : -1;
  switch(type) {
    case 1: return new VmTrue();                     // (is the code supported?)
    case SysInfoVersion: return new VmSstring('3.1.3');
    case SysInfoOsName: return new VmSstring(Platform.get().osName);
  }
  if(Vm.getInstance().host.html && HTML_INFO[type] !== undefined) return new VmInt(HTML_INFO[type]);
  switch(type) {
    case 32: return new VmInt(3);                    // SysInfoTextColors: SysInfoTxcAnsiFgBg
    case 34: return new VmInt(1);                    // SysInfoInterpClass: SysInfoIClassText
  }
  if((type >= 4 && type <= 18) || (type >= 20 && type <= 33)) return new VmInt(0);
  return new VmNil();
}
