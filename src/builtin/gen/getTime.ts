let ticksZero: number = null;
import { VmData, VmObject, VmInt, VmList } from "../../types";
import { List } from "../../metaimp";
import { Vm } from "../../Vm";

/**
 * Returns the current system time, according to timeType. 
 * @param vmTimeType GetTimeDateAndTime(1) or GetTimeTicks(2). If timeType is not specified, GetTimeDateAndTime is the default. 
 * @returns Time array (1), or milliseconds since 1970 (2)
 */
export function builtin_getTime(vmTimeType?: VmInt): VmData {
  // 1 = GetTimeDateAndTime
  // 2 = GetTimeTicks
  let timeType = vmTimeType ? vmTimeType.unpack() : 1;

  let vm = Vm.getInstance();
  if(timeType == 1) {
    let d = vm.fixedClock ? new Date(2000, 0, 1, 12, 0, 0) : new Date();
    let yearDay = Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(d.getFullYear(), 0, 1)) / 86400000) + 1;
    return new VmList([
      d.getFullYear(),
      d.getMonth() + 1, // 1-based in TADS
      d.getDate(),
      d.getDay() + 1,   // 1-based in TADS
      yearDay,
      d.getHours(),
      d.getMinutes(),
      d.getSeconds(),
      Math.floor(d.valueOf() / 1000)
    ].map((x) => new VmInt(x)));
  }
  else if(timeType == 2) {
    // Milliseconds since the first call.
    if(vm.fixedClock) return new VmInt(vm.fixedTicks += 100);
    if(ticksZero === null) ticksZero = Date.now();
    return new VmInt(Date.now() - ticksZero);
  }
  else {
    throw('getTime: Unsupported argument');
  }
}

