import { VmData, VmInt, VmNil, VmSstring, VmProp } from "../../types";
import { Vm } from "../../Vm";

/** t3RunGC(): collect garbage now. */
export function builtin_t3RunGC(): VmData {
  Vm.getInstance().collectGarbage();
  return new VmNil();
}

/**
 * t3GetVMVsn(): the VM version, as 0xMMmmrr. We implement the T3 VM of
 * TADS 3.1.3.
 */
export function builtin_t3GetVMVsn(): VmData {
  return new VmInt(0x030103);
}

/** t3GetVMID(): identifies this VM implementation. */
export function builtin_t3GetVMID(): VmData {
  return new VmSstring('tads3js');
}

/** t3GetVMBanner(): the VM's name and version. */
export function builtin_t3GetVMBanner(): VmData {
  return new VmSstring('tads3js T3 VM 3.1.3');
}

/**
 * t3GetVMPreinitMode(): whether the program is running preinit. We only run
 * compiled programs (preinit has run in the compiler), so never; like the
 * reference VM, the answer is 0.
 */
export function builtin_t3GetVMPreinitMode(): VmData {
  return new VmInt(0);
}

/** t3DebugTrace(mode, ...): there's no debugger. */
export function builtin_t3DebugTrace(mode: VmData, ...args: VmData[]): VmData {
  return new VmNil();
}

/**
 * t3GetGlobalSymbols(which?): symbols are only available during preinit
 * or in a program compiled for debugging (we don't read the debug
 * symbols), so nil.
 */
export function builtin_t3GetGlobalSymbols(which?: VmData): VmData {
  return new VmNil();
}

/** t3AllocProp(): a new property ID. */
export function builtin_t3AllocProp(): VmData {
  return new VmProp(Vm.getInstance().allocProp());
}
