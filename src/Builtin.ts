import { VmData } from "./types";
import * as B from "./builtin/";
import { Vm } from "./Vm";

export class Builtin {
  private static funcs: ((...args: any[]) => any)[][] = [
    [ 
      /* 00 */ B.builtin_t3RunGC,
      /* 01 */ B.builtin_t3SetSay,
      /* 02 */ B.builtin_t3GetVMVsn,
      /* 03 */ null, // t3GetVMID
      /* 04 */ null, // t3GetVMBanner
      /* 05 */ B.builtin_t3GetVMPreinitMode,
      /* 06 */ null, // t3DebugTrace
      /* 07 */ null, // t3GetGlobalSymbols
      /* 08 */ null, // t3AllocProp
      /* 09 */ null, // t3GetStackTrace
      /* 10 */ B.builtin_t3GetNamedArg,
      /* 11 */ null  // t3GetNamedArgList
    ],
    [
      /* 00 */ B.builtin_dataType,
      /* 01 */ B.builtin_getArg,
      /* 02 */ B.builtin_firstObj,
      /* 03 */ B.builtin_nextObj,
      /* 04 */ B.builtin_randomize,
      /* 05 */ null, // rand
      /* 06 */ B.builtin_toString,
      /* 07 */ B.builtin_toInteger,
      /* 08 */ B.builtin_getTime,
      /* 09 */ B.builtin_rexMatch,
      /* 10 */ B.builtin_rexSearch,
      /* 11 */ null, // rexGroup
      /* 12 */ B.builtin_rexReplace,
      /* 13 */ null, // savepoint
      /* 14 */ null, // undo
      /* 15 */ null, // saveGame
      /* 16 */ null, // restoreGame
      /* 17 */ null, // restartGame
      /* 18 */ B.builtin_max,
      /* 19 */ B.builtin_min,
      /* 20 */ B.builtin_makeString,
      /* 21 */ B.builtin_getFuncParams,
      /* 22 */ null, // B.toNumber
      /* 23 */ null, // B.sprintf
      /* 24 */ B.builtin_makeList,
      /* 25 */ B.builtin_abs,
      /* 26 */ B.builtin_sgn,
      /* 27 */ B.builtin_concat,
      /* 28 */ null // rexSearchLast
    ],
    [
      /* 00 */ B.builtin_tadsSay,
      /* 01 */ null, // setLogFile
      /* 02 */ null, // clearScreen
      /* 03 */ null, // morePrompt
      /* 04 */ null, // inputLine
      /* 05 */ null, // inputKey
      /* 06 */ null, // inputEvent
      /* 07 */ null, // inputDialog
      /* 08 */ null, // inputFile
      /* 09 */ null, // timeDelay
      /* 10 */ B.builtin_systemInfo,
      /* 11 */ null, // statusMode
      /* 12 */ null, // statusRight
      /* 13 */ null, // resExists
      /* 14 */ null, // setScriptFile
      /* 15 */ null, // getLocalCharSet
      /* 16 */ null, // flushOutput
      /* 17 */ null, // inputLineTimeout
      /* 18 */ null, // inputLineCancel
      /* 19 */ B.builtin_bannerCreate,
      /* 20 */ null, // bannerDelete
      /* 21 */ B.builtin_bannerClear,
      /* 22 */ B.builtin_bannerSay,
      /* 23 */ null, // bannerFlush
      /* 24 */ B.builtin_bannerSizeToContents,
      /* 25 */ null, // bannerGoTo
      /* 26 */ null, // bannerSetTextColor
      /* 27 */ null, // bannerSetScreenColor
      /* 28 */ null, // bannerGetInfo
      /* 29 */ B.builtin_bannerSetSize, // bannerSetSize
      /* 30 */ null, // logConsoleCreate
      /* 31 */ null, // logConsoleClose
      /* 32 */ null, // logConsoleSay

    ]
  ]

  static call(set: number, index: number, argc: number): VmData {
    let args = [];
    while(argc-- > 0) args.push(Vm.getInstance().stack.pop());
    let f = Builtin.funcs[set][index];
    if(!f) throw(`Builtin function set ${set} index ${index} does not exist.`);
    return f(...args);
  }
}