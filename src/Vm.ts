import { SourceImage } from './SourceImage'
import { DataBlock, DataBlockFactory, CPDF, CPPG, ENTP, MCLD, OBJS, SYMD, GSYM, MRES } from './blocks/'
import { VmData, VmNil, VmTrue, VmInt, VmSstring, VmList, VmCodeOffset, VmObject, VmProp, VmFuncPtr, VmDstring, VmNativeCode, VmBifPtr, VmEnum, DataFactory } from './types/'
import { Stack } from './Stack'
import { Pool } from './Pool'
import { Debug } from './Debug'
import { Builtin } from './Builtin'
import { MetaclassRegistry } from './metaclass/MetaclassRegistry'
import { MetaclassFactory } from './metaclass/MetaclassFactory'
import { Heap } from './Heap'
import { Undo } from './Undo'
import { Gc } from './Gc'
import { Platform } from './Platform'
import { random } from './util/Random'
import { Lookup } from './metaclass/RootObject'
import { IHost, BufferHost, InputPending } from './io/Host'
import { Console } from './io/Console'
import { IProgram, IStaticObject } from './Persist'
import { MetaString, List, Iterator, IntrinsicClass, AnonFunc, TadsObject } from './metaimp'
import { IFuncInfo } from './IFuncInfo'
import { Symbols } from './Symbols'
import { UTF8 } from './utf8'
import { Match } from './regexp/TadsRegex'
import { VmRuntimeError, VmErr, toVmError } from './VmErrors'
import { VmAnonMethod } from './types/VmAnonMethod'


interface IPropInfo {
  targetObject: VmObject,
  definingObject: VmObject,
  data: VmData
}

// Opcode list entry (name and VM method to call)
interface IOpcode {
  name: string;
  func: () => void;
}

export class Vm {
  private static instance: Vm = null;

  private image: SourceImage;
  private blocks: DataBlock[] = [];
  private codePool: Pool;
  private dataPool: Pool;
  // Objects loaded from the image, and the image's build timestamp
  // (identifying the program in saved state files).
  private staticObjects: IStaticObject[] = [];
  private imageTimestamp: string;
  // Multimedia resources embedded in the image: lower-case name -> location.
  private resources = new Map<string, { name: string, offset: number, size: number }>();
  private ip: number = 0;
  private ep: number = 0;
  public r0: VmData = null;
  public stack: Stack;
  public stop = false;
  private varargc: number = undefined;
  // The default display function and method (t3SetSay), used to display
  // double-quoted strings and embedded expressions.
  public outputFunc: VmFuncPtr | VmObject | VmNil = new VmNil();
  public outputMethod: VmProp | VmNil = new VmNil();
  // Seed the random number generator randomly when a program starts? (If
  // not, rand() gives the same numbers as t3run -norand.)
  public randomSeed = true;
  // A make-believe clock for getTime() (for reproducible tests of games that
  // use the time): the date is always 2000-01-01 12:00:00, and the tick
  // count goes up by 100 ms each time it's read.
  public fixedClock = false;
  public fixedTicks = 0;
  // Where output goes and input comes from.
  public host: IHost = new BufferHost();
  public console: Console = new Console(this.host);
  public match: Match = null;

  // Safety net for tests: if non-zero, abort after this many instructions.
  public instructionLimit: number = 0;
  private instructionCount: number = 0;

  // Code pool offset of the instruction currently being executed. Used to
  // find exception handlers covering the instruction that threw.
  private instructionStart: number = 0;

  private OPCODES: Map<number, IOpcode> = new Map([
    /* OK */ [0x01, { name: 'PUSH_0',          func: this.op_push_0 }],
    /* OK */ [0x02, { name: 'PUSH_1',          func: this.op_push_1 }],
    /* OK */ [0x03, { name: 'PUSHINT8',        func: this.op_pushint8 }],
    /* OK */ [0x04, { name: 'PUSHINT',         func: this.op_pushint }],
    /* OK */ [0x05, { name: 'PUSHSTR',         func: this.op_pushstr }],
    /* OK */ [0x06, { name: 'PUSHLST',         func: this.op_pushlst }],
    /* OK */ [0x07, { name: 'PUSHOBJ',         func: this.op_pushobj }],
    /* OK */ [0x08, { name: 'PUSHNIL',         func: this.op_pushnil }],
    /* OK */ [0x09, { name: 'PUSHTRUE',        func: this.op_pushtrue }],
    /* OK */ [0x0A, { name: 'PUSHPROPID',      func: this.op_pushpropid }],
    /* OK */ [0x0B, { name: 'PUSHFNPTR',       func: this.op_pushfnptr }],
    /* OK */ [0x0C, { name: 'PUSHSTRI',        func: this.op_no_debug_support }],
    /* OK */ [0x0D, { name: 'PUSHPARLST',      func: this.op_pushparlst }],
    /* OK */ [0x0E, { name: 'MAKELSTPAR',      func: this.op_makelistpar }],
    /* OK */ [0x0F, { name: 'PUSHENUM',        func: this.op_pushenum }],
    /* OK */ [0x10, { name: 'PUSHBIFPTR',      func: this.op_pushbifptr }],
             // 0x11..0x1f empty     
    /* OK */ [0x20, { name: 'NEG',             func: this.op_neg }],
    /* OK */ [0x21, { name: 'BNOT',            func: this.op_bnot }],
    /* OK */ [0x22, { name: 'ADD',             func: this.op_add }],
    /* OK */ [0x23, { name: 'SUB',             func: this.op_sub }],
    /* OK */ [0x24, { name: 'MUL',             func: this.op_mul }],
    /* OK */ [0x25, { name: 'BAND',            func: this.op_band }],
    /* OK */ [0x26, { name: 'BOR',             func: this.op_bor }],
    /* OK */ [0x27, { name: 'SHL',             func: this.op_shl }],
    /* OK */ [0x28, { name: 'ASHR',            func: this.op_ashr }],
    /* OK */ [0x29, { name: 'XOR',             func: this.op_xor }],
    /* OK */ [0x2A, { name: 'DIV',             func: this.op_div }],
    /* OK */ [0x2B, { name: 'MOD',             func: this.op_mod }],
    /* OK */ [0x2C, { name: 'NOT',             func: this.op_not }],  
    /* OK */ [0x2D, { name: 'BOOLIZE',         func: this.op_boolize }],
    /* OK */ [0x2E, { name: 'INC',             func: this.op_inc }],
    /* OK */ [0x2F, { name: 'DEC',             func: this.op_dec }],
    /* OK */ [0x30, { name: 'LSHR',            func: this.op_lshr }],
             // 0x31..0x3f empty     
    /*    */ [0x40, { name: 'EQ',              func: this.op_eq }],
    /* OK */ [0x41, { name: 'NE',              func: this.op_ne }],
    /*    */ [0x42, { name: 'LT',              func: this.op_lt }],
    /* OK */ [0x43, { name: 'LE',              func: this.op_le }],
    /* OK */ [0x44, { name: 'GT',              func: this.op_gt }],
    /* OK */ [0x45, { name: 'GE',              func: this.op_ge }],
             // 0x46..0x4f empty     
    /* OK */ [0x50, { name: 'RETVAL',          func: this.op_retval }],
    /* OK */ [0x51, { name: 'RETNIL',          func: this.op_retnil }],
    /* OK */ [0x52, { name: 'RETTRUE',         func: this.op_rettrue }],
             // 0x53 empty   
    /* OK */ [0x54, { name: 'RET',             func: this.op_ret }],
             // 0x55 empty   
    /* OK */ [0x56, { name: 'NAMEDARGPTR',     func: this.op_namedargptr }],
    /* OK */ [0x57, { name: 'NAMEDARGTAB',     func: this.op_namedargtab }],
    /*    */ [0x58, { name: 'CALL',            func: this.op_call }],
    /*    */ [0x59, { name: 'PTRCALL',         func: this.op_ptrcall }],
             // 0x5a..0x5f empty
    /*    */ [0x60, { name: 'GETPROP',         func: this.op_getprop }],
    /*    */ [0x61, { name: 'CALLPROP',        func: this.op_callprop }],
    /*    */ [0x62, { name: 'PTRCALLPROP',     func: this.op_ptrcallprop }],
    /*    */ [0x63, { name: 'GETPROPSELF',     func: this.op_getpropself }],
    /*    */ [0x64, { name: 'CALLPROPSELF',    func: this.op_callpropself }],
    /*    */ [0x65, { name: 'PTRCALLPROPSELF', func: this.op_ptrcallpropself }],
    /*    */ [0x66, { name: 'OBJGETPROP',      func: this.op_objgetprop }],
    /*    */ [0x67, { name: 'OBJCALLPROP',     func: this.op_objcallprop }],
    /*    */ [0x68, { name: 'GETPROPDATA',     func: this.op_getpropdata }],
    /*    */ [0x69, { name: 'PTRGETPROPDATA',  func: this.op_ptrgetpropdata }],
    /*    */ [0x6a, { name: 'GETPROPLCL1',     func: this.op_getproplcl1 }],
    /*    */ [0x6b, { name: 'CALLPROPLCL1',    func: this.op_callproplcl1 }],
    /*    */ [0x6c, { name: 'GETPROPR0',       func: this.op_getpropr0 }],
    /*    */ [0x6d, { name: 'CALLPROPR0',      func: this.op_callpropr0 }],
             // 0x6e..0x71 empty
    /*    */ [0x72, { name: 'INHERIT',         func: this.op_inherit }],
    /*    */ [0x73, { name: 'PTRINHERIT',      func: this.op_ptrinherit }],
    /*    */ [0x74, { name: 'EXPINHERIT',      func: this.op_expinherit }],
    /*    */ [0x75, { name: 'PTREXPINHERIT',   func: this.op_ptrexpinherit }],
    /*    */ [0x76, { name: 'VARARGC',         func: this.op_varargc }],
    /*    */ [0x77, { name: 'DELEGATE',        func: this.op_delegate }],
    /*    */ [0x78, { name: 'PTRDELEGATE',     func: this.op_ptrdelegate }],
             // 0x79 empty
    /* OK */ [0x7a, { name: 'SWAP2',           func: this.op_swap2 }],
    /* OK */ [0x7b, { name: 'SWAPN',           func: this.op_swapn }],
    /* OK */ [0x7c, { name: 'GETARGN0',        func: this.op_getargn0 }],
    /* OK */ [0x7d, { name: 'GETARGN1',        func: this.op_getargn1 }],
    /* OK */ [0x7e, { name: 'GETARGN2',        func: this.op_getargn2 }],
    /* OK */ [0x7f, { name: 'GETARGN3',        func: this.op_getargn3 }],
    /* OK */ [0x80, { name: 'GETLCL1',         func: this.op_getlcl1 }],
    /* OK */ [0x81, { name: 'GETLCL2',         func: this.op_getlcl2 }],
    /* OK */ [0x82, { name: 'GETARG1',         func: this.op_getarg1 }],
    /* OK */ [0x83, { name: 'GETARG2',         func: this.op_getarg2 }],
    /* OK */ [0x84, { name: 'PUSHSELF',        func: this.op_pushself }],
    /* DB */ [0x85, { name: 'GETDBLCL',        func: this.op_no_debug_support }],
    /* DB */ [0x86, { name: 'GETDBARG',        func: this.op_no_debug_support }],
    /* OK */ [0x87, { name: 'GETARGC',         func: this.op_getargc }],
    /* OK */ [0x88, { name: 'DUP',             func: this.op_dup }],
    /* OK */ [0x89, { name: 'DISC',            func: this.op_disc }],
    /* OK */ [0x8a, { name: 'DISC1',           func: this.op_disc1 }],
    /* OK */ [0x8b, { name: 'GETR0',           func: this.op_getr0 }],
    /* DB */ [0x8c, { name: 'GETDBARGC',       func: this.op_no_debug_support }],
    /* OK */ [0x8d, { name: 'SWAP',            func: this.op_swap }],
    /*    */ [0x8e, { name: 'PUSHCTXELE',      func: this.op_pushctxele }],
    /* OK */ [0x8f, { name: 'DUP2',            func: this.op_dup2 }],
    /* OK */ [0x90, { name: 'SWITCH',          func: this.op_switch }],
    /* OK */ [0x91, { name: 'JMP',             func: this.op_jmp }],
    /* OK */ [0x92, { name: 'JT',              func: this.op_jt }],
    /* OK */ [0x93, { name: 'JF',              func: this.op_jf }],
    /* OK */ [0x94, { name: 'JE',              func: this.op_je }],
    /* OK */ [0x95, { name: 'JNE',             func: this.op_jne }],
    /* OK */ [0x96, { name: 'JGT',             func: this.op_jgt }],
    /* OK */ [0x97, { name: 'JGE',             func: this.op_jge }],
    /* OK */ [0x98, { name: 'JLT',             func: this.op_jlt }],
    /* OK */ [0x99, { name: 'JLE',             func: this.op_jle }],
    /* OK */ [0x9a, { name: 'JST',             func: this.op_jst }],
    /* OK */ [0x9b, { name: 'JSF',             func: this.op_jsf }],
    /* OK */ [0x9c, { name: 'LJSR',            func: this.op_ljsr }],
    /* OK */ [0x9d, { name: 'LRET',            func: this.op_lret }],
    /* OK */ [0x9e, { name: 'JNIL',            func: this.op_jnil }],
    /* OK */ [0x9f, { name: 'JNOTNIL',         func: this.op_jnotnil }],
    /* OK */ [0xa0, { name: 'JR0T',            func: this.op_jr0t }],
    /* OK */ [0xa1, { name: 'JR0F',            func: this.op_jr0f }],
    /*    */ [0xa2, { name: 'ITERNEXT',        func: this.op_iternext }],
    /* OK */ [0xa3, { name: 'GETSETLCL1R0',    func: this.op_getsetlcl1r0 }],
    /* OK */ [0xa4, { name: 'GETSETLCL1',      func: this.op_getsetlcl1 }],
    /* OK */ [0xa5, { name: 'DUPR0',           func: this.op_dupr0 }],
    /* OK */ [0xa6, { name: 'GETSPN',          func: this.op_getspn }],
             // 0xa7..0xa9 empty
    /* OK */ [0xaa, { name: 'GETLCLN0',        func: this.op_getlcln0 }],
    /* OK */ [0xab, { name: 'GETLCLN1',        func: this.op_getlcln1 }],
    /* OK */ [0xac, { name: 'GETLCLN2',        func: this.op_getlcln2 }],
    /* OK */ [0xad, { name: 'GETLCLN3',        func: this.op_getlcln3 }],
    /* OK */ [0xae, { name: 'GETLCLN4',        func: this.op_getlcln4 }],
    /* OK */ [0xaf, { name: 'GETLCLN5',        func: this.op_getlcln5 }],
    /*    */ [0xb0, { name: 'SAY',             func: this.op_say }],
    /*    */ [0xb1, { name: 'BUILTIN_A',       func: this.op_builtin_a }],
    /*    */ [0xb2, { name: 'BUILTIN_B',       func: this.op_builtin_b }],
    /*    */ [0xb3, { name: 'BUILTIN_C',       func: this.op_builtin_c }],
    /*    */ [0xb4, { name: 'BUILTIN_D',       func: this.op_builtin_d }],
    /*    */ [0xb5, { name: 'BUILTIN1',        func: this.op_builtin1 }],
    /*    */ [0xb6, { name: 'BUILTIN2',        func: this.op_builtin2 }],
    /* -- */ [0xb7, { name: 'CALLEXT',         func: null }], /* CALLEXT not supported in TADS3.1 */
    /*    */ [0xb8, { name: 'THROW',           func: this.op_throw }],
    /*    */ [0xb9, { name: 'SAYVAL',          func: this.op_sayval }],
    /*    */ [0xba, { name: 'INDEX',           func: this.op_index }],
    /*    */ [0xbb, { name: 'IDXLCL1INT8',     func: this.op_idxlcl1int8 }],
    /*    */ [0xbc, { name: 'IDXINT8',         func: this.op_idxint8 }],
             // 0xbd..0xbf empty
    /*    */ [0xc0, { name: 'NEW1',            func: this.op_new1 }],
    /*    */ [0xc1, { name: 'NEW2',            func: this.op_new2 }],
    /*    */ [0xc2, { name: 'TRNEW1',          func: this.op_trnew1 }],
    /*    */ [0xc3, { name: 'TRNEW2',          func: this.op_trnew2 }], 
             // 0xc4..0xcf empty
    /* OK */ [0xd0, { name: 'INCLCL',          func: this.op_inclcl }],
    /* OK */ [0xd1, { name: 'DECLCL',          func: this.op_declcl }],
    /* OK */ [0xd2, { name: 'ADDILCL1',        func: this.op_addilcl1 }],
    /* OK */ [0xd3, { name: 'ADDILCL4',        func: this.op_addilcl4 }],
    /* OK */ [0xd4, { name: 'ADDTOLCL',        func: this.op_addtolcl }],
    /* OK */ [0xd5, { name: 'SUBFROMLCL',      func: this.op_subfromlcl }],
    /* OK */ [0xd6, { name: 'ZEROLCL1',        func: this.op_zerolcl1 }],
    /* OK */ [0xd7, { name: 'ZEROLCL2',        func: this.op_zerolcl2 }],
    /* OK */ [0xd8, { name: 'NILLCL1',         func: this.op_nillcl1 }],
    /* OK */ [0xd9, { name: 'NILLCL2',         func: this.op_nillcl2 }],
    /* OK */ [0xda, { name: 'ONELCL1',         func: this.op_onelcl1 }],
    /* OK */ [0xdb, { name: 'ONELCL2',         func: this.op_onelcl2 }],
             // 0xdc..0xdf empty
    /* OK */ [0xe0, { name: 'SETLCL1',         func: this.op_setlcl1 }],
    /* OK */ [0xe1, { name: 'SETLCL2',         func: this.op_setlcl2 }],
    /* OK */ [0xe2, { name: 'SETARG1',         func: this.op_setarg1 }],
    /* OK */ [0xe3, { name: 'SETARG2',         func: this.op_setarg2 }],
    /*    */ [0xe4, { name: 'SETIND',          func: this.op_setind }],
    /*    */ [0xe5, { name: 'SETPROP',         func: this.op_setprop }],
    /*    */ [0xe6, { name: 'PTRSETPROP',      func: this.op_ptrsetprop }],
    /*    */ [0xe7, { name: 'SETPROPSELF',     func: this.op_setpropself }],
    /*    */ [0xe8, { name: 'OBJSETPROP',      func: this.op_objsetprop }],
    /* DB */ [0xe9, { name: 'SETDBLCL',        func: this.op_no_debug_support }],
    /* DB */ [0xea, { name: 'SETDBARG',        func: this.op_no_debug_support }],
    /* OK */ [0xeb, { name: 'SETSELF',         func: this.op_setself }],
    /* OK */ [0xec, { name: 'LOADCTX',         func: this.op_loadctx }],
    /* OK */ [0xed, { name: 'STORECTX',        func: this.op_storectx }],
    /* OK */ [0xee, { name: 'SETLCL1R0',       func: this.op_setlcl1r0 }],
    /*    */ [0xef, { name: 'SETINDLCL1I8',    func: this.op_setindlcl1i8 }],
             // 0xf0 empty
    /* OK */ [0xf1, { name: 'BP',              func: this.op_bp }],
    /* OK */ [0xf2, { name: 'NOP',             func: this.op_nop }]
  ]);

  constructor() {
  }

  // The next property ID for t3AllocProp() (0 until first needed).
  private nextPropID = 0;

  /**
   * Allocate a new property ID, above all those used in the program (as
   * far as we can tell: in object definitions, metaclass property tables
   * and exported symbols).
   */
  public allocProp(): number {
    if(this.nextPropID == 0) {
      let max = 0;
      Heap.forEach((id, obj) => obj.getPropIDs().forEach((p) => max = Math.max(max, p)));
      MetaclassRegistry.classes.forEach((c) => c && c.props.forEach((p) => max = Math.max(max, p)));
      Symbols.values().forEach((v) => { if(v instanceof VmProp) max = Math.max(max, v.value); });
      this.nextPropID = max + 1;
    }
    if(this.nextPropID > 0xFFFF) throw new VmRuntimeError(205);
    return this.nextPropID++;
  }

  // Names of objects, properties and functions, from a debug build's GSYM block.
  private names: { objects: Map<number, string>, props: Map<number, string>, funcs: Map<number, string> } = null;

  /** A readable name for a value (for diagnostics). */
  public nameOf(v: VmData): string {
    if(v instanceof VmObject) {
      let name = this.names && this.names.objects.get(v.value);
      if(name) return name;
      let obj = v.getInstance();
      // An instance: show its class.
      let sc = obj ? (obj as any).superClasses : null;
      if(sc && sc.length) return 'instance of ' + this.nameOf(new VmObject(sc[0]));
      return 'obj#' + v.value;
    }
    if(v instanceof VmProp) return (this.names && this.names.props.get(v.value)) || 'prop#' + v.value;
    return v ? v.toStr() : 'nil';
  }

  /** The call stack, innermost first (for diagnostics). */
  public traceback(): string[] {
    let out: string[] = [];
    let fp = this.stack.fp;
    for(let depth = 0; fp > 0 && depth < 40; depth++) {
      let self = this.stack.peekAbsolute(fp - 6), prop = this.stack.peekAbsolute(fp - 9);
      let def = this.stack.peekAbsolute(fp - 7);
      if(prop instanceof VmProp) out.push(`  ${this.nameOf(self)}.${this.nameOf(prop)} (defined in ${this.nameOf(def)})`);
      else out.push('  (function)');
      fp = this.stack.peekAbsolute(fp - 1).value;
    }
    return out;
  }

  /** Collect garbage; returns the number of objects collected. */
  public collectGarbage(): number {
    let roots: any[] = [this.r0, this.outputFunc, this.outputMethod, Symbols.values(), Undo.gcRoots()];
    for(let i = 0; i < this.stack.sp; i++) roots.push(this.stack.peekAbsolute(i));
    return Gc.collect(roots, this.staticObjects.map((s) => s.id));
  }

  /** The loaded program, for saving, restoring and restarting. */
  public program(): IProgram {
    return { imageTimestamp: this.imageTimestamp, staticObjects: this.staticObjects, image: this.image, dataPool: this.dataPool };
  }

  /** The contents of a resource embedded in the image (case-insensitive name), or null. */
  public resource(name: string): Uint8Array | null {
    let r = this.resources.get(name.toLowerCase());
    return r ? this.image.getBytes(r.offset, r.size) : null;
  }

  /** The names of the resources embedded in the image. */
  public resourceNames(): string[] {
    return Array.from(this.resources.values()).map((r) => r.name);
  }

  public static getInstance(): Vm {
    if(Vm.instance == null) {
      Vm.instance = new Vm();
    }
    return Vm.instance;
  }

  /** Load a program from an image file. */
  load(path : string) {
    let data = Platform.get().fs.readFile(path);
    if(data === null) throw new Error('file not found: ' + path);
    this.loadImage(data);
  }

  /** Load a program from the contents of an image file. */
  loadImage(data: Uint8Array) {
    this.image = new SourceImage(data);
    // console.info('Loaded', this.image.length(), 'bytes');

    let pos = SourceImage.HEADER_SIZE;
    this.blocks = [];
    let unknownBlocks = [];
    while(pos < this.image.length()) {
      let type = this.image.getString(pos, 4);
      let block = DataBlockFactory.create(type, this.image, pos);
      if(block.toString() == null) {
        unknownBlocks.push(type);
      } else {
        this.blocks.push(block);
      }
      pos += block.length + 10;
    }
    Debug.info(`Unknown blocks (${unknownBlocks.length}):`, unknownBlocks.join(','));

    // Create code pool:
    let cpdf = this.blocks.find((b) => b instanceof CPDF && b.identifier == 'code') as CPDF;
    let pages = this.blocks.filter((b) => b instanceof CPPG && b.identifier == 'code') as CPPG[];
    pages = pages.sort((a,b) => a.index - b.index);
    this.codePool = new Pool(this.image, cpdf, pages);

    // Create data pool:
    cpdf = this.blocks.find((b) => b instanceof CPDF && b.identifier == 'data') as CPDF;
    pages = this.blocks.filter((b) => b instanceof CPPG && b.identifier == 'data') as CPPG[];
    pages = pages.sort((a,b) => a.index - b.index);
    this.dataPool = new Pool(this.image, cpdf, pages);

    // Load metaclass dependencies:
    let mcld = this.blocks.find((b) => b instanceof MCLD) as MCLD;
    //mcld.dump(this.image);
    MetaclassRegistry.parseMCLD(this.image, mcld);

    // Load symbols:
    Symbols.clear();
    // There may be more than one SYMD block:    
    this.blocks.filter((b) => b instanceof SYMD).forEach((symd:SYMD) => {;
      symd.processEntries(this.image, this.dataPool, (name, value) => {
        Symbols.set(name, value);
      });
    });

    // Embedded resources:
    this.resources.clear();
    this.blocks.filter((b) => b instanceof MRES).forEach((mres: MRES) => {
      for(let r of mres.entries(this.image)) this.resources.set(r.name.toLowerCase(), r);
    });

    // Load debugging symbols, if any:
    let gsym = this.blocks.find((b) => b instanceof GSYM) as GSYM;
    this.names = gsym ? gsym.load(this.image) : null;

    // Load static objects:
    Heap.clear();
    Lookup.reset();
    this.funcInfoCache.clear();
    random.reset(this.randomSeed);
    this.fixedTicks = 0;
    Undo.clear();
    Gc.reset();
    this.nextPropID = 0;
    this.paused = null;
    this.contextDepth = 0;
    this.console = new Console(this.host);
    this.staticObjects = [];
    this.imageTimestamp = this.image.getString(45, 24);
    let unknownObjects: string[] = [];
    (this.blocks.filter((b) => b instanceof OBJS) as OBJS[]).forEach((objs) => {
      objs.load(this.image, (id: number, metaclass: number, dataOffset: number, isTransient: boolean, size: number) => {
        // Find name and implementation class of object's metaclass.
        let name = MetaclassRegistry.indexToName(metaclass);
        let instance = MetaclassFactory.load(metaclass, this.image, this.dataPool, dataOffset, size);
        if(instance) {
          Heap.setObj(id, instance);
          if(isTransient) instance.setTransient(true);
          this.staticObjects.push({ id: id, metaclass: metaclass, offset: dataOffset, size: size, transient: isTransient });
        }
        // if implementation class doesn't exist, report.
        else {
          unknownObjects.push(name);
        }
      });
    });
    if(unknownObjects.length > 0) {
      Debug.info('Objects with unknown metaclass skipped', unknownObjects.join(','));
    }

    // Create stack.
    this.stack = new Stack();
    this.instructionCount = 0;
  }

  /**
   * If a VARARGC instruction was seen previously, overwrite an instructions
   * encoded argc value with the VARARGC value. Then turn VARARGC mode off.
   * @param argc Instruction's argc value
   */
  maybe_varargc(argc: number) {
    if(this.varargc != undefined) {
      argc = this.varargc;
      this.varargc = undefined;
    }
    return argc;
  }

  // Method headers by code offset (they're read for every call).
  private funcInfoCache = new Map<number, IFuncInfo>();

  getFuncInfo(offset: number): IFuncInfo {
    let info = this.funcInfoCache.get(offset);
    if(!info) {
      info = this.readFuncInfo(offset);
      this.funcInfoCache.set(offset, info);
    }
    return info;
  }

  private readFuncInfo(offset: number): IFuncInfo {
    // Get number of parameters
    let params = this.codePool.getByte(offset);
    // If high bit is set, then a varying parameter list is accepted.
    let varargs = ((params >> 7) == 1);
    // .. and the required number of parameters is:
    if(varargs) params = (params & 0x7f);

    let optParams = this.codePool.getByte(offset + 1);
    let locals = this.codePool.getUint2(offset + 2);
    let stackSlots = this.codePool.getUint2(offset + 4);
    let exceptionTableStart = this.codePool.getUint2(offset + 6);

    return {
      params: params,
      optParams: optParams,
      varargs: varargs,
      locals: locals,
      slots: stackSlots,
      // absolute offset in codePool or 0 for no exception table:
      exceptionTableoffset: exceptionTableStart == 0 ? 0 : exceptionTableStart + offset 
    };
  }

  /**
   * Read a named arguments table at given address.
   * This can be the address of a NAMEDARGPTR or 
   * NAMEDARGTAB instruction. If it's another instruction,
   * an empty list is returned.
   * @param address Address to read from
   * @returns Name list
   */
  private readNamedArgTable(address: number): string[] {
    let names = [];

    // Read instruction at address:
    let instruction = this.codePool.getByte(address);

    // If it's NAMEDARGPTR, jump to associated NAMEDARGTAB.
    if(instruction == 0x56) {
      address += 2; // Skip opcode byte and named_arg_count
      // Read table_offset and skip to NAMEDARGTAB instruction.
      let table_offset = this.codePool.getInt2(address);
      address = address + table_offset;
    }

    // See if we now have a NAMEDARGTAB.
    instruction = this.codePool.getByte(address);
    if(instruction == 0x57) {
      // Skip instruction and table_bytes:
      address += 3;
      // Read arg_count:
      let arg_count = this.codePool.getUint2(address);
      address += 2;
      
      // Read names from table:
      for(let i = 0; i < arg_count; i++) {
        let offset = this.codePool.getUint2(address + i * 2);
        let end = this.codePool.getUint2(address + i * 2 + 2);
        let len = end - offset; 
        let bytes = [];
        for(let j = 0; j < len; j++) {
          bytes.push(this.codePool.getByte(address + offset + j));
        }
        names.push(UTF8.decode(bytes));
      }
    }

    return names;
  }

  /**
   * Read named argument names and value from the stack.
   * This builds a list of name/value pairs, with all named
   * variables found on the stack in the order they were 
   * found on the stack (most recent first).
   * 
   * Each name will appear only once; newer stackframes overwrite
   * existing named arguments with the same name.
   * 
   * @returns Name-value list
   */
  public getNamedArgs(): { name: string, value: VmData }[] {
    let variables: { name: string, value: VmData }[] = [];

    // Start at top stack frame.
    let fp = this.stack.fp;

    do {
      // Get return address from stack frame.
      let address: number = this.stack.peekAbsolute(fp - 4).value;

      // If the frame has no previous frame, stop
      if(address == -1) return variables;

      // Read names from stack frame, adding them to list.
      let names = this.readNamedArgTable(address);

      // Get values for variables from stack frame:
      let argc = this.stack.peekAbsolute(fp - 2).value;
      let localvars = names.map((name: string, idx: number) => { return {
        name: name,
        value: this.stack.peekAbsolute(fp - 10 - argc - names.length + 1 + idx)
      }});

      // Remove any variables that are already in the variable list
      // from a newer stack frame:
      localvars = localvars.filter((lv) => !variables.map((v) => v.name).includes(lv.name));

      // Add the new variables to the variables list:
      variables = variables.concat(localvars);

      // Move to previous stack frame.
      fp = this.stack.peekAbsolute(fp - 1).value;
    }
    while(1 == 1);
  }

  call(offset: number, argc: number, prop: VmProp, targetObj: VmObject, definingObj: VmObject, selfObject: VmObject, invokee: VmData) {
    let funcInfo = this.getFuncInfo(offset);

    // Check arg_count against the new method header. (Do this before
    // building the frame, so the error is raised in the caller.)
    let argerror = false;
    if(funcInfo.varargs) {
      if(argc < funcInfo.params) argerror = true;
    } else {
      if(argc < funcInfo.params || argc > funcInfo.params + funcInfo.optParams) argerror = true;
    }
    if(argerror) throw new VmRuntimeError(VmErr.WRONG_NUM_OF_ARGS);

    // Arguments should be already on the stack.
    this.stack.push(prop ?? new VmNil()); // Target property
    this.stack.push(targetObj ?? new VmNil()); // Target object
    this.stack.push(definingObj ?? new VmNil()); // Defining object
    this.stack.push(selfObject ?? new VmNil()); // Self object
    // Push invokee
    this.stack.push(invokee ?? new VmNil());
    // compute the byte offset from the current method header of the next instruction to execute, and push the result;
    // TODO
    this.stack.push(new VmCodeOffset(this.ip));
    // push the current entry pointer register; 
    this.stack.push(new VmCodeOffset(this.ep));
    // push the argument count; 
    this.stack.push(new VmInt(argc));
    // push the frame pointer; 
    this.stack.push(new VmInt(this.stack.fp));
    // and load the frame pointer with the location in the stack where we just pushed the frame pointer. 
    this.stack.fp = this.stack.sp;
    // Then, load the entry pointer register with func_offset; 
    this.ep = offset;
    // get the count of local variables from the new method header, and push nil for each local. 
    for(let i = 0; i < funcInfo.locals; i++) this.stack.push(new VmNil());
    // Finally, load the program counter with the first byte of the new function's executable code,
    // which starts immediately after the function's header.     
    this.ip = offset + 10;
  }

  ret() {
    if(this.stack.peekAbsolute(this.stack.fp - 4).value == -1) this.stop = true;
    this.stack.sp = this.stack.fp;
    let fp = this.stack.pop(); this.stack.fp = fp.value;// pop FP
    let argc = this.stack.pop(); // pop argc
    let ep = this.stack.pop(); this.ep = ep.value; // pop EP
    let ip = this.stack.pop(); this.ip = ip.value; // pop IP
    if(this.ip == -1) this.stop = true;
    // Pop args and invokee, self, defining obj, target obj, prop ID:
    for(let i = 0; i < argc.value + 5; i++) this.stack.pop();
  }

  /**
   * Find a property on value 'data'. Data should be a VmObject, VmSstring or VmList.
   * In case of a VmSstring, it is converted to a MetaString.
   * In case of a VmList, it is converted to a List.
   * In case of an IntrinsicClass, an instance of its class if created.
   * Returns property value, object (possibly ancestor) that value was found on, and 
   * target object (as created by the these rules).
   * @param data value to find prop on
   * @param vmProp prop to look for
   * @returns IPropInfo, or null if prop not found
   */
  getprop(data: VmData, vmProp: VmProp): IPropInfo {
    // "data" can be an object, a constant string or a constant list.
    if(!(data instanceof VmObject) && !(data instanceof VmSstring) && !(data instanceof VmList)) {
      if(data instanceof VmNil) throw new VmRuntimeError(VmErr.NIL_DEREF,
        Platform.get().setting('TADS3JS_TRACE') ? `nil object reference (evaluating ${this.nameOf(vmProp)})` : undefined);
      throw new VmRuntimeError(VmErr.OBJ_VAL_REQD);
    }

    // For a constant string or list, create a temporary MetaString/List with the same value.
    // For a constant string or list, use a temporary String or List object
    // (not on the heap: it's only needed for this call).
    let original = data;
    if(data instanceof VmSstring) { let v = data.value; data = Heap.unregistered(() => VmObject.direct(new MetaString(v))); }
    if(data instanceof VmList) { let v = data.value; data = Heap.unregistered(() => VmObject.direct(new List(v))); }

    // Find the requested property on data, which is now always a VmObject.
    let obj = (data as VmObject).getInstance();
    let res = obj.findProp(vmProp.value); // This will go through superclasses, as well

    // If the object was an IntrinsicClass, and the property wasn't found because
    // it's unavaible on IntrinsicClass itself, then we must be calling a method of 
    // the class it represents. Create a temporary instance and use getprop on it:
    if(!res && obj instanceof IntrinsicClass) {
      let klass = MetaclassRegistry.getClass(obj.metaclassIndex);
      data = new VmObject(new klass());
      return this.getprop(data, vmProp);
      // @todo: Delete temporary instance?
    }

    // Property not found
    if(!res) return null;

    return {
      // The object that was passed in (converted to an object if a constant
      // string or list, except for byte code, whose self is the value itself)
      targetObject: (res.prop instanceof VmCodeOffset ? original : data) as VmObject,
      definingObject: res.object,     // object that the property was found on (possibly ancestor)
      data: res.prop                  // property value that was found
    }
  }

  /**
   * Evaluate a property of 'data' (GETPROP/CALLPROP and friends), with
   * 'argc' arguments on the stack.
   * @param data Object, constant string or constant list
   * @param selfObject Self object for any code invoked, or null to use the target object
   * @param vmProp Property to evaluate
   * @param argc Argument count
   */
  callprop(data: VmData, selfObject: VmObject | VmNil, vmProp: VmProp, argc: number) {
    let propInfo: IPropInfo = this.getprop(data, vmProp);

    // If the property is undefined, invoke propNotDefined instead (with the
    // property as an extra first argument), or if that isn't defined either,
    // the result is nil.
    if(!propInfo) {
      let pndProp = Symbols.get('propNotDefined') as VmProp;
      let pndInfo = pndProp ? this.getprop(data, pndProp) : null;
      if(pndInfo) {
        this.stack.push(vmProp);
        this.invokeprop(pndInfo, selfObject, pndProp, argc + 1);
      } else {
        this.stack.popMany(argc);
        this.r0 = new VmNil();
      }
      return;
    }

    this.invokeprop(propInfo, selfObject, vmProp, argc);
  }

  /**
   * Evaluate an inherited property (INHERIT, PTRINHERIT): find the next
   * definition after the current method's defining object in the target
   * object's inheritance order, and invoke it keeping the current self
   * and target object.
   * @param vmProp Property to inherit
   * @param argc Argument count
   */
  callinherited(vmProp: VmProp, argc: number) {
    let target = this.stack.getTargetObject() as VmObject;
    // (In a method of a modified intrinsic class, the target can be a
    // constant string or list: use a temporary object for it.)
    if(target instanceof VmSstring) { let v = target.value; target = Heap.unregistered(() => VmObject.direct(new MetaString(v))); }
    else if(target instanceof VmList) { let v = target.value; target = Heap.unregistered(() => VmObject.direct(new List(v))); }
    let defining = this.stack.getDefiningObject() as VmObject;
    let res = target.getInstance().findInheritedProp(vmProp.value, defining.getInstance().id);

    // Nothing to inherit: like an undefined property, invoke propNotDefined
    // (with the property as an extra first argument), or the result is nil.
    if(!res) {
      let pndProp = Symbols.get('propNotDefined') as VmProp;
      let pndInfo = pndProp ? this.getprop(target, pndProp) : null;
      if(pndInfo) {
        this.stack.push(vmProp);
        this.invokeprop(pndInfo, this.stack.getSelf(), pndProp, argc + 1);
      } else {
        this.stack.popMany(argc);
        this.r0 = new VmNil();
      }
      return;
    }

    this.invokeprop({ targetObject: target, definingObject: res.object, data: res.prop },
      this.stack.getSelf(), vmProp, argc);
  }

  /**
   * Act on a property value that was found: store it in R0, print it, or
   * call the code it points to.
   */
  private invokeprop(propInfo: IPropInfo, selfObject: VmObject | VmNil, vmProp: VmProp, argc: number) {
    // If it's native code on an intrinsic class, call it:
    if(propInfo.data instanceof VmNativeCode) {
      let args = this.stack.popMany(argc);
      Debug.info(` ${propInfo.data.funcname}`);
      // Native code may throw a TADS exception (a VmObject); runContext
      // catches it and dispatches it to a byte-code handler.
      this.r0 = propInfo.targetObject.getInstance().callNativeMethod(propInfo.data, ...args);
      return;
    }

    // A method set from an anonymous function: call the function (it
    // keeps its own context).
    if(propInfo.data instanceof VmAnonMethod) {
      let args = this.stack.popMany(argc);
      this.r0 = propInfo.data.value.invoke(...args);
      return;
    }

    // A data value can't take arguments.
    if(argc > 0 && !(propInfo.data instanceof VmCodeOffset)) {
      throw new VmRuntimeError(VmErr.WRONG_NUM_OF_ARGS);
    }

    // If a primitive value, store it in R0:
    if(  propInfo.data instanceof VmNil 
      || propInfo.data instanceof VmTrue 
      || propInfo.data instanceof VmObject 
      || propInfo.data instanceof VmProp
      || propInfo.data instanceof VmInt
      || propInfo.data instanceof VmSstring
      || propInfo.data instanceof VmFuncPtr
      || propInfo.data instanceof VmEnum
      || propInfo.data instanceof VmList) this.r0 = propInfo.data;

    // If a double-quoted string, print it.
    else if(propInfo.data instanceof VmDstring) {
      this.output(new VmSstring(propInfo.data.value), selfObject);
    }

    // If a code offset, call function
    else if(propInfo.data instanceof VmCodeOffset) {
      this.call(propInfo.data.value, argc,
        vmProp,                   // property
        propInfo.targetObject,    // target object
        propInfo.definingObject,  // defining object
        (selfObject as VmObject) ?? propInfo.targetObject,    // self object
        propInfo.data);           // invokee
    }

    else {
      console.log(propInfo);
      throw('CALLPROP: Don\'t know what to do with this property.');
    }
  }

  // Opcode handlers, bound to this VM, indexed by opcode (built on first use).
  private dispatch: (() => void)[] = null;

  private buildDispatch() {
    this.dispatch = [];
    for(let byte = 0; byte < 256; byte++) {
      let opcode = this.OPCODES.get(byte);
      if(!opcode) this.dispatch[byte] = () => { throw(`Unknown instruction: 0x${byte.toString(16)}`); };
      else if(!opcode.func) this.dispatch[byte] = () => { throw(`Unimplemented instruction: 0x${byte.toString(16)} (${opcode.name})`); };
      else {
        let f = opcode.func.bind(this);
        this.dispatch[byte] = Debug.SHOW ? () => { Debug.opcode = byte; Debug.opname = opcode.name; f(); } : f;
      }
    }
  }

  private execute() {
    this.instructionStart = this.ip;
    let byte = this.codePool.getByte(this.ip);
    this.ip++;
    if(this.instructionLimit && ++this.instructionCount > this.instructionLimit) {
      throw(`Instruction limit of ${this.instructionLimit} exceeded`);
    }
    if(Debug.SHOW) Debug.ip = this.ip;
    this.dispatch[byte]();
  }

  //
  // Returns R0 after program ends
  //   
  /**
   * Run the program. Returns when it ends, or when it pauses for input the
   * host doesn't have yet (see InputPending): then isPaused() is true, and
   * resume() continues.
   */
  run(): VmData {
    // Find out from image where code starts:
    let codeStart = (this.blocks.find((b) => b instanceof ENTP) as ENTP).codePoolOffset;
    // Run a content with 1 argument that ends when IP = -1,
    // with a single argument for _main function.
    return this.runOutermost(() => this.runContext(codeStart, null, null, null, null, null, new VmSstring('args')));
  }

  /** Is the program paused, waiting for input? */
  isPaused(): boolean {
    return this.paused !== null;
  }

  /**
   * Continue a paused program: the native function that asked for input is
   * called again (the host should have the input now; if not, the program
   * pauses again).
   */
  resume(): VmData {
    let p = this.paused;
    if(!p) throw new Error('resume: the program is not paused');
    this.paused = null;
    return this.runOutermost(() => {
      this.ip = p.ip;
      this.ep = p.ep;
      this.instructionStart = p.instructionStart;
      this.contextDepth = 1;
      try {
        this.loop(() => { this.r0 = p.retry(); });
      } finally {
        this.stop = false;
        this.contextDepth = 0;
      }
      return this.r0;
    });
  }

  /** Where a paused program continues. */
  private paused: { ip: number, ep: number, instructionStart: number, retry: () => VmData } = null;
  /** Nesting of runContext() calls (native code running byte code). */
  private contextDepth = 0;

  /** Run the outermost context: finish when the program ends, not when it pauses. */
  private runOutermost(fn: () => VmData): VmData {
    let paused = false;
    try {
      return fn();
    } catch(e) {
      if(e instanceof InputPending) {
        paused = true;
        return this.r0;
      }
      throw e;
    } finally {
      if(!paused) this.console.finish();
    }
  }

  //
  // Returns R0 after context runs
  // 
  /**
   * Evaluate a property of an object from native code, as if by
   * target.prop(args...): runs a byte-code method, calls a native
   * method, or returns a plain property value.
   * @param target Object (or constant string/list) to evaluate the property on
   * @param vmProp Property
   * @param args Arguments
   * @returns Result, or nil if the property is undefined
   */
  public callMethod(target: VmData, vmProp: VmProp, ...args: VmData[]): VmData {
    let propInfo = this.getprop(target, vmProp);
    if(!propInfo) return new VmNil();
    if(propInfo.data instanceof VmNativeCode) {
      return propInfo.targetObject.getInstance().callNativeMethod(propInfo.data, ...args);
    }
    if(propInfo.data instanceof VmCodeOffset) {
      return this.runContext(propInfo.data.value, vmProp, propInfo.targetObject,
        propInfo.definingObject, propInfo.targetObject, propInfo.data, ...args);
    }
    return propInfo.data;
  }

  runContext(offset: number, prop: VmProp, targetObject: VmObject, definingObject: VmObject, selfObject: VmObject, invokee: VmData, ...args: VmData[]): VmData {
    if(!this.dispatch) this.buildDispatch();
    // Push all arguments on the stack (in reverse)
    args.reverse().forEach((a) => this.stack.push(a));
    // Save old IP/EP, so we can return to it when context ends:
    let oldIP = this.ip;
    let oldEP = this.ep;
    let oldInstructionStart = this.instructionStart;
    // Set IP/EP to -1 to detect end of context (will be detected by RETxxx):
    this.ip = -1;
    this.ep = -1;
    // Use call to construct a stack frame:
    this.call(offset, args.length, 
      prop,           // prop
      targetObject,   // target object
      definingObject, // defining object
      selfObject,     // self object
      invokee);       // invokee
    // Execute until end of context is detected:
    this.contextDepth++;
    try {
      this.loop();
    } finally {
      this.contextDepth--;
      this.stop = false;
      // Go back to previous context's IP/EP:
      this.ip = oldIP;
      this.ep = oldEP;
      this.instructionStart = oldInstructionStart;
    }
    return this.r0;
  }

  /**
   * Execute instructions until the current context ends (handling
   * exceptions). 'first' runs first, as if it were an instruction.
   */
  private loop(first?: () => void) {
      do {
        try {
          if(first) {
            let f = first;
            first = null;
            f();
          }
          while(!this.stop) {
            // Between instructions is a safe point for garbage collection.
            if(Gc.due()) this.collectGarbage();
            this.execute();
          }
        } catch(e) {
          // Waiting for input: pause (only possible in the outermost
          // context: a native function's JavaScript frames can't be saved).
          if(e instanceof InputPending) {
            if(this.contextDepth > 1) throw new Error('The program asked for input inside a native callback, where it cannot pause');
            if(!e.retry) throw new Error('InputPending outside a native function');
            this.paused = { ip: this.ip, ep: this.ep, instructionStart: this.instructionStart, retry: e.retry };
            throw e;
          }
          // A TADS exception thrown by native code (or by a nested context)
          // is dispatched to a byte-code handler. If no handler exists in
          // this context, imp_throw re-throws it to the enclosing context.
          // If 'stop' is set, the exception has already unwound past the
          // start of this context, so it belongs to the enclosing one.
          if(e instanceof VmObject && !this.stop) {
            this.imp_throw(e, this.instructionStart);
            continue;
          }
          // A run-time error becomes a RuntimeError exception, if the
          // program defines that class; otherwise it's fatal.
          let err = this.stop ? null : toVmError(e);
          // (Set TADS3JS_TRACE to see where run-time errors occur.)
          if(err && Platform.get().setting('TADS3JS_TRACE')) console.error(`[${err.message}]\n` + this.traceback().join('\n'));
          let exc = err ? this.createRuntimeError(err) : null;
          if(exc) this.imp_throw(exc, this.instructionStart);
          else throw(e);
        }
      } while (!this.stop);
  }

  /**
   * Create the exception object for a run-time error: an instance of the
   * program's exported RuntimeError class, constructed with the error
   * number, with exceptionMessage set to the error message.
   * @param err Run-time error
   * @returns Exception object, or null if the program has no RuntimeError
   */
  private createRuntimeError(err: VmRuntimeError): VmObject {
    let cls = Symbols.get('RuntimeError');
    if(!(cls instanceof VmObject)) return null;
    let exc = new VmObject(new TadsObject(cls, new VmInt(err.errno)));
    let msgProp = Symbols.get('exceptionMessage');
    if(msgProp instanceof VmProp) exc.setprop(msgProp.value, new VmSstring(err.message));
    return exc;
  }

  /**
   * Display a value with the default display method, if there's a self
   * object that has it, or else the default display function.
   * @param val The value (a string, or the value of an embedded expression)
   * @param self The self object (by default, the current method's)
   */
  public output(val: VmData, self?: VmData) {
    // (Like a call: the display function or method runs in this context.)
    if(self === undefined) self = this.stack.getSelf();
    if(this.outputMethod instanceof VmProp && self instanceof VmObject) {
      let info = this.getprop(self, this.outputMethod);
      if(info) {
        this.stack.push(val);
        this.invokeprop(info, self, this.outputMethod, 1);
        return;
      }
    }
    let f = this.outputFunc;
    if(f instanceof VmNil) throw new VmRuntimeError(VmErr.SAY_IS_NOT_DEFINED);
    if(f instanceof VmFuncPtr) {
      this.stack.push(val);
      this.call(f.value, 1, null, null, null, null, null);
    } else if(f instanceof VmObject && f.getInstance() instanceof AnonFunc) {
      this.stack.push(val);
      this.call((f.getInstance() as AnonFunc).codeOffset(), 1, null, null, null, null, f);
    } else {
      f.invoke(val);
    }
  }

  /** Display text through the output formatter. */
  public stdout(source: string, str: string) {
    this.console.say(str);
  }

  dump() {
    console.info('=== VM DUMP ===');
    let r0Value: any;
    if(this.r0 instanceof VmTrue) r0Value = 'VmTrue';
    else if(this.r0 instanceof VmNil) r0Value = 'VmNil';
    else r0Value = this.r0;
    console.info('IP:', this.ip, 'EP:', this.ep, 'R0:', r0Value);
    console.log('=== MATCH ===');
    console.log(this.match);
    console.log('=== STACK ===');
    this.stack.dump();
    console.info('=== END ===');

    if(this.r0 instanceof VmObject) {
      console.info("R0 object:");
      let obj = this.r0.getInstance();
      console.info(obj.constructor.name, obj.getValue());
    }
  }

  /***************************************************
   *                                                 *
   *                   INSTRUCTIONS                  *
   *                                                 *
   ***************************************************/

  /**
   * Push integer 0 onto the stack.
   * @done
   */
  op_push_0() { // 0x01 
    this.stack.push(new VmInt(0));
    if(Debug.SHOW) Debug.instruction();
  }

  /** 
   * Push integer 1 onto the stack.
   * @done
   */
  op_push_1() { // 0x02 
    this.stack.push(new VmInt(1));
    if(Debug.SHOW) Debug.instruction();
  }

  
  /**
   * Push byte-sized signed integer onto the stack
   * @done
   */
  op_pushint8() { // 0x03
    let val = this.codePool.getSbyte(this.ip);
    if(Debug.SHOW) Debug.instruction({ value: val });
    this.stack.push(new VmInt(val));
    this.ip++;
  }

  /**
   * Push signed integer value onto stack
   * @done
   */
  op_pushint() { // 0x04
    let val = this.codePool.getInt4(this.ip);
    if(Debug.SHOW) Debug.instruction({ value: val });
    this.stack.push(new VmInt(val));
    this.ip += 4;
  }

  /**
   * Push the constant string at offset in the constant pool onto the stack
   * @done
   */
  op_pushstr() { // 0x05
    let offset = this.codePool.getUint4(this.ip);  // Get string offset
    let str = this.dataPool.getString(offset);     // Get string from constant pool
    if(Debug.SHOW) Debug.instruction({ value: str });
    this.stack.push(new VmSstring(str));           // Push string on stack
    this.ip += 4;
  }

  /**
   * Push the constant list af offset in the constant pool onto the stack.
   * @done
   */
  op_pushlst() { // 0x06
    let offset = this.codePool.getUint4(this.ip);  // Get list offset
    let lst = this.dataPool.getList(offset);       // Get list from constant pool
    if(Debug.SHOW) Debug.instruction({ value: lst });
    this.stack.push(new VmList(lst));              // Push list on stack
    this.ip += 4;
  }  

  
  /**
   * Push a reference to the object with ID objID onto the stack.
   * @done
   */
  op_pushobj() { // 0x07
    let ref = this.codePool.getUint4(this.ip);
    if(Debug.SHOW) Debug.instruction({ value: ref });
    this.stack.push(new VmObject(ref));
    this.ip += 4;
  }

  /**
   * Push NIL onto the stack.
   * @done
   */
  op_pushnil() { // 0x08
    this.stack.push(new VmNil());
    if(Debug.SHOW) Debug.instruction();
  }

  /**
   * Push TRUE onto the stack.
   * @done
   */
  op_pushtrue() { // 0x09
    this.stack.push(new VmTrue());
    if(Debug.SHOW) Debug.instruction();
  }

  /**
   * Push PropID onto the stack.
   * @done
   */
  op_pushpropid() { // 0x0a
    let propID = this.codePool.getUint2(this.ip);
    if(Debug.SHOW) Debug.instruction({ propID: propID });
    this.stack.push(new VmProp(propID));
    this.ip += 2;
  }

  /**
   * Push function pointer onto the stack.
   * @done
   */
  op_pushfnptr() { // 0x0b
    let funcPtr = this.codePool.getUint4(this.ip);
    if(Debug.SHOW) Debug.instruction({ funcPtr: funcPtr });
    this.stack.push(new VmFuncPtr(funcPtr));
    this.ip += 4;
  }

  /**
   * Push Parameters as List
   * Get variable args from stack, build list, push onto stack.
   * @done
   */
  op_pushparlst() { // 0x0d 
    let fixedArgCount = this.codePool.getByte(this.ip); // Fixed arguments to skip
    if(Debug.SHOW) Debug.instruction({ argc: fixedArgCount });
    this.stack.getArgCount(); // arg count of current function
    let lst = [];
    // Get function arguments (skipping fixed arguments)
    // and place them in a list.
    for(let i = fixedArgCount; i < this.stack.getArgCount(); i++) {
      lst.push(this.stack.getArg(i));
    }
    // Push the list on the stack.
    this.stack.push(new VmList(lst));
    this.ip++;
  }

  /**
   * Push varargs onto the stack.
   * @done
   */
  op_makelistpar() { // 0x0e
    let val = this.stack.pop();
    let argc = this.stack.pop();
    if(!(argc instanceof VmInt)) throw('INT_VAL_REQD');
    let lst = val.unpack(); // yields an array for list-likes
    if(Array.isArray(lst)) {
      // Push list items onto stack (in reverse order)
      lst.slice().reverse().forEach((elem) => this.stack.push(elem));
      this.stack.push(new VmInt(argc.value + lst.length));
    } else {
      this.stack.push(val);
      this.stack.push(new VmInt(argc.value + 1));
    }
  }

  /**
   * Push enum value onto the stack.
   * @done
   */
  op_pushenum() { // 0x0f
    let val = this.codePool.getInt4(this.ip);
    if(Debug.SHOW) Debug.instruction();
    this.stack.push(new VmEnum(val));
    this.ip += 4;
  }

  /**
   * Push built-in function pointer onto the stack.
   * @done
   */
  op_pushbifptr() { // 0x10
    let funcIndex = this.codePool.getUint2(this.ip); 
    let setIndex = this.codePool.getUint2(this.ip + 2); 
    if(Debug.SHOW) Debug.instruction({ setIndex: setIndex, funcIndex: funcIndex });
    this.stack.push(new VmBifPtr(setIndex, funcIndex));
    this.ip += 4;
  }

  /**
   * Negate value on stack.
   * @done
   */
  op_neg() { // 0x20
    if(Debug.SHOW) Debug.instruction();
    let val = this.stack.pop();
    this.stack.push(val.neg());
  }

  /**
   * Compute the bitwise NOT of value on stack.
   * @done
   */
  op_bnot() { // 0x21
    if(Debug.SHOW) Debug.instruction();
    let val = this.stack.pop();
    this.stack.push(val.bnot());
  }

  /**
   * Add values on stack.
   * @done
   */  
  op_add() { // 0x22
    if(Debug.SHOW) Debug.instruction();
    let val2 = this.stack.pop();
    let val1 = this.stack.pop();
    this.stack.push(val1.add(val2));
  }

  /**
   * Subtract values on stack.
   * @done
   */  
  op_sub() { // 0x23
    if(Debug.SHOW) Debug.instruction();
    let val2 = this.stack.pop();
    let val1 = this.stack.pop();
    this.stack.push(val1.sub(val2));
  }

  /**
   * Multiply values on stack.
   * @done
   */  
  op_mul() { // 0x24
    if(Debug.SHOW) Debug.instruction();
    let val2 = this.stack.pop();
    let val1 = this.stack.pop();
    this.stack.push(val1.mul(val2));
  }

  /**
   * Computer binary AND of values on stack.
   * @done
   */  
  op_band() { // 0x25 
    if(Debug.SHOW) Debug.instruction();
    let val2 = this.stack.pop();
    let val1 = this.stack.pop();
    this.stack.push(val1.band(val2));
  }

  /**
   * Computer binary OR of values on stack.
   * @done
   */  
  op_bor() { // 0x26
    if(Debug.SHOW) Debug.instruction();
    let val2 = this.stack.pop();
    let val1 = this.stack.pop();
    this.stack.push(val1.bor(val2));
  }  

  /**
   * Perform logical shift left
   * @done
   */  
  op_shl() { // 0x27
    if(Debug.SHOW) Debug.instruction();
    let val2 = this.stack.pop();
    let val1 = this.stack.pop();
    this.stack.push(val1.shl(val2));
  }

  /**
   * Perform arithmetic shift right.
   * @done
   */  
  op_ashr() { // 0x28
    if(Debug.SHOW) Debug.instruction();
    let val2 = this.stack.pop();
    let val1 = this.stack.pop();
    this.stack.push(val1.ashr(val2));
  }

  /**
   * Compute logical XOR of values on stack.
   * @done
   */  
  op_xor() { // 0x29
    if(Debug.SHOW) Debug.instruction();
    let val2 = this.stack.pop();
    let val1 = this.stack.pop();
    this.stack.push(val1.xor(val2));
  }
  
  /**
   * Divide values on stack.
   * @done
   */  
  op_div() { // 0x2a
    if(Debug.SHOW) Debug.instruction();
    let val2 = this.stack.pop();
    let val1 = this.stack.pop();
    this.stack.push(val1.div(val2));
  }

  /**
   * Calculate modulus of values on stack.
   * @done
   */  
  op_mod() { // 0x2b
    if(Debug.SHOW) Debug.instruction();
    let val2 = this.stack.pop();
    let val1 = this.stack.pop();
    this.stack.push(val1.mod(val2));
  }

  /**
   * Logical inversion
   * @done (All possibilities covered)
   */
  op_not() { // 0x2c
    if(Debug.SHOW) Debug.instruction();
    let val = this.stack.pop();
    this.stack.push(val.not());
  }

  /**
   * Convert to boolean
   * @done (All possibilities covered)
   */
  op_boolize() { // 0x2d
    if(Debug.SHOW) Debug.instruction();
    let val = this.stack.pop();
    this.stack.push(val.boolize());
  }

  /**
   * Add 1 to value
   * @done (Depends on ADD)
   */
  op_inc() { // 0x2e 
    if(Debug.SHOW) Debug.instruction();
    let val = this.stack.pop();
    this.stack.push(val.add(new VmInt(1)));
  }

  /**
   * Subtract 1 from value
   * @done (Depends on SUB)
   */
  op_dec() { // 0x2f
    if(Debug.SHOW) Debug.instruction();
    let val = this.stack.pop();
    this.stack.push(val.sub(new VmInt(1)));
  }

  /**
   * Perform logical shift right of values on stack.
   * @done
   */  
  op_lshr() { // 0x30
    if(Debug.SHOW) Debug.instruction();
    let val2 = this.stack.pop();
    let val1 = this.stack.pop();
    this.stack.push(val1.lshr(val2));
  }    

  /**
   * Test equality
   * @todo Needs BigNumber support through "equals" method
   * @todo Which other metaclasses must implement "equals"?
   */
  op_eq() { // 0x40
    if(Debug.SHOW) Debug.instruction();
    let val2 = this.stack.pop();
    let val1 = this.stack.pop();
    this.stack.push(val1.eq(val2) ? new VmTrue() : new VmNil());
  }

  /**
   * Test if items on stack are unequal.
   * @done through EQ
   */
  op_ne() { // 0x41
    if(Debug.SHOW) Debug.instruction();
    let val2 = this.stack.pop();
    let val1 = this.stack.pop();
    this.stack.push(val1.eq(val2) ? new VmNil() : new VmTrue());
  }

  /**
   * Test if second stack element is less than top stack element.
   * @todo Which metaclasses must implement "compare" ?
   */
  op_lt() { // 0x42
    if(Debug.SHOW) Debug.instruction();
    let val2 = this.stack.pop();
    let val1 = this.stack.pop();
    this.stack.push(val1.lt(val2) ? new VmTrue() : new VmNil());
  }

  /**
   * Test if second stack element is less than/equal to top stack element.
   * @done through EQ and LT
   */
  op_le() { // 0x43
    if(Debug.SHOW) Debug.instruction();
    let val2 = this.stack.pop();
    let val1 = this.stack.pop();
    let res = val1.lt(val2) || val1.eq(val2);
    this.stack.push(res ? new VmTrue() : new VmNil());
  }

  /**
   * Test if second stack element is greater than top stack element.
   * @done through EQ and LT
   */
  op_gt() { // 0x44
    if(Debug.SHOW) Debug.instruction();
    let val2 = this.stack.pop();
    let val1 = this.stack.pop();
    let res = !val1.lt(val2) && !val1.eq(val2);
    this.stack.push(res ? new VmTrue() : new VmNil());
  }

  /**
   * Test if second stack element is greater than/equal to top stack element.
   * @done through LT
   */  
  op_ge() { // 0x45
    if(Debug.SHOW) Debug.instruction();
    let val2 = this.stack.pop();
    let val1 = this.stack.pop();
    let res = !val1.lt(val2);
    this.stack.push(res ? new VmTrue() : new VmNil());
  }  

  /**
   * Return top of stack.
   * @done
   */
  op_retval() { // 0x50
    if(Debug.SHOW) Debug.instruction();
    this.r0 = this.stack.pop();
    this.ret();
  }

  /**
   * Return NIL.
   * @done
   */
  op_retnil() { // 0x51
    if(Debug.SHOW) Debug.instruction();
    this.r0 = new VmNil();
    this.ret();
  }

  /**
   * Return TRUE.
   * @done
   */
  op_rettrue() { // 0x52
    if(Debug.SHOW) Debug.instruction();
    this.r0 = new VmTrue();
    this.ret();    
  }

  /**
   * Return.
   * @done
   */
  op_ret() { // 0x54
    if(Debug.SHOW) Debug.instruction();
    this.ret();
  }

  op_namedargptr() { // 0x56
    let argc = this.codePool.getByte(this.ip);
    if(Debug.SHOW) Debug.instruction( { argc: argc } );
    this.stack.popMany(argc);
    // skip table_offset (of 2 bytes)
    this.ip += 3;
  }

  op_namedargtab() { // 0x57 
    // Bytes to skip (not including table_bytes element itself)
    let table_bytes = this.codePool.getUint2(this.ip);
    let argc = this.codePool.getUint2(this.ip + 2);
    if(Debug.SHOW) Debug.instruction( { argc: argc } );
    this.stack.popMany(argc);
    this.ip += table_bytes + 2;
  }

  op_call() { // 0x58
    let argc = this.maybe_varargc(this.codePool.getByte(this.ip));
    let func_offset = this.codePool.getUint4(this.ip + 1);
    if(Debug.SHOW) Debug.instruction({ 'argc': argc, 'func_offset': func_offset });
    this.ip += 5;
    // This calls a stand-alone function. It has no property target,
    // no target object, no defining object, no self object (and no invokee).
    this.call(func_offset, argc, null, null, null, null, null);
  }

  op_ptrcall() { // 0x59
    let argc = this.maybe_varargc(this.codePool.getByte(this.ip));
    if(Debug.SHOW) Debug.instruction({ argc: argc });
    this.ip++;
    let val = this.stack.pop();
    // Ordinary function pointer:
    if(val instanceof VmFuncPtr) {
      this.call(val.value, argc, null, null, null, null, null);
    } 
    // Builtin function pointer
    else if(val instanceof VmBifPtr) { // This isn't in the docs, but I think it should be supported.
      this.r0 = Builtin.call(val.getSetIndex(), val.getFunctionIndex(), argc);
    } 
    // Prop ID
    else if(val instanceof VmProp) {
      throw('TODO: PTRCALL NOT IMPLEMENTED FOR PROPID');
    } 
    // Anonymous function object
    else if(val instanceof VmObject && val.getInstance() instanceof AnonFunc) {
      // Called in this context, like an ordinary function (the arguments are
      // on the stack), with the function object as the invokee.
      this.call((val.getInstance() as AnonFunc).codeOffset(), argc, null, null, null, null, val);
    } 
    // Object
    else if(val instanceof VmObject) {
      throw('PTRCALL NOT IMPLEMENTED FOR OBJECT');
    } 
    // Otherwise unsupported:
    else {
      throw('PTRCALL: FUNCPTR_VAL_REQD');
    }
  }

  op_getprop() { // 0x60
    let propID = this.codePool.getUint2(this.ip);
    if(Debug.SHOW) Debug.instruction({ propID: propID});
    this.ip += 2;
    let data  = this.stack.pop();
    this.callprop(data, null, new VmProp(propID), 0);
  }

  /**
   * GETPROPDATA: like GETPROP, but without side effects: evaluating code or
   * a double-quoted string, or a property of a non-object, is an error.
   */
  op_getpropdata() { // 0x68
    let propID = this.codePool.getUint2(this.ip);
    this.ip += 2;
    this.getpropdata(this.stack.pop(), new VmProp(propID));
  }

  op_ptrgetpropdata() { // 0x69
    let vmProp = this.stack.pop();
    let data = this.stack.pop();
    if(!(vmProp instanceof VmProp)) throw new VmRuntimeError(VmErr.PROPPTR_VAL_REQD);
    this.getpropdata(data, vmProp);
  }

  private getpropdata(data: VmData, vmProp: VmProp) {
    if(!(data instanceof VmObject)) throw new VmRuntimeError(VmErr.BAD_SPEC_EVAL);
    let info = this.getprop(data, vmProp);
    if(info && (info.data instanceof VmCodeOffset || info.data instanceof VmDstring || info.data instanceof VmNativeCode))
      throw new VmRuntimeError(VmErr.BAD_SPEC_EVAL);
    this.callprop(data, null, vmProp, 0);
  }

  /**
   * DELEGATE: call a property of another object, keeping the current self
   * (the target object is the other object).
   */
  op_delegate() { // 0x77
    let argc = this.maybe_varargc(this.codePool.getByte(this.ip));
    let propID = this.codePool.getUint2(this.ip + 1);
    this.ip += 3;
    let data = this.stack.pop();
    this.callprop(data, this.stack.getSelf(), new VmProp(propID), argc);
  }

  op_ptrdelegate() { // 0x78
    let argc = this.maybe_varargc(this.codePool.getByte(this.ip));
    this.ip++;
    let vmProp = this.stack.pop();
    let data = this.stack.pop();
    if(!(vmProp instanceof VmProp)) throw new VmRuntimeError(VmErr.PROPPTR_VAL_REQD);
    this.callprop(data, this.stack.getSelf(), vmProp, argc);
  }

  op_callprop() { // 0x61
    let argc = this.maybe_varargc(this.codePool.getByte(this.ip));
    let propID = this.codePool.getUint2(this.ip + 1);
    let data  = this.stack.pop();
    if(Debug.SHOW) Debug.instruction({'obj': data, 'propID': propID, 'argc': argc});
    this.ip += 3;
    this.callprop(data, null, new VmProp(propID), argc);
  }

  op_ptrcallprop() { // 0x62
    let argc = this.maybe_varargc(this.codePool.getByte(this.ip));
    let vmProp = this.stack.pop();
    let data  = this.stack.pop();
    if(Debug.SHOW) Debug.instruction({'obj': data, 'propID': vmProp, 'argc': argc});
    this.ip++;
    this.callprop(data, null, vmProp, argc);
  }

  op_getpropself() { // 0x63
    let propID = this.codePool.getUint2(this.ip);
    if(Debug.SHOW) Debug.instruction({ propID: propID });
    this.ip += 2;
    this.callprop(this.stack.getSelf(), null, new VmProp(propID), 0);
  }

  op_callpropself() { // 0x64 
    let argc = this.maybe_varargc(this.codePool.getByte(this.ip));
    let propID = this.codePool.getUint2(this.ip + 1);
    if(Debug.SHOW) Debug.instruction({ propID: propID, argc: argc });
    this.ip += 3;
    this.callprop(this.stack.getSelf(), null, new VmProp(propID), argc);
  }

  op_ptrcallpropself() { // 0x65
    let argc = this.maybe_varargc(this.codePool.getByte(this.ip));
    let vmProp = this.stack.pop();
    let data = this.stack.getSelf();
    if(Debug.SHOW) Debug.instruction({'obj': data, 'propID': vmProp, 'argc': argc});
    this.ip++;
    this.callprop(data, null, vmProp, argc);
  }

  op_objgetprop() { // 0x66
    let objID = this.codePool.getUint4(this.ip);
    let propID = this.codePool.getUint2(this.ip + 4);
    if(Debug.SHOW) Debug.instruction({ objID: objID, propID: propID});
    this.ip += 6;
    this.callprop(new VmObject(objID), null, new VmProp(propID), 0);
  }

  op_objcallprop() { // 0x67 
    let argc = this.maybe_varargc(this.codePool.getByte(this.ip));
    let objID = this.codePool.getUint4(this.ip + 1);
    let propID = this.codePool.getUint2(this.ip + 5);
    if(Debug.SHOW) Debug.instruction({ objID: objID, propID: propID, argc: argc});
    this.ip += 7;
    this.callprop(new VmObject(objID), null, new VmProp(propID), argc);
  }

  op_getproplcl1() { // 0x6a 
    let localNum = this.codePool.getByte(this.ip);
    let propID = this.codePool.getUint2(this.ip + 1);
    if(Debug.SHOW) Debug.instruction({'local': localNum, 'propID': propID});
    this.ip += 3;
    this.callprop(this.stack.getLocal(localNum), null, new VmProp(propID), 0);
  }

  op_callproplcl1() { // 0x6b
    let argc = this.codePool.getByte(this.ip);
    let localNum = this.codePool.getByte(this.ip + 1);
    let propID = this.codePool.getUint2(this.ip + 2);
    if(Debug.SHOW) Debug.instruction({'local': localNum, 'propID': propID, 'argc': argc});
    this.ip += 4;
    this.callprop(this.stack.getLocal(localNum), null, new VmProp(propID), argc);
  }

  op_getpropr0() { // 0x6c 
    let propID = this.codePool.getUint2(this.ip);
    if(Debug.SHOW) Debug.instruction({'propID': propID});
    this.ip += 2;
    this.callprop(this.r0, null, new VmProp(propID), 0);
  }

  op_callpropr0() { // 0x6d
    let argc = this.codePool.getByte(this.ip);
    let propID = this.codePool.getUint2(this.ip + 1);
    if(Debug.SHOW) Debug.instruction({'propID': propID, 'argc': argc});
    this.ip += 3;
    this.callprop(this.r0, null, new VmProp(propID), argc);
  }

  op_inherit() { // 0x72
    let argc = this.maybe_varargc(this.codePool.getByte(this.ip));
    let propID = this.codePool.getUint2(this.ip + 1);
    if(Debug.SHOW) Debug.instruction({'propID': propID, 'argc': argc});
    this.ip += 3;
    this.callinherited(new VmProp(propID), argc);
  }

  op_ptrinherit() { // 0x73
    let argc = this.maybe_varargc(this.codePool.getByte(this.ip));
    let vmProp = this.stack.pop();
    if(Debug.SHOW) Debug.instruction({'prop': vmProp, argc: argc});
    this.ip++;
    if(!(vmProp instanceof VmProp)) throw('PROPPTR_VAL_REQD');
    this.callinherited(vmProp, argc);
  }

  op_expinherit() { // 0x74
    let argc = this.maybe_varargc(this.codePool.getByte(this.ip));
    let propID = this.codePool.getUint2(this.ip + 1);
    let objID = this.codePool.getUint4(this.ip + 3);
    if(Debug.SHOW) Debug.instruction({ argc: argc, propID: propID, objID: objID });
    this.ip += 7;
    this.callprop(new VmObject(Heap.getObj(objID)), this.stack.getSelf(), new VmProp(propID), argc); 
  }

  op_ptrexpinherit() { // 0x75
    let argc = this.maybe_varargc(this.codePool.getByte(this.ip));
    let objID = this.codePool.getUint4(this.ip + 1);
    let vmProp = this.stack.pop();
    if(Debug.SHOW) Debug.instruction({ argc: argc, prop: vmProp, objID: objID });
    this.ip += 5;
    this.callprop(new VmObject(Heap.getObj(objID)), this.stack.getSelf(), vmProp, argc); 
  }

  op_varargc() { // 0x76
    let val = this.stack.pop();
    if(Debug.SHOW) Debug.instruction({ argc: val });
    if(!(val instanceof VmInt)) throw('NUM_VAL_REQD');
    this.varargc = val.unpack();
  }

  op_getargn0() { if(Debug.SHOW) Debug.instruction(); this.stack.push(this.stack.getArg(0)); } // 0x7c
  op_getargn1() { if(Debug.SHOW) Debug.instruction(); this.stack.push(this.stack.getArg(1)); } // 0x7d
  op_getargn2() { if(Debug.SHOW) Debug.instruction(); this.stack.push(this.stack.getArg(2)); } // 0x7e
  op_getargn3() { if(Debug.SHOW) Debug.instruction(); this.stack.push(this.stack.getArg(3)); } // 0x7f

  /**
   * Swap the top pair of elements with the next pair of elements on the stack. 
   * @done
   */
  op_swap2() { // 0x7a
    if(Debug.SHOW) Debug.instruction();
    let [ val1, val2, val3, val4 ] = this.stack.popMany(4);
    this.stack.pushMany(val2, val1, val4, val3);
  }

  /**
   * Swap stack elements at indices
   * @done
   */
  op_swapn() { // 0x7b (error in docs, they say this is 0x7a)
    let idx1 = this.codePool.getByte(this.ip);     // offset from top of stack, 0-based
    let idx2 = this.codePool.getByte(this.ip + 1); // offset from top of stack, 0-based
    if(Debug.SHOW) Debug.instruction({ idx1: idx1, idx2: idx2 });
    this.ip += 2;
    let val1 = this.stack.peek(idx1);
    let val2 = this.stack.peek(idx2);
    this.stack.poke(idx1, val2);
    this.stack.poke(idx2, val1);
  }

  /**
   * Get local variable
   * @done
   */
  op_getlcl1() { // 0x80
    let index = this.codePool.getByte(this.ip);
    if(Debug.SHOW) Debug.instruction({ index: index });
    this.stack.push(this.stack.getLocal(index));
    this.ip++;
  }

  /**
   * Get local variable
   * @done
   */  
  op_getlcl2() { // 0x81
    let index = this.codePool.getUint2(this.ip);
    if(Debug.SHOW) Debug.instruction({ index: index });
    this.stack.push(this.stack.getLocal(index));
    this.ip += 2;
  }

  /**
   * Get current function argument
   * @done
   */  
  op_getarg1() { // 0x82 
    let index = this.codePool.getByte(this.ip);
    if(Debug.SHOW) Debug.instruction({ index: index });
    this.stack.push(this.stack.getArg(index));
    this.ip++;
  }

  /**
   * Get current function argument
   * @done
   */  
  op_getarg2() { // 0x83 
    let index = this.codePool.getUint2(this.ip);
    if(Debug.SHOW) Debug.instruction({ index: index });
    this.stack.push(this.stack.getArg(index));
    this.ip += 2;
  }
  
  /**
   * Push self object on stack
   * @done
   */  
  op_pushself() { // 0x84
    if(Debug.SHOW) Debug.instruction();
    this.stack.push(this.stack.getSelf());
  }

  /**
   * Get current function's actual parameter count.
   * @done
   */
  op_getargc() { // 0x87 
    if(Debug.SHOW) Debug.instruction();
    let argcount = this.stack.getArgCount();
    this.stack.push(new VmInt(argcount));
  }

  /**
   * Re-push item at top of stack
   * @done
   */
  op_dup() { // 0x88
    if(Debug.SHOW) Debug.instruction();
    this.stack.push(this.stack.peek());
  }

  /**
   * Discard value at top of stack.
   * @done
   */
  op_disc() { // 0x89
    if(Debug.SHOW) Debug.instruction();
    this.stack.pop();
  }

  /**
   * Discard values at top of stack.
   * @done
   */
  op_disc1() { // 0x8a
    let count = this.codePool.getByte(this.ip);
    if(Debug.SHOW) Debug.instruction({ count: count });
    this.ip++;
    this.stack.popMany(count);
  }

  /**
   * Push R0 on stack.
   * @done
   */
  op_getr0() { // 0x8b
    if(Debug.SHOW) Debug.instruction();
    this.stack.push(this.r0);
  }

  /** 
   * Swap elements at top of stack. 
   * @done
   */
  op_swap() { // 0x8d 
    if(Debug.SHOW) Debug.instruction();
    let val1 = this.stack.pop();
    let val2 = this.stack.pop();
    this.stack.push(val1);
    this.stack.push(val2);
  }

  op_pushctxele() { // 0x8e 
    let element = this.codePool.getByte(this.ip);
    if(Debug.SHOW) Debug.instruction({'element': element});
    this.ip++;
    switch(element) {
      case 1: this.stack.push(this.stack.getTargetProperty()); break;
      case 2: this.stack.push(this.stack.getTargetObject());   break;
      case 3: this.stack.push(this.stack.getDefiningObject()); break;
      case 4: this.stack.push(this.stack.getInvokee()); break;
      default:
        throw(`PUSHCTXELE: Unsupported element ${element}`);
    }
  }

  /** 
   * Duplicate the top two elements: first push the
   * second-from-top, then push the old top (which will now
   * be the second-from-top, thanks to our first push) 
   * @done
   */  
  op_dup2() { // 0x8f
    if(Debug.SHOW) Debug.instruction();
    let val1 = this.stack.peek(); // top of stack
    let val2 = this.stack.peek(1);
    this.stack.push(val2);
    this.stack.push(val1);
  }

  /**
   * Switch between cases.
   * @done
   */
  op_switch() { // 0x90
    let val = this.stack.pop();
    let case_count = this.codePool.getUint2(this.ip);
    if(Debug.SHOW) Debug.instruction();
    this.ip += 2;

    // Read cases:
    let cases = [];
    for(let i = 0; i < case_count; i++) {
      let type = this.codePool.getByte(this.ip++);
      let offset = this.codePool.getUint4(this.ip); this.ip += 4;
      let value = DataFactory.load(type, this.dataPool, offset);
      let branch_offset = this.codePool.getInt2(this.ip) + this.ip; this.ip += 2;
      cases.push({ value: value, branch_offset: branch_offset });
    }
    let default_branch_offset = this.codePool.getInt2(this.ip) + this.ip;

    // Evaluate cases:
    for(let i = 0; i < case_count; i++) {
      let c = cases[i];
      if(c.value.eq(val)) { 
        this.ip = c.branch_offset;
        return;
      }
    }

    // No match; jump to default.
    this.ip = default_branch_offset;
  }

  /** 
   * Unconditional jump
   * @done
   */
  op_jmp() { // 0x91
    let branch_offset = this.codePool.getInt2(this.ip);
    if(Debug.SHOW) Debug.instruction({ offset: branch_offset});
    this.ip += branch_offset;
  }

  /** 
   * Jump if true
   * @done
   */
  op_jt() { // 0x92
    let branch_offset = this.codePool.getInt2(this.ip);
    if(Debug.SHOW) Debug.instruction({ offset: branch_offset});
    let val = this.stack.pop();
    if(val instanceof VmNil || (val instanceof VmInt && val.value == 0)) {
      this.ip += 2;
    } else {
      this.ip += branch_offset;
    }
  }

  /** 
   * Jump if false
   * @done
   */
  op_jf() { // 0x93
    let branch_offset = this.codePool.getInt2(this.ip);
    if(Debug.SHOW) Debug.instruction({ offset: branch_offset});
    let val = this.stack.pop();    
    if(val instanceof VmNil || (val instanceof VmInt && val.value == 0)) {
      this.ip += branch_offset;
    } else {
      this.ip += 2;
    }
  }  

  /** 
   * Jump if equal
   * @done
   */
  op_je() { // 0x94
    let branch_offset = this.codePool.getInt2(this.ip);
    if(Debug.SHOW) Debug.instruction({ offset: branch_offset});
    let val2 = this.stack.pop();
    let val1 = this.stack.pop();
    if(val1.eq(val2)) {
      this.ip += branch_offset;
    } else {
      this.ip += 2;
    }
  }

  /** 
   * Jump if unequal
   * @done
   */
  op_jne() { // 0x95
    let branch_offset = this.codePool.getInt2(this.ip);
    if(Debug.SHOW) Debug.instruction({ offset: branch_offset});
    let val2 = this.stack.pop();
    let val1 = this.stack.pop();
    if(val1.eq(val2)) {
      this.ip += 2;
    } else {
      this.ip += branch_offset;
    }
  }

  /** 
   * Jump if greater than
   * @done
   */
  op_jgt() { // 0x96
    let branch_offset = this.codePool.getInt2(this.ip);
    if(Debug.SHOW) Debug.instruction({ offset: branch_offset});
    let val2 = this.stack.pop();
    let val1 = this.stack.pop();
    if(val1.lt(val2) || val1.eq(val2)) {
      this.ip += 2;
    } else {
      this.ip += branch_offset;
    }
  }

  /** 
   * Jump if greater than or equal
   * @done
   */
  op_jge() { // 0x97
    let branch_offset = this.codePool.getInt2(this.ip);
    if(Debug.SHOW) Debug.instruction({ offset: branch_offset});
    let val2 = this.stack.pop();
    let val1 = this.stack.pop();
    if(val1.lt(val2)) {
      this.ip += 2;
    } else {
      this.ip += branch_offset;
    }
  }

  /**
   * Jump if less than
   * @done
   */
  op_jlt() { // 0x98
    let branch_offset = this.codePool.getInt2(this.ip);
    if(Debug.SHOW) Debug.instruction({ offset: branch_offset});
    let val2 = this.stack.pop();
    let val1 = this.stack.pop();
    if(val1.lt(val2)) {
      this.ip += branch_offset;
    } else {
      this.ip += 2;
    }
  }  

  /** 
   * Jump if less than or equal
   * @done
   */
  op_jle() { // 0x99
    let branch_offset = this.codePool.getInt2(this.ip);
    if(Debug.SHOW) Debug.instruction({ offset: branch_offset});
    let val2 = this.stack.pop();
    let val1 = this.stack.pop();
    if(val1.lt(val2) || val1.eq(val2)) {
      this.ip += branch_offset;
    } else {
      this.ip += 2;
    }
  }    

  /** 
   * Jump and save if true
   * @done
   */
  op_jst() { // 0x9a 
    let branch_offset = this.codePool.getInt2(this.ip);
    if(Debug.SHOW) Debug.instruction({ offset: branch_offset});
    let val = this.stack.peek();
    // Must be true, enum or non-zero number to jump:
    if(val instanceof VmTrue || val instanceof VmEnum || (val instanceof VmInt && val.value != 0)) {
      this.ip += branch_offset;
    } else {
      // Value must still be a valid logical value:
      if(val instanceof VmNil || val instanceof VmInt) {
        this.stack.pop();
        this.ip += 2;
      } else throw('LOG_VAL_REQD');
    }
  }

  /** 
   * Jump and save if false 
   * @done
   */
  op_jsf() { // 0x9b
    let branch_offset = this.codePool.getInt2(this.ip);
    if(Debug.SHOW) Debug.instruction({ offset: branch_offset});
    let val = this.stack.peek();
    if(val instanceof VmNil || (val instanceof VmInt && val.value == 0)) {
      this.ip += branch_offset;
    } else {
      this.stack.pop();
      this.ip += 2;
    }
  }


  /**
   * Local Jump to Subroutine
   * @done
   */
  op_ljsr() { // 0x9c
    let branch_offset = this.codePool.getInt2(this.ip);
    if(Debug.SHOW) Debug.instruction({ offset: branch_offset});
    this.stack.push(new VmCodeOffset(this.ip + 2));
    this.ip += branch_offset;
  }

  /**
   * Local Return
   * @done
   */
  op_lret() { // 0x9d
    let localNum = this.codePool.getUint2(this.ip);
    if(Debug.SHOW) Debug.instruction({ local: localNum });
    this.ip = this.stack.getLocal(localNum).value; // Stored on stack as VM_CODEOFFSET
  }

  /**
   * Jump if NIL
   * @done
   */
  op_jnil() { // 0x9e
    let branch_offset = this.codePool.getInt2(this.ip);
    if(Debug.SHOW) Debug.instruction({ offset: branch_offset});
    let val = this.stack.pop();
    if(val instanceof VmNil) {
      this.ip += branch_offset;
    } else {
      this.ip += 2;
    }
  }

  /**
   * Jump if not NIL (and only NIL)
   * @done
   */
  op_jnotnil() { // 0x9f
    let branch_offset = this.codePool.getInt2(this.ip);
    if(Debug.SHOW) Debug.instruction({ offset: branch_offset});
    let val = this.stack.pop();
    if(val instanceof VmNil) {
      this.ip += 2;
    } else {
      this.ip += branch_offset;
    }
  }

  /**
   * Jump if R0 is anything other than nil or the integer value 0.
   * @done
   */
  op_jr0t() { // 0xa0
    let branch_offset = this.codePool.getInt2(this.ip);
    if(Debug.SHOW) Debug.instruction({ offset: branch_offset});
    if(this.r0 instanceof VmNil || (this.r0 instanceof VmInt && this.r0.value == 0)) {
      this.ip += 2;
    } else {
      this.ip += branch_offset;
    }
  }

  /**
   * Jump if R0 is nil or the integer value 0.
   * @done
   */
  op_jr0f() { // 0xa1
    let branch_offset = this.codePool.getInt2(this.ip);
    if(Debug.SHOW) Debug.instruction({ offset: branch_offset});
    if(this.r0 instanceof VmNil || (this.r0 instanceof VmInt && this.r0.value == 0)) {
      this.ip += branch_offset;
    } else {
      this.ip += 2;
    }
  }  

  op_iternext() { // 0xa2 
    let localNum = this.codePool.getUint2(this.ip);
    let branch_offset = this.codePool.getInt2(this.ip + 2);
    if(Debug.SHOW) Debug.instruction({ local: localNum, offset: branch_offset });
    let iter = (this.stack.getLocal(localNum) as VmObject).getInstance() as Iterator;
    let val = iter.iter_next();
    if(val) {
      this.stack.push(val);
      this.ip += 4;
    }
    else {
      this.ip += branch_offset + 2;
    }
  }

  /**
   * Set local from R0 and leave value on stack
   * @done
   */
  op_getsetlcl1r0() { // 0xa3
    let index = this.codePool.getByte(this.ip);
    if(Debug.SHOW) Debug.instruction({ index: index });
    this.stack.push(this.r0);
    this.stack.setLocal(index, this.r0);
    this.ip++;
  }

  /**
   * Set local and leave value on stack
   * @done
   */
  op_getsetlcl1() { // 0xa4
    let index = this.codePool.getByte(this.ip);
    if(Debug.SHOW) Debug.instruction({ index: index });
    this.stack.setLocal(index, this.stack.peek());
    this.ip++;
  }

  /**
   * Push the value of R0 onto the stack twice.
   * @done
   */
  op_dupr0() { // 0xa5
    if(Debug.SHOW) Debug.instruction();
    this.stack.push(this.r0);
    this.stack.push(this.r0);
  }

  /**
   * Copy stack element at index onto top of stack.
   * @done
   */
  op_getspn() { // 0xa6
    let index = this.codePool.getByte(this.ip);
    if(Debug.SHOW) Debug.instruction({ index: index });
    this.stack.push(this.stack.peek(index));
    this.ip++;
  }

  /**
   * Push local at index 0 onto stack.
   * @done
   */
  op_getlcln0() { // 0xaa
    if(Debug.SHOW) Debug.instruction();
    this.stack.push(this.stack.getLocal(0));
  }

  /**
   * Push local at index 1 onto stack.
   * @done
   */  
  op_getlcln1() { // 0xab
    if(Debug.SHOW) Debug.instruction();
    this.stack.push(this.stack.getLocal(1));
  }

  /**
   * Push local at index 2 onto stack.
   * @done
   */  
  op_getlcln2() { // 0xac
    if(Debug.SHOW) Debug.instruction();
    this.stack.push(this.stack.getLocal(2));
  }

  /**
   * Push local at index 3 onto stack.
   * @done
   */  
  op_getlcln3() { // 0xad
    if(Debug.SHOW) Debug.instruction();
    this.stack.push(this.stack.getLocal(3));
  }

  /**
   * Push local at index 4 onto stack.
   * @done
   */  
  op_getlcln4() { // 0xae
    if(Debug.SHOW) Debug.instruction();
    this.stack.push(this.stack.getLocal(4));
  }

  /**
   * Push local at index 5 onto stack.
   * @done
   */  
  op_getlcln5() { // 0xaf
    if(Debug.SHOW) Debug.instruction();
    this.stack.push(this.stack.getLocal(5));
  }




  op_say() { // 0xb0
    if(Debug.SHOW) Debug.instruction();
    let arg = this.codePool.getUint4(this.ip);
    let str = this.dataPool.getString(arg);
    // (Move past the operand first: the display function returns here.)
    this.ip += 4;
    this.output(new VmSstring(str));
  }

  op_builtin_a() { // 0xb1
    let argc = this.maybe_varargc(this.codePool.getByte(this.ip));
    let func_index = this.codePool.getByte(this.ip + 1);
    if(Debug.SHOW) Debug.instruction({ argc: argc, func_index: func_index});
    this.ip += 2;
    this.imp_builtin(argc, func_index, 0);
  }

  op_builtin_b() { // 0xb2
    let argc = this.maybe_varargc(this.codePool.getByte(this.ip));
    let func_index = this.codePool.getByte(this.ip + 1);
    if(Debug.SHOW) Debug.instruction({ argc: argc, func_index: func_index});
    this.ip += 2;
    this.imp_builtin(argc, func_index, 1);
  }

  op_builtin_c() { // 0xb3
    let argc = this.maybe_varargc(this.codePool.getByte(this.ip));
    let func_index = this.codePool.getByte(this.ip + 1);
    if(Debug.SHOW) Debug.instruction( { argc: argc, func_index: func_index});
    this.ip += 2;
    this.imp_builtin(argc, func_index, 2);
  }

  op_builtin_d() { // 0xb4
    let argc = this.maybe_varargc(this.codePool.getByte(this.ip));
    let func_index = this.codePool.getByte(this.ip + 1);
    if(Debug.SHOW) Debug.instruction({ argc: argc, func_index: func_index});
    this.ip += 2;
    this.imp_builtin(argc, func_index, 3);
  }

  op_builtin1() { // 0xb5
    let argc = this.maybe_varargc(this.codePool.getByte(this.ip));
    let func_index = this.codePool.getByte(this.ip + 1);
    let set_index = this.codePool.getByte(this.ip + 2);
    if(Debug.SHOW) Debug.instruction({argc: argc, func_index: func_index, set_index: set_index});
    this.ip += 3;
    this.imp_builtin(argc, func_index, set_index);
  }

  op_builtin2() { // 0xb6
    let argc = this.maybe_varargc(this.codePool.getByte(this.ip));
    let func_index = this.codePool.getUint2(this.ip + 1);
    let set_index = this.codePool.getByte(this.ip + 3);
    if(Debug.SHOW) Debug.instruction({argc: argc, func_index: func_index, set_index: set_index});
    this.ip += 4;
    this.imp_builtin(argc, func_index, set_index);
  }

  imp_builtin(argc: number, func_index: number, set_index: number) {
    this.r0 = Builtin.call(set_index, func_index, argc);
  }

  public throw(vmObject: VmObject) {
    this.imp_throw(vmObject, this.instructionStart);
  }

  op_throw() { // 0xb8
    if(Debug.SHOW) Debug.instruction();
    let exception_obj = this.stack.pop();
    this.imp_throw(exception_obj, this.instructionStart);
  }

  /**
   * Find a handler for an exception and transfer control to it.
   * Searches the current frame's exception table for a handler whose
   * (inclusive) protected range covers the throwing instruction and whose
   * class matches; if none is found, unwinds to the caller and repeats.
   * If unwinding reaches the boundary of the current runContext (i.e. the
   * byte code was called from native code), the exception is re-thrown as
   * a JS exception so that the enclosing context can continue the search.
   * @param exception_obj Exception object
   * @param instructionAddr Code pool address of the throwing instruction
   */
  imp_throw(exception_obj: VmData, instructionAddr: number) {
    if(!(exception_obj instanceof VmObject)) throw('OBJ_VAL_REQD');
    let exc = exception_obj.getInstance();

    // Offset of the throwing instruction from the start of the method.
    let offset = instructionAddr - this.ep;

    while(true) {
      let funcinfo = this.getFuncInfo(this.ep);
      if(funcinfo.exceptionTableoffset != 0) {
        let exception_count = this.codePool.getUint2(funcinfo.exceptionTableoffset);
        let entry = funcinfo.exceptionTableoffset + 2;
        for(let i = 0; i < exception_count; i++, entry += 10) {
          let startPos = this.codePool.getUint2(entry);     // first byte of protected code
          let endPos = this.codePool.getUint2(entry + 2);   // last byte of protected code (inclusive)
          let classID = this.codePool.getUint4(entry + 4);  // exception class; 0 = any ('finally')
          let handlerPos = this.codePool.getUint2(entry + 8);
          if(offset < startPos || offset > endPos) continue;
          if(classID == 0 || exc.id == classID || exc.derivesFromSuperclass(classID)) {
            this.stack.push(exception_obj);
            this.ip = this.ep + handlerPos;
            return;
          }
        }
      }

      // No handler in this frame: unwind to the caller.
      this.ret();
      // Reached the start of this runContext: hand the exception to
      // the enclosing context (or to the host, at the outermost level).
      if(this.stop) throw(exception_obj);
      // In the caller, the "throwing" instruction is the call instruction
      // that just returned. The return address is the byte after it, so
      // the call's last byte lies in the same protected range as the call.
      offset = this.ip - 1 - this.ep;
    }
  }

  op_sayval() { // 0xb9 
    let val = this.stack.pop();
    this.output(val);
  }

  op_index() { // 0xba
    let indexVal = this.stack.pop();
    let val = this.stack.pop();
    if(Debug.SHOW) Debug.instruction({'idx': indexVal});
    this.stack.push(val.getind(indexVal));
  }

  op_idxlcl1int8() { // 0xbb
    let localNum = this.codePool.getByte(this.ip);
    let indexVal = this.codePool.getByte(this.ip + 1);
    if(Debug.SHOW) Debug.instruction({'local': localNum, 'idx': indexVal });
    this.ip += 2;
    let val = this.stack.getLocal(localNum);
    this.stack.push(val.getind(new VmInt(indexVal)));
  }

  op_idxint8() { // 0cbc
    let indexVal = new VmInt(this.codePool.getByte(this.ip));
    let val = this.stack.pop();
    if(Debug.SHOW) Debug.instruction({'idx': indexVal.value });
    this.ip++;
    this.stack.push(val.getind(indexVal));
  }

  op_new1() { // 0xc0
    let argc = this.maybe_varargc(this.codePool.getByte(this.ip));
    let metaclass_id = this.codePool.getByte(this.ip + 1);
    this.imp_new(metaclass_id, argc, false);
    this.ip += 2;
  }

  op_new2() { // 0xc1
    let argc = this.maybe_varargc(this.codePool.getUint2(this.ip));
    let metaclass_id = this.codePool.getUint2(this.ip + 2);
    this.imp_new(metaclass_id, argc, false);
    this.ip += 4;
  }

  op_trnew1() { // 0xc2
    let argc = this.maybe_varargc(this.codePool.getByte(this.ip));
    let metaclass_id = this.codePool.getByte(this.ip + 1);
    this.imp_new(metaclass_id, argc, true);
    this.ip += 2;
  }

  op_trnew2() { // 0xc3
    let argc = this.maybe_varargc(this.codePool.getUint2(this.ip));
    let metaclass_id = this.codePool.getUint2(this.ip + 2);
    this.imp_new(metaclass_id, argc, true);
    this.ip += 4;
  }  

  imp_new(metaclass_id: number, argc: number, transient: boolean) {
    // Get metaclass definition block and get the requested 
    // metaclass's name from its index.
    let args = this.stack.popMany(argc);
    let name = MetaclassRegistry.indexToName(metaclass_id);
    if(Debug.SHOW) Debug.instruction({'metaclassID': metaclass_id, 'argc': argc, 'class': name, 'args': args });
    let instance = MetaclassFactory.create(metaclass_id, ...args);
    instance.setTransient(transient);
    this.r0 = new VmObject(instance.id);
  }

  /**
   * Adds the integer 1 to the local variable at index local_number.
   * @done
   */
  op_inclcl() { // 0xd0 
    let localNum = this.codePool.getUint2(this.ip);
    if(Debug.SHOW) Debug.instruction({ local: localNum });
    // (VmInt values may be shared, so never modify one in place.)
    this.stack.setLocal(localNum, this.stack.getLocal(localNum).add(new VmInt(1)));
    this.ip += 2;
  }

  /**
   * Subtracts the integer 1 from the local variable at index local_number.
   * @done
   */
  op_declcl() { // 0xd1
    let localNum = this.codePool.getUint2(this.ip);
    if(Debug.SHOW) Debug.instruction({ local: localNum });
    this.stack.setLocal(localNum, this.stack.getLocal(localNum).sub(new VmInt(1)));
    this.ip += 2;
  }

  /**
   * Add a signed integer (int8) to a local variable.
   * @done
   */
  op_addilcl1() { // 0xd2
    let localNum = this.codePool.getByte(this.ip);
    let val = this.codePool.getSbyte(this.ip + 1);
    if(Debug.SHOW) Debug.instruction({ local: localNum, val: val });
    this.stack.setLocal(localNum, this.stack.getLocal(localNum).add(new VmInt(val)));
    this.ip += 2;
  }

  /**
   * Add a signed integer (int32) to a local variable.
   * @done
   */
  op_addilcl4() { // 0xd3
    let localNum = this.codePool.getByte(this.ip);
    let val = this.codePool.getInt4(this.ip + 1);
    if(Debug.SHOW) Debug.instruction({ local: localNum, val: val });
    this.stack.setLocal(localNum, this.stack.getLocal(localNum).add(new VmInt(val)));
    this.ip += 5;
  }

  /**
   * Add value from stack to local variable
   * @done
   */
  op_addtolcl() { // 0xd4
    let localNum = this.codePool.getUint2(this.ip);
    if(Debug.SHOW) Debug.instruction({ local: localNum });
    let val = this.stack.pop();
    let local = this.stack.getLocal(localNum);
    this.stack.setLocal(localNum, local.add(val));
    this.ip += 2;
  }

  /**
   * Subtract value from stack from local variable
   * @done
   */
  op_subfromlcl() { // 0xd5
    let localNum = this.codePool.getUint2(this.ip);
    if(Debug.SHOW) Debug.instruction({ local: localNum });
    let val = this.stack.pop();
    let local = this.stack.getLocal(localNum);
    this.stack.setLocal(localNum, local.sub(val));
    this.ip += 2;
  }  

  /**
   * Set a local variable to zero
   * @done
   */
  op_zerolcl1() { // 0xd6
    let localNum = this.codePool.getByte(this.ip);
    if(Debug.SHOW) Debug.instruction({ local: localNum });
    this.stack.setLocal(localNum, new VmInt(0));
    this.ip++;
  }

  /**
   * Set a local variable to zero.
   * @done
   */
  op_zerolcl2() { // 0xd7
    let localNum = this.codePool.getUint2(this.ip);
    if(Debug.SHOW) Debug.instruction({ local: localNum });
    this.stack.setLocal(localNum, new VmInt(0));
    this.ip += 2;
  }

  /**
   * Set a local variable to one.
   * @done
   */
  op_onelcl1() { // 0xda
    let localNum = this.codePool.getByte(this.ip);
    if(Debug.SHOW) Debug.instruction({ local: localNum });
    this.stack.setLocal(localNum, new VmInt(1));
    this.ip++;
  }

  /**
   * Set a local variable to one.
   * @done
   */  
  op_onelcl2() { // 0xdb
    let localNum = this.codePool.getUint2(this.ip);
    if(Debug.SHOW) Debug.instruction({ local: localNum });
    this.stack.setLocal(localNum, new VmInt(1));
    this.ip += 2;
  }

  /**
   * Set a local variable to nil.
   * @done
   */  
  op_nillcl1() { // 0xd8
    let localNum = this.codePool.getByte(this.ip);
    if(Debug.SHOW) Debug.instruction({ local: localNum });
    this.stack.setLocal(localNum, new VmNil());
    this.ip++;
  }

  /**
   * Set a local variable to nil.
   * @done
   */    
  op_nillcl2() { // 0xd9
    let localNum = this.codePool.getUint2(this.ip);
    if(Debug.SHOW) Debug.instruction({ local: localNum });
    this.stack.setLocal(localNum, new VmNil());
    this.ip += 2;
  }

  /**
   * Set a local variable to a value from the stack.
   * @done
   */
  op_setlcl1() { // 0xe0
    let localNum = this.codePool.getByte(this.ip);
    let val = this.stack.pop();
    if(Debug.SHOW) Debug.instruction({ local: localNum, val: val });
    this.stack.setLocal(localNum, val);
    this.ip++;
  }

  /**
   * Set a local variable to a value from the stack.
   * @done
   */
  op_setlcl2() { // 0xe1
    let localNum = this.codePool.getUint2(this.ip);
    if(Debug.SHOW) Debug.instruction({ local: localNum });
    this.stack.setLocal(localNum, this.stack.pop());
    this.ip += 2;
  }

  /** 
   * Set a function argument to a value from the stack.
   * @done
   */
  op_setarg1() { // 0xe2 
    let argNum = this.codePool.getByte(this.ip);
    if(Debug.SHOW) Debug.instruction({ arg: argNum });
    this.stack.setArg(argNum, this.stack.pop());
    this.ip++;
  }

  /** 
   * Set a function argument to a value from the stack.
   * @done
   */  
  op_setarg2() { // 0xe3
    let argNum = this.codePool.getUint2(this.ip);
    if(Debug.SHOW) Debug.instruction({ arg: argNum });
    this.stack.setArg(argNum, this.stack.pop());
    this.ip += 2;
  }  

  /**
   * @todo Operator overloading
   */
  op_setind() { // 0xe4
    if(Debug.SHOW) Debug.instruction();
    let idx = this.stack.pop();
    let container = this.stack.pop();
    let val = this.stack.pop();
    let newlist = container.setind(idx, val);
    this.stack.push(newlist);
  }

  op_setprop() { // 0xe5
    let propID = this.codePool.getUint2(this.ip);
    if(Debug.SHOW) Debug.instruction({ propID: propID });
    let obj = this.stack.pop();
    let val = this.stack.pop();
    if(!(obj instanceof VmObject)) throw('OBJ_VAL_REQD');
    obj.setprop(propID, val);
    this.ip += 2;
  }

  op_ptrsetprop() { // 0xe6
    let vmProp = this.stack.pop();
    if(Debug.SHOW) Debug.instruction({ propID: vmProp });
    if(!(vmProp instanceof VmProp)) throw('PROPPTR_VAL_REQD');
    let obj = this.stack.pop();
    let val = this.stack.pop();
    if(!(obj instanceof VmObject)) throw('OBJ_VAL_REQD');
    obj.setprop(vmProp.value, val);
  }

  op_setpropself() { // 0xe7
    let propID = this.codePool.getUint2(this.ip);
    if(Debug.SHOW) Debug.instruction({ propID: propID });
    let obj = this.stack.getSelf();
    let val = this.stack.pop();
    if(!(obj instanceof VmObject)) throw('OBJ_VAL_REQD');
    obj.setprop(propID, val);
    this.ip += 2;
  }

  op_objsetprop() { // 0xe8 
    let objID = this.codePool.getUint4(this.ip);
    let propID = this.codePool.getUint2(this.ip + 4);
    if(Debug.SHOW) Debug.instruction({ propID: propID, objID: objID });
    let val = this.stack.pop();
    let obj = Heap.getObj(objID);
    obj.setprop(propID, val);
    this.ip += 6;
  }
  
  /**
   * Set self value in method context from stack
   * @done
   */
  op_setself() { // 0xeb
    let vmVal = this.stack.pop();
    if(Debug.SHOW) Debug.instruction({ value: vmVal });
    if(!(vmVal instanceof VmNil) && !(vmVal instanceof VmObject)) throw('OBJ_VAL_REQD');
    this.stack.setSelf(vmVal);
  }

  /**
   * Load method context from stack
   * @done
   */
  op_loadctx() { // 0xec 
    if(Debug.SHOW) Debug.instruction();
    if(!(this.stack.peek() instanceof VmList)) throw('LIST_VAL_REQD');
    let lst = this.stack.pop().unpack();
    this.stack.setSelf(lst[0]);
    this.stack.setTargetProperty(lst[1]);
    this.stack.setTargetObject(lst[2]);
    this.stack.setDefiningObject(lst[3]);
  }

  /**
   * Store method context and push on stack
   * @done
   */
  op_storectx() { // 0xed
    if(Debug.SHOW) Debug.instruction();
    let lst = new VmList([this.stack.getSelf(), this.stack.getTargetProperty(), this.stack.getTargetObject(), this.stack.getDefiningObject()]);
    this.stack.push(lst);
  }

  /**
   * Set local from R0
   * @done
   */
  op_setlcl1r0() { // 0xee 
    let localNum = this.codePool.getByte(this.ip);
    if(Debug.SHOW) Debug.instruction({ local: localNum });
    this.stack.setLocal(localNum, this.r0);
    this.ip++;
  }

  op_setindlcl1i8() { // 0xef
    let localNum = this.codePool.getByte(this.ip);
    let idx = this.codePool.getByte(this.ip + 1);
    if(Debug.SHOW) Debug.instruction({local: localNum, idx: idx});
    this.ip += 2;
    let val = this.stack.pop();
    let container = this.stack.getLocal(localNum);
    let newlist = container.setind(new VmInt(idx), val);
    this.stack.setLocal(localNum, newlist);
  }

  imp_setind(container: VmData, idx: VmData, val: VmData) {
    return container.setind(idx, val);
  }

  /**
   * Breakpoint
   * @done
   */
  op_bp() { // 0xf1
    if(Debug.SHOW) Debug.instruction();
    // Breakpoint instruction is ignored.
  }

  /**
   * No-op
   * @done
   */
  op_nop() { // 0xf2 
    if(Debug.SHOW) Debug.instruction();
  }

  op_no_debug_support() {
    if(Debug.SHOW) Debug.instruction();
    throw('DEBUG INSTRUCTIONS NOT SUPPORTED.');    
  }

}



