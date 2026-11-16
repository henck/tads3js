import { InputPending } from './io/Host';
import { VmData } from "./types";
import * as B from "./builtin/index";
import { Vm } from "./Vm";
import { Gc } from "./Gc";

export class Builtin {
  private static funcs: ((...args: any[]) => any)[][] = [
    [ // t3vm
      /* 00 */ B.builtin_t3RunGC,
      /* 01 */ B.builtin_t3SetSay,
      /* 02 */ B.builtin_t3GetVMVsn,
      /* 03 */ B.builtin_t3GetVMID,
      /* 04 */ B.builtin_t3GetVMBanner,
      /* 05 */ B.builtin_t3GetVMPreinitMode,
      /* 06 */ B.builtin_t3DebugTrace,
      /* 07 */ B.builtin_t3GetGlobalSymbols,
      /* 08 */ B.builtin_t3AllocProp,
      /* 09 */ B.builtin_t3GetStackTrace,
      /* 10 */ B.builtin_t3GetNamedArg,
      /* 11 */ B.builtin_t3GetNamedArgList
    ],
    [ // tadsgen
      /* 00 */ B.builtin_dataType,
      /* 01 */ B.builtin_getArg,
      /* 02 */ B.builtin_firstObj,
      /* 03 */ B.builtin_nextObj,
      /* 04 */ B.builtin_randomize,
      /* 05 */ B.builtin_rand,
      /* 06 */ B.builtin_toString,
      /* 07 */ B.builtin_toInteger,
      /* 08 */ B.builtin_getTime,
      /* 09 */ B.builtin_rexMatch,
      /* 10 */ B.builtin_rexSearch,
      /* 11 */ B.builtin_rexGroup,
      /* 12 */ B.builtin_rexReplace,
      /* 13 */ B.builtin_savepoint,
      /* 14 */ B.builtin_undo,
      /* 15 */ B.builtin_saveGame,
      /* 16 */ B.builtin_restoreGame,
      /* 17 */ B.builtin_restartGame,
      /* 18 */ B.builtin_max,
      /* 19 */ B.builtin_min,
      /* 20 */ B.builtin_makeString,
      /* 21 */ B.builtin_getFuncParams,
      /* 22 */ B.builtin_toNumber,
      /* 23 */ B.builtin_sprintf,
      /* 24 */ B.builtin_makeList,
      /* 25 */ B.builtin_abs,
      /* 26 */ B.builtin_sgn,
      /* 27 */ B.builtin_concat,
      /* 28 */ B.builtin_rexSearchLast
    ],
    [ // tads-io
      /* 00 */ B.builtin_tadsSay,
      /* 01 */ B.builtin_setLogFile,
      /* 02 */ B.builtin_clearScreen,
      /* 03 */ B.builtin_morePrompt,
      /* 04 */ B.builtin_inputLine,
      /* 05 */ B.builtin_inputKey,
      /* 06 */ B.builtin_inputEvent,
      /* 07 */ B.builtin_inputDialog,
      /* 08 */ B.builtin_inputFile,
      /* 09 */ B.builtin_timeDelay,
      /* 10 */ B.builtin_systemInfo,
      /* 11 */ B.builtin_statusMode,
      /* 12 */ B.builtin_statusRight,
      /* 13 */ B.builtin_resExists,
      /* 14 */ B.builtin_setScriptFile,
      /* 15 */ B.builtin_getLocalCharSet,
      /* 16 */ B.builtin_flushOutput,
      /* 17 */ B.builtin_inputLineTimeout,
      /* 18 */ B.builtin_inputLineCancel,
      /* 19 */ B.builtin_bannerCreate,
      /* 20 */ B.builtin_bannerDelete,
      /* 21 */ B.builtin_bannerClear,
      /* 22 */ B.builtin_bannerSay,
      /* 23 */ B.builtin_bannerFlush,
      /* 24 */ B.builtin_bannerSizeToContents,
      /* 25 */ B.builtin_bannerGoTo,
      /* 26 */ B.builtin_bannerSetTextColor,
      /* 27 */ B.builtin_bannerSetScreenColor,
      /* 28 */ B.builtin_bannerGetInfo,
      /* 29 */ B.builtin_bannerSetSize,
      /* 30 */ B.builtin_logConsoleCreate,
      /* 31 */ B.builtin_logConsoleClose,
      /* 32 */ B.builtin_logConsoleSay
    ]
  ]

  static call(set: number, index: number, argc: number): VmData {
    let args: VmData[] = [];
    while(argc-- > 0) args.push(Vm.getInstance().stack.pop());
    let f = Builtin.funcs[set][index];
    if(!f) throw(`Builtin function set ${set} index ${index} does not exist.`);
    // Keep the arguments, and what the function creates, safe from garbage
    // collection while it runs. If it waits for input the host doesn't have
    // yet, the VM pauses, and calls it again when it resumes.
    const invoke = (): VmData => {
      try {
        return Gc.native(null, args, () => f(...args));
      } catch(e) {
        if(e instanceof InputPending) e.retry = invoke;
        throw e;
      }
    };
    return invoke();
  }
}