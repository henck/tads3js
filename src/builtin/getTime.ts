import { VmData, VmObject, VmInt } from "../types";
import { List } from "../metaimp";

/**
 * Returns the current system time, according to timeType. 
 * @param vmTimeType GetTimeDateAndTime(1) or GetTimeTicks(2). If timeType is not specified, GetTimeDateAndTime is the default. 
 * @returns Time array (1), or milliseconds since 1970 (2)
 */
export function builtin_getTime(vmTimeType?: VmInt): VmData {
  // 1 = GetTimeDateAndTime
  // 2 = GetTimeTicks
  let timeType = vmTimeType ? vmTimeType.unpack() : 1;

  if(timeType == 1) {
    let d = new Date();
    return new VmObject(new List([
      d.getFullYear(),
      d.getMonth() + 1, // 1-based in TADS
      d.getDate(),
      d.getDay() + 1,   // 1-based in TADS
      0, // TODO: Needs day of the year
      d.getHours(),
      d.getMinutes(),
      d.getSeconds(),
      d.valueOf()
    ]));
  }
  else if(timeType == 2) {
    // 2 = GetTimeTicks
    return new VmInt(new Date().valueOf());
  }
  else {
    throw('getTime: Unsupported argument');
  }
}

