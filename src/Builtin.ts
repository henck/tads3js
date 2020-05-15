import { Stack } from "./Stack";
import { VmData } from "./types";
import { dataType, getArg } from "./builtin/";

export class Builtin {
  private static funcs: ((stack: Stack, ...args: any[]) => any)[][] = [
    [ ],
    [
      dataType,
      getArg
    ]
  ]

  static call(set: number, index: number, stack: Stack, argc: number): VmData {
    let args = [];
    while(argc-- > 0) args.push(stack.pop());
    return Builtin.funcs[set][index](stack, ...args);
  }
}