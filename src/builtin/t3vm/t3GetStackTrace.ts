import { VmData, VmInt, VmList, VmNil } from "../../types";

/**
 * Returns a stack trace: a list of T3StackInfo objects, or with a level,
 * the T3StackInfo for that level.
 * @todo Build real T3StackInfo objects. For now the trace is empty, which
 * the library's RuntimeError constructor (and display code) accepts.
 * @param vmLevel Optional stack level
 * @param vmFlags Optional flags
 */
export function builtin_t3GetStackTrace(vmLevel?: VmData, vmFlags?: VmData): VmData {
  if(vmLevel instanceof VmInt) return new VmNil();
  return new VmList([]);
}
