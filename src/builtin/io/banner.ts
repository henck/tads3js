import { VmData, VmNil, VmInt, VmList } from "../../types";
import { Vm } from "../../Vm";
import { sayText } from "./tadsSay";

/*
 * The banner API. A text-only host has no banner windows (like t3run):
 * bannerCreate() returns nil, so the library falls back on the status line,
 * and the other functions do nothing. A host in HTML mode gets banners
 * (Console keeps their contents and reports changes to IHost.banner).
 */

function con() { return Vm.getInstance().console; }
function int(v: VmData): number { return v instanceof VmInt ? v.value : 0; }

/** bannerCreate(parent, where, other, windowType, align, size, sizeUnits, styleFlags) */
export function builtin_bannerCreate(parent: VmData, where: VmData, other: VmData, windowType: VmData,
                                     align: VmData, size: VmData, sizeUnits: VmData, style: VmData): VmData {
  let h = con().bannerCreate(int(parent), int(where), int(other), int(align), int(size), int(sizeUnits), int(style));
  return h === null ? new VmNil() : new VmInt(h);
}

export function builtin_bannerDelete(handle: VmData): VmData {
  con().bannerDelete(int(handle));
  return new VmNil();
}

export function builtin_bannerClear(handle: VmData): VmData {
  con().bannerClear(int(handle));
  return new VmNil();
}

export function builtin_bannerSay(handle: VmData, ...args: VmData[]): VmData {
  con().bannerSay(int(handle), sayText(args));
  return new VmNil();
}

export function builtin_bannerFlush(handle: VmData): VmData {
  con().bannerFlush(int(handle));
  return new VmNil();
}

export function builtin_bannerSizeToContents(handle: VmData): VmData {
  con().bannerSizeToContents(int(handle));
  return new VmNil();
}

export function builtin_bannerGoTo(handle: VmData, row: VmData, col: VmData): VmData { return new VmNil(); }
export function builtin_bannerSetTextColor(handle: VmData, fg: VmData, bg: VmData): VmData { return new VmNil(); }
export function builtin_bannerSetScreenColor(handle: VmData, color: VmData): VmData { return new VmNil(); }

/** bannerGetInfo(handle): [align, style, rows, columns, pixel height, pixel width], or nil. */
export function builtin_bannerGetInfo(handle: VmData): VmData {
  let info = con().bannerInfo(int(handle));
  return info === null ? new VmNil() : new VmList(info.map((n) => new VmInt(n)));
}

export function builtin_bannerSetSize(handle: VmData, size: VmData, units: VmData, advisory: VmData): VmData {
  con().bannerSetSize(int(handle), int(size), int(units));
  return new VmNil();
}
