import { Stack } from "./Stack";
import { VmData } from "./types";
import * as B from "./builtin/";

export class Builtin {
  private static funcs: ((stack: Stack, ...args: any[]) => any)[][] = [
    [ ],
    [
      /* 00 */ B.builtin_dataType,
      /* 01 */ B.builtin_getArg,
      /* 02 */ null,
      /* 03 */ null,
      /* 04 */ null,
      /* 05 */ null,
      /* 06 */ B.builtin_toString,
      /* 07 */ B.builtin_toInteger,
      /* 08 */ null,
      /* 09 */ null,
      /* 10 */ null,
      /* 11 */ null,
      /* 12 */ null,
      /* 13 */ null,
      /* 14 */ null,
      /* 15 */ null,
      /* 16 */ null,
      /* 17 */ null,
      /* 18 */ null,
      /* 19 */ null,
      /* 20 */ null,
      /* 21 */ null,
      /* 22 */ null,
      /* 23 */ null,
      /* 24 */ B.builtin_makeList,
      /* 25 */ B.builtin_abs
    ]
  ]

  static call(set: number, index: number, stack: Stack, argc: number): VmData {
    let args = [];
    while(argc-- > 0) args.push(stack.pop());
    let f = Builtin.funcs[set][index];
    if(!f) throw(`Builtin function set ${set} index ${index} does not exist.`);
    return f(stack, ...args);
  }
}