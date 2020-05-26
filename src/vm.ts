import { SourceImage } from './SourceImage'
import { DataBlock, DataBlockFactory, CPDF, CPPG, ENTP, MCLD, OBJS } from './blocks/'
import { VmData, VmNil, VmTrue, VmInt, VmSstring, VmList, VmCodeOffset, VmObject, VmProp, VmFuncPtr, VmDstring, VmNativeCode, VmBifPtr, VmEnum, DataFactory } from './types/'
import { Stack } from './Stack'
import { Pool } from './Pool'
import { Debug } from './Debug'
import { Builtin } from './Builtin'
import { MetaclassRegistry } from './metaclass/MetaclassRegistry'
import { MetaclassFactory } from './metaclass/MetaclassFactory'
import { Heap } from './Heap'
import { MetaString, List, Iterator, IntrinsicClass } from './metaimp'
import { OPCODES } from './Opcodes'
import { IFuncInfo } from './IFuncInfo'


const fs = require('fs');

interface IPropInfo {
  targetObject: VmObject,
  definingObject: VmObject,
  data: VmData
}

export class Vm {
  private static instance: Vm = null;

  private image: SourceImage;
  private blocks: DataBlock[] = [];
  public codePool: Pool;
  private dataPool: Pool;
  public r0: VmData = null;
  public ip: number = 0;
  private ep: number = 0;
  public stack: Stack;
  public stop = false;
  public varargc: number = undefined;

  constructor() {
  }

  public static getInstance(): Vm {
    if(Vm.instance == null) {
      Vm.instance = new Vm();
    }
    return Vm.instance;
  }

  load(path : string) {
    let buffer = fs.readFileSync(path);
    this.image = new SourceImage(buffer);
    //console.info('Loaded', this.image.length(), 'bytes');

    let pos = SourceImage.HEADER_SIZE;
    this.blocks = [];
    let unknownBlocks = 0;
    while(pos <= this.image.length()) {
      let oldPos = pos;
      let type = this.image.getString(pos, 4);
      let block = DataBlockFactory.create(type, this.image, pos);
      if(block.toString() == null) {
        unknownBlocks++;
      } else {
        this.blocks.push(block);
        //console.log(block.toString());
      }
      pos += block.length + 10;
    }
    Debug.info("Unknown blocks", unknownBlocks);

    // Create code pool:
    let cpdf = this.blocks.find((b) => b instanceof CPDF && b.identifier == 'code') as CPDF;
    let pages = this.blocks.filter((b) => b instanceof CPPG && b.identifier == 'code') as CPPG[];
    this.codePool = new Pool(this.image, cpdf, pages);

    // Create data pool:
    cpdf = this.blocks.find((b) => b instanceof CPDF && b.identifier == 'data') as CPDF;
    pages = this.blocks.filter((b) => b instanceof CPPG && b.identifier == 'data') as CPPG[];
    this.dataPool = new Pool(this.image, cpdf, pages);

    // Load metaclass dependencies:
    let mcld = this.blocks.find((b) => b instanceof MCLD) as MCLD;
    //mcld.dump(this.image);
    MetaclassRegistry.parseMCLD(this.image, mcld);

    // Load static objects:
    Heap.clear();
    let unknownObjects: string[] = [];
    (this.blocks.filter((b) => b instanceof OBJS) as OBJS[]).forEach((objs) => {
      objs.load(this.image, (id: number, metaclass: number, dataOffset: number) => {
        // Find name and implementation class of object's metaclass.
        let name = MetaclassRegistry.indexToName(metaclass);
        let instance = MetaclassFactory.load(metaclass, this.image, this.dataPool, dataOffset);
        if(instance) {
          Heap.setObj(id, instance);
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

  getFuncInfo(offset: number): IFuncInfo {
    // Get number of parameters
    let methodParamCount = this.codePool.getByte(offset);
    // If high bit is set, then a varying parameter list is accepted.
    let methodVaryingArguments = ((methodParamCount >> 7) == 1);
    // .. and the required number of parameters is:
    if(methodVaryingArguments) methodParamCount = (methodParamCount & 0x7f);

    let methodOptParamCount = this.codePool.getByte(offset + 1);
    let methodLocalCount = this.codePool.getUint2(offset + 2);
    let methodStackSlots = this.codePool.getUint2(offset + 4);

    return {
      params: methodParamCount,
      optParams: methodOptParamCount,
      varargs: methodVaryingArguments,
      locals: methodLocalCount,
      slots: methodStackSlots
    };
  }

  call(offset: number, argc: number, prop: VmProp, targetObj: VmObject, definingObj: VmObject, selfObject: VmObject, invokee: VmData) {
    let funcInfo = this.getFuncInfo(offset);

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
    // check arg_count to ensure that it matches the conditions required in the new method header; 
    let argerror = false;
    if(funcInfo.varargs) {
      if(argc < funcInfo.params) argerror = true;
    } else {
      if(argc < funcInfo.params || argc > funcInfo.params + funcInfo.optParams) argerror = true;
    }
    if(argerror) {
      throw(`CALL: WRONG_NUM_OF_ARGS argc=${argc} methodParamCount=${funcInfo.params} methodOptParamCount=${funcInfo.optParams}`);
    }
    // get the count of local variables from the new method header, and push nil for each local. 
    for(let i = 0; i < funcInfo.locals; i++) this.stack.push(new VmNil());
    // Finally, load the program counter with the first byte of the new function's executable code,
    // which starts immediately after the function's header.     
    this.ip = offset + 10;
  }

  ret() {
    if(this.stack.peek(this.stack.fp - 4).value == -1) this.stop = true;
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
  getprop(data: VmData, vmProp: VmProp, onlyInherited: boolean): IPropInfo {
    // "data" can be an object, a constant string or a constant list.
    if(!(data instanceof VmObject) && !(data instanceof VmSstring) && !(data instanceof VmList)) 
      throw('CALLPROP: OBJ_VAL_REQD');

    // For a constant string or list, create a temporary MetaString/List with the same value.
    if(data instanceof VmSstring) data = new VmObject(new MetaString(data.value));
    if(data instanceof VmList) data = new VmObject(new List(data.value));

    // For an IntrinsicClass, create a temporay instance of the class it represents.
    if(data instanceof VmObject && data.getInstance() instanceof IntrinsicClass) {
      let intrinsicClass = data.getInstance() as IntrinsicClass;
      let klass = MetaclassRegistry.getClass(intrinsicClass.modifierObjID);
      data = new VmObject(new klass());
    }

    // Find the requested property on data, which is now always a VmObject.
    let obj = (data as VmObject).getInstance();
    let res = obj.findProp(vmProp.value, onlyInherited); // This will go through superclasses, as well
    if(!res) return null;

    return {
      targetObject: data as VmObject, // object that was passed in, converted to object if constant string/list/IntrinsicClass
      definingObject: res.object,     // object that the property was found on (possibly ancestor)
      data: res.prop                  // property value that was found
    }
  }

  callprop(data: VmData, vmProp: VmProp, argc: number, onlyInherited: boolean, explicitTargetObject?: VmObject) {
    let propInfo: IPropInfo = this.getprop(data, vmProp, onlyInherited);
    if(!propInfo) throw(`callprop: Cannot find property ${vmProp.value} on object`);

    // If an explicit target object was given (through EXPINHERIT and friends), use it:
    if(explicitTargetObject) {
      propInfo.targetObject = explicitTargetObject;
    }

    // If it's native code on an intrinsic class, call it:
    if(propInfo.data instanceof VmNativeCode) {
      let args = this.stack.popMany(argc);
      this.r0 = propInfo.targetObject.getInstance().callNativeMethod(propInfo.data, ...args);
      return;
    }

    // If a primitive value, store it in R0:
    if(  propInfo.data instanceof VmNil 
      || propInfo.data instanceof VmTrue 
      || propInfo.data instanceof VmObject 
      || propInfo.data instanceof VmProp
      || propInfo.data instanceof VmInt
      || propInfo.data instanceof VmSstring
      || propInfo.data instanceof VmFuncPtr
      || propInfo.data instanceof VmList) this.r0 = propInfo.data;

    // If a double-quoted string, print it.
    else if(propInfo.data instanceof VmDstring) {
      Debug.info("[PRINT]", propInfo.data.value);
    }

    // If a code offset, call function
    else if(propInfo.data instanceof VmCodeOffset) {
      this.call(propInfo.data.value, argc,
        vmProp,                   // property
        propInfo.targetObject,    // target object
        propInfo.definingObject,  // defining object
        propInfo.targetObject,    //  self object
        propInfo.data);           // invokee
    }

    else {
      throw('CALLPROP: Don\'t know what to do with this property.');
    }
    

    // For a string, use the string metaclass constant string property evaluator.
    /* if(data instanceof VmSstring) {
      let s = new MetaString(data.value);
      let args = this.stack.popMany(argc);
      let { prop, object } = s.findProp(vmProp.value);
      this.r0 = s.callNativeMethod((prop as any), ...args);
    }

    // For a list, use the string metaclass:
    if(data instanceof VmList) {
      let lst = new List(data.value);
      let args = this.stack.popMany(argc);
      let { prop, object } = lst.findProp(vmProp.value);
      this.r0 = lst.callNativeMethod((prop as any), ...args);
    } */
  }

  executeInstruction(byte: number) {
    switch(byte) {
      case 0x01: this.op_push_0(); break;
      case 0x02: this.op_push_1(); break;
      case 0x03: this.op_pushint8(); break;
      case 0x04: this.op_pushint(); break;
      case 0x05: this.op_pushstr(); break;
      case 0x06: this.op_pushlst(); break;
      case 0x07: this.op_pushobj(); break;
      case 0x08: this.op_pushnil(); break;
      case 0x09: this.op_pushtrue(); break;
      case 0x0a: this.op_pushpropid(); break;
      case 0x0b: this.op_pushfuncptr(); break;
      case 0x0c: this.op_no_debug_support(); break; // PUSHSTRI
      case 0x0d: this.op_pushparlst(); break;
      case 0x0e: this.op_makelistpar(); break;
      case 0x0f: this.op_pushenum(); break;
      case 0x10: this.op_pushbifptr(); break;
      case 0x20: this.op_neg(); break;
      case 0x21: this.op_bnot(); break;
      case 0x22: this.op_add(); break;
      case 0x23: this.op_sub(); break;
      case 0x24: this.op_mul(); break;
      case 0x25: this.op_band(); break;
      case 0x26: this.op_bor(); break;
      case 0x27: this.op_shl(); break;
      case 0x28: this.op_ashr(); break;
      case 0x29: this.op_xor(); break;
      case 0x2a: this.op_div(); break;
      case 0x2b: this.op_mod(); break;
      case 0x2c: this.op_not(); break;
      case 0x2d: this.op_boolize(); break;
      case 0x2e: this.op_inc(); break;
      case 0x2f: this.op_dec(); break;
      case 0x30: this.op_lshr(); break;
      case 0x40: this.op_eq(); break;
      case 0x41: this.op_ne(); break;
      case 0x42: this.op_lt(); break;
      case 0x43: this.op_le(); break;
      case 0x44: this.op_gt(); break;
      case 0x45: this.op_ge(); break;
      case 0x50: this.op_retval(); break;
      case 0x51: this.op_retnil(); break;
      case 0x52: this.op_rettrue(); break;
      case 0x54: this.op_ret(); break;
      case 0x56: this.op_no_debug_support(); break; // NAMEDARGPTR
      case 0x57: this.op_no_debug_support(); break; // NAMEDARGTAB
      case 0x58: this.op_call(); break;
      case 0x59: this.op_ptrcall(); break;
      case 0x60: this.op_getprop(); break;
      case 0x61: this.op_callprop(); break;
      case 0x62: this.op_ptrcallprop(); break;
      case 0x63: this.op_getpropself(); break;
      case 0x64: this.op_callpropself(); break;
      case 0x65: this.op_ptrcallpropself(); break;
      case 0x66: this.op_objgetprop(); break;
      case 0x67: this.op_objcallprop(); break;
      case 0x68: this.op_no_debug_support(); break;    // GETPROPDATA
      case 0x69: this.op_no_debug_support(); break; // PTRGETPROPDATA
      case 0x6a: this.op_getproplcl1(); break;
      case 0x6b: this.op_callproplcl1(); break;
      case 0x6c: this.op_getpropr0(); break;
      case 0x6d: this.op_callpropr0(); break;
      case 0x72: this.op_inherit(); break;
      case 0x73: this.op_ptrinherit(); break;
      case 0x74: this.op_expinherit(); break;
      case 0x75: this.op_ptrexpinherit(); break;
      case 0x76: this.op_varargc(); break;
      // case 0x77: DELEGATE
      // case 0x78: PTRDELEGATE
      case 0x7a: this.op_swap2(); break;
      case 0x7b: this.op_swapn(); break;
      case 0x7c: this.op_getargn0(); break;
      case 0x7d: this.op_getargn1(); break;
      case 0x7e: this.op_getargn2(); break;
      case 0x7f: this.op_getargn3(); break;
      case 0x80: this.op_getlcl1(); break;
      case 0x81: this.op_getlcl2(); break;
      case 0x82: this.op_getarg1(); break;
      case 0x83: this.op_getarg2(); break;
      case 0x84: this.op_pushself(); break;
      case 0x85: this.op_getdblcl(); break;
      case 0x86: this.op_getdbarg(); break;
      case 0x87: this.op_getargc(); break;
      case 0x88: this.op_dup(); break;
      case 0x89: this.op_disc(); break;
      case 0x8a: this.op_disc1(); break;
      case 0x8b: this.op_getr0(); break;
      case 0x8c: this.op_no_debug_support(); break; // GETDBARGC
      case 0x8d: this.op_swap(); break;
      case 0x8e: this.op_pushctxele(); break;
      case 0x8f: this.op_dup2(); break;
      case 0x90: this.op_switch(); break;
      case 0x91: this.op_jmp(); break;
      case 0x92: this.op_jt(); break;
      case 0x93: this.op_jf(); break;
      case 0x94: this.op_je(); break;
      case 0x95: this.op_jne(); break;
      case 0x96: this.op_jgt(); break;
      case 0x97: this.op_jge(); break;
      case 0x98: this.op_jlt(); break;
      case 0x99: this.op_jle(); break;
      case 0x9a: this.op_jst(); break;
      case 0x9b: this.op_jsf(); break;
      case 0x9c: this.op_ljsr(); break;
      case 0x9d: this.op_lret(); break;
      case 0x9e: this.op_jnil(); break;
      case 0x9f: this.op_jnotnil(); break;
      case 0xa0: this.op_jr0t(); break;
      case 0xa1: this.op_jr0f(); break;
      case 0xa2: this.op_iternext(); break;
      case 0xaa: this.op_getlclnx(0); break;
      case 0xab: this.op_getlclnx(1); break;
      case 0xac: this.op_getlclnx(2); break;
      case 0xad: this.op_getlclnx(3); break;
      case 0xae: this.op_getlclnx(4); break;
      case 0xaf: this.op_getlclnx(5); break;
      case 0xb0: this.op_say(); break;
      case 0xb1: this.op_builtin_a(); break;
      case 0xb2: this.op_builtin_b(); break;
      case 0xb3: this.op_builtin_c(); break;
      case 0xb4: this.op_builtin_d(); break;
      case 0xb5: this.op_builtin1(); break;
      case 0xb6: this.op_builtin2(); break;
      case 0xba: this.op_index(); break;
      case 0xbb: this.op_idxlcl1int8(); break;
      case 0xbc: this.op_idxint8(); break;
      case 0xc0: this.op_new1(); break;
      case 0xc1: this.op_new2(); break;
      case 0xc2: this.op_trnew1(); break;
      case 0xc3: this.op_trnew2(); break;
      case 0xd0: this.op_inclcl(); break;
      case 0xd1: this.op_declcl(); break;
      case 0xd2: this.op_addilcl1(); break;
      case 0xd3: this.op_addilcl4(); break;
      case 0xd4: this.op_addtolcl(); break;
      case 0xd5: this.op_subfromlcl(); break;
      case 0xd6: this.op_zerolcl1(); break;
      case 0xd7: this.op_zerolcl2(); break;
      case 0xd8: this.op_nillcl1(); break;
      case 0xd9: this.op_nillcl2(); break;
      case 0xda: this.op_onelcl1(); break;
      case 0xdb: this.op_onelcl2(); break;
      case 0xe0: this.op_setlcl1(); break;
      case 0xe1: this.op_setlcl2(); break;
      case 0xe2: this.op_setarg1(); break;
      case 0xe3: this.op_setarg2(); break;
      case 0xe4: this.op_setind(); break;
      case 0xe5: this.op_setprop(); break;
      case 0xe6: this.op_ptrsetprop(); break;
      case 0xe7: this.op_setpropself(); break;
      case 0xe8: this.op_objsetprop(); break;
      case 0xe9: this.op_no_debug_support(); break; // SETDBLCL
      case 0xea: this.op_no_debug_support(); break; // SETDBARG
      case 0xeb: this.op_setself(); break;
      case 0xec: this.op_loadctx(); break;
      case 0xed: this.op_storectx(); break;
      case 0xee: this.op_setlcl1r0(); break;
      case 0xef: this.op_setindlcl1i8(); break;
      case 0xf1: this.op_bp(); break;
      case 0xf2: this.op_nop(); break;
      default:
        throw('UNKNOWN INSTRUCTION 0x' + byte.toString(16));
    }
  }

  private execute() {
    let byte = this.codePool.getByte(this.ip++); 
    Debug.opcode = byte;
    Debug.ip = this.ip;
    if(OPCODES[byte] == null) throw('Unknown instruction: ' + '0x' + byte.toString(16));
    Debug.opname = OPCODES[byte].name;
    let size = OPCODES[byte].size;
    this.executeInstruction(byte);
  }

  //
  // Returns R0 after program ends
  //   
  run(): VmData {
    // Find out from image where code starts:
    let codeStart = (this.blocks.find((b) => b instanceof ENTP) as ENTP).codePoolOffset;
    // Run a content with 1 argument that ends when IP = -1,
    // with a single argument for _main function.
    return this.runContext(codeStart, null, null, null, null, null, new VmSstring('args'));
  }

  //
  // Returns R0 after context runs
  // 
  runContext(offset: number, prop: VmProp, targetObject: VmObject, definingObject: VmObject, selfObject: VmObject, invokee: VmData, ...args: VmData[]): VmData {
    // Push all arguments on the stack (in reverse)
    args.reverse().forEach((a) => this.stack.push(a));
    // Save old IP, so we can return to it when context ends:
    let oldIP = this.ip;
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
    do {
      this.execute();
    } while (!this.stop);
    this.stop = false;
    // Go back to previous context's IP:
    this.ip = oldIP;
    return this.r0;
  }

  dump() {
    console.info('=== VM DUMP ===');
    let r0Value: any;
    if(this.r0 instanceof VmTrue) r0Value = 'VmTrue';
    else if(this.r0 instanceof VmNil) r0Value = 'VmNil';
    else r0Value = this.r0;
    console.info('IP:', this.ip, 'EP:', this.ep, 'R0:', r0Value);
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
    Debug.instruction();
  }

  /** 
   * Push integer 1 onto the stack.
   * @done
   */
  op_push_1() { // 0x02 
    this.stack.push(new VmInt(1));
    Debug.instruction();
  }

  
  /**
   * Push byte-sized signed integer onto the stack
   * @done
   */
  op_pushint8() { // 0x03
    let val = this.codePool.getSbyte(this.ip);
    Debug.instruction({ value: val });
    this.stack.push(new VmInt(val));
    this.ip++;
  }

  /**
   * Push signed integer value onto stack
   * @done
   */
  op_pushint() { // 0x04
    let val = this.codePool.getInt4(this.ip);
    Debug.instruction({ value: val });
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
    Debug.instruction({ value: str });
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
    Debug.instruction({ value: lst });
    this.stack.push(new VmList(lst));              // Push list on stack
    this.ip += 4;
  }  

  
  /**
   * Push a reference to the object with ID objID onto the stack.
   * @done
   */
  op_pushobj() { // 0x07
    let ref = this.codePool.getUint4(this.ip);
    Debug.instruction({ value: ref });
    this.stack.push(new VmObject(ref));
    this.ip += 4;
  }

  /**
   * Push NIL onto the stack.
   * @done
   */
  op_pushnil() { // 0x08
    this.stack.push(new VmNil());
    Debug.instruction();
  }

  /**
   * Push TRUE onto the stack.
   * @done
   */
  op_pushtrue() { // 0x09
    this.stack.push(new VmTrue());
    Debug.instruction();
  }

  /**
   * Push PropID onto the stack.
   * @done
   */
  op_pushpropid() { // 0x0a
    let propID = this.codePool.getUint2(this.ip);
    Debug.instruction({ propID: propID });
    this.stack.push(new VmProp(propID));
    this.ip += 2;
  }

  /**
   * Push function pointer onto the stack.
   * @done
   */
  op_pushfuncptr() { // 0x0b
    let funcPtr = this.codePool.getUint4(this.ip);
    Debug.instruction({ funcPtr: funcPtr });
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
    Debug.instruction({ argc: fixedArgCount });
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
      argc.value += lst.length;
    } else {
      this.stack.push(val);
      argc.value++;
    }
    this.stack.push(argc);
  }

  /**
   * Push enum value onto the stack.
   * @done
   */
  op_pushenum() { // 0x0f
    let val = this.codePool.getInt4(this.ip);
    Debug.instruction();
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
    Debug.instruction({ setIndex: setIndex, funcIndex: funcIndex });
    this.stack.push(new VmBifPtr(setIndex, funcIndex));
    this.ip += 4;
  }

  /**
   * @todo Needs operator overloading.
   */
  op_neg() { // 0x20
    Debug.instruction();
    let val = this.stack.pop();
    this.stack.push(val.neg());
  }

  /**
   * @todo Needs operator overloading.
   */
  op_bnot() { // 0x21
    Debug.instruction();
    let val = this.stack.pop();
    this.stack.push(val.bnot());
  }

  /**
   * @todo Needs operator overloading.
   */  
  op_add() { // 0x22
    Debug.instruction();
    let val2 = this.stack.pop();
    let val1 = this.stack.pop();
    this.stack.push(val1.add(val2));
  }

  /**
   * @todo Needs operator overloading.
   */  
  op_sub() { // 0x23
    Debug.instruction();
    let val2 = this.stack.pop();
    let val1 = this.stack.pop();
    this.stack.push(val1.sub(val2));
  }

  /**
   * @todo Needs operator overloading.
   */  
  op_mul() { // 0x24
    Debug.instruction();
    let val2 = this.stack.pop();
    let val1 = this.stack.pop();
    this.stack.push(val1.mul(val2));
  }

  /**
   * @todo Needs operator overloading.
   */  
  op_band() { // 0x25 
    Debug.instruction();
    let val2 = this.stack.pop();
    let val1 = this.stack.pop();
    this.stack.push(val1.band(val2));
  }

  /**
   * @todo Needs operator overloading.
   */  
  op_bor() { // 0x26
    Debug.instruction();
    let val2 = this.stack.pop();
    let val1 = this.stack.pop();
    this.stack.push(val1.bor(val2));
  }  

  /**
   * @todo Needs operator overloading.
   */  
  op_shl() { // 0x27
    Debug.instruction();
    let val2 = this.stack.pop();
    let val1 = this.stack.pop();
    this.stack.push(val1.shl(val2));
  }

  /**
   * @todo Needs operator overloading.
   */  
  op_ashr() { // 0x28
    Debug.instruction();
    let val2 = this.stack.pop();
    let val1 = this.stack.pop();
    this.stack.push(val1.ashr(val2));
  }

  /**
   * @todo Needs operator overloading.
   */  
  op_xor() { // 0x29
    Debug.instruction();
    let val2 = this.stack.pop();
    let val1 = this.stack.pop();
    this.stack.push(val1.xor(val2));
  }
  
  /**
   * @todo Needs operator overloading.
   */  
  op_div() { // 0x2a
    Debug.instruction();
    let val2 = this.stack.pop();
    let val1 = this.stack.pop();
    this.stack.push(val1.div(val2));
  }

  /**
   * @todo Needs operator overloading.
   */  
  op_mod() { // 0x2b
    Debug.instruction();
    let val2 = this.stack.pop();
    let val1 = this.stack.pop();
    this.stack.push(val1.mod(val2));
  }

  /**
   * Logical inversion
   * @done (All possibilities covered)
   */
  op_not() { // 0x2c
    Debug.instruction();
    let val = this.stack.pop();
    this.stack.push(val.not());
  }

  /**
   * Convert to boolean
   * @done (All possibilities covered)
   */
  op_boolize() { // 0x2d
    Debug.instruction();
    let val = this.stack.pop();
    this.stack.push(val.boolize());
  }

  /**
   * Add 1 to value
   * @done (Depends on ADD)
   */
  op_inc() { // 0x2e 
    Debug.instruction();
    let val = this.stack.pop();
    this.stack.push(val.add(new VmInt(1)));
  }

  /**
   * Subtract 1 from value
   * @done (Depends on SUB)
   */
  op_dec() { // 0x2f
    Debug.instruction();
    let val = this.stack.pop();
    this.stack.push(val.sub(new VmInt(1)));
  }

  /**
   * @todo Needs operator overloading.
   */  
  op_lshr() { // 0x30
    Debug.instruction();
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
    Debug.instruction();
    let val2 = this.stack.pop();
    let val1 = this.stack.pop();
    this.stack.push(val1.eq(val2) ? new VmTrue() : new VmNil());
  }

  /**
   * Test if items on stack are unequal.
   * @done through EQ
   */
  op_ne() { // 0x41
    Debug.instruction();
    let val2 = this.stack.pop();
    let val1 = this.stack.pop();
    this.stack.push(val1.eq(val2) ? new VmNil() : new VmTrue());
  }

  /**
   * Test if second stack element is less than top stack element.
   * @todo Which metaclasses must implement "compare" ?
   */
  op_lt() { // 0x42
    Debug.instruction();
    let val2 = this.stack.pop();
    let val1 = this.stack.pop();
    this.stack.push(val1.lt(val2) ? new VmTrue() : new VmNil());
  }

  /**
   * Test if second stack element is less than/equal to top stack element.
   * @done through EQ and LT
   */
  op_le() { // 0x43
    Debug.instruction();
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
    Debug.instruction();
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
    Debug.instruction();
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
    Debug.instruction();
    this.r0 = this.stack.pop();
    this.ret();
  }

  /**
   * Return NIL.
   * @done
   */
  op_retnil() { // 0x51
    Debug.instruction();
    this.r0 = new VmNil();
    this.ret();
  }

  /**
   * Return TRUE.
   * @done
   */
  op_rettrue() { // 0x52
    Debug.instruction();
    this.r0 = new VmTrue();
    this.ret();    
  }

  /**
   * Return.
   * @done
   */
  op_ret() { // 0x54
    Debug.instruction();
    this.ret();
  }

  op_call() { // 0x58
    let argc = this.codePool.getByte(this.ip);
    let func_offset = this.codePool.getUint4(this.ip + 1);
    Debug.instruction({ 'argc': argc, 'func_offset': func_offset });
    this.ip += 5;
    // This calls a stand-alone function. It has no property target,
    // no target object, no defining object, no self object (and no invokee).
    this.call(func_offset, argc, null, null, null, null, null);
  }

  op_ptrcall() { // 0x59
    let argc = this.codePool.getByte(this.ip);
    Debug.instruction({ argc: argc });
    this.ip++;
    let val = this.stack.pop();
    if(val instanceof VmFuncPtr) {
      this.call(val.value, argc, null, null, null, null, null);
    } else if(val instanceof VmBifPtr) { // This isn't in the docs, but I think it should be supported.
      this.r0 = Builtin.call(val.getSetIndex(), val.getFunctionIndex(), argc);
    } else if(val instanceof VmProp) {
      throw('TODO: PTRCALL NOT IMPLEMENTED FOR PROPID');
    } else if(val instanceof VmObject) {
      throw('TODO: PTRCALL NOT IMPLEMENTED FOR OBJECT');
    } else {
      throw('PTRCALL: FUNCPTR_VAL_REQD');
    }
  }

  op_getprop() { // 0x60
    let propID = this.codePool.getUint2(this.ip);
    Debug.instruction({ propID: propID});
    this.ip += 2;
    let data  = this.stack.pop();
    this.callprop(data, new VmProp(propID), 0, false);
  }

  op_callprop() { // 0x61
    let argc = this.codePool.getByte(this.ip);
    let propID = this.codePool.getUint2(this.ip + 1);
    let data  = this.stack.pop();
    Debug.instruction({'obj': data, 'propID': propID, 'argc': argc});
    this.ip += 3;
    this.callprop(data, new VmProp(propID), argc, false);
  }

  op_ptrcallprop() { // 0x62
    let argc = this.codePool.getByte(this.ip);
    let vmProp = this.stack.pop();
    let data  = this.stack.pop();
    Debug.instruction({'obj': data, 'propID': vmProp, 'argc': argc});
    this.ip++;
    this.callprop(data, vmProp, argc, false);
  }

  op_getpropself() { // 0x63
    let propID = this.codePool.getUint2(this.ip);
    Debug.instruction({ propID: propID });
    this.ip += 2;
    this.callprop(this.stack.getSelf(), new VmProp(propID), 0, false);
  }

  op_callpropself() { // 0x64 
    let argc = this.codePool.getByte(this.ip);
    let propID = this.codePool.getUint2(this.ip + 1);
    Debug.instruction({ propID: propID, argc: argc });
    this.ip += 3;
    this.callprop(this.stack.getSelf(), new VmProp(propID), argc, false);
  }

  op_ptrcallpropself() { // 0x65
    let argc = this.codePool.getByte(this.ip);
    let vmProp = this.stack.pop();
    let data = this.stack.getSelf();
    Debug.instruction({'obj': data, 'propID': vmProp, 'argc': argc});
    this.ip++;
    this.callprop(data, vmProp, argc, false);
  }

  op_objgetprop() { // 0x66
    let objID = this.codePool.getUint4(this.ip);
    let propID = this.codePool.getUint2(this.ip + 4);
    Debug.instruction({ objID: objID, propID: propID});
    this.ip += 6;
    this.callprop(new VmObject(objID), new VmProp(propID), 0, false);
  }

  op_objcallprop() { // 0x67 
    let argc = this.codePool.getByte(this.ip);
    let objID = this.codePool.getUint4(this.ip + 1);
    let propID = this.codePool.getUint2(this.ip + 5);
    Debug.instruction({ objID: objID, propID: propID, argc: argc});
    this.ip += 7;
    this.callprop(new VmObject(objID), new VmProp(propID), argc, false);
  }

  op_getproplcl1() { // 0x6a 
    let localNum = this.codePool.getByte(this.ip);
    let propID = this.codePool.getUint2(this.ip + 1);
    Debug.instruction({'local': localNum, 'propID': propID});
    this.ip += 3;
    this.callprop(this.stack.getLocal(localNum), new VmProp(propID), 0, false);
  }

  op_callproplcl1() { // 0x6b
    let argc = this.codePool.getByte(this.ip);
    let localNum = this.codePool.getByte(this.ip + 1);
    let propID = this.codePool.getUint2(this.ip + 2);
    Debug.instruction({'local': localNum, 'propID': propID, 'argc': argc});
    this.ip += 4;
    this.callprop(this.stack.getLocal(localNum), new VmProp(propID), argc, false);
  }

  op_getpropr0() { // 0x6c 
    let propID = this.codePool.getUint2(this.ip);
    Debug.instruction({'propID': propID});
    this.ip += 2;
    this.callprop(this.r0, new VmProp(propID), 0, false);
  }

  op_callpropr0() { // 0x6d
    let argc = this.codePool.getByte(this.ip);
    let propID = this.codePool.getUint2(this.ip + 1);
    Debug.instruction({'propID': propID, 'argc': argc});
    this.ip += 3;
    this.callprop(this.r0, new VmProp(propID), argc, false);
  }

  op_inherit() { // 0x72
    let argc = this.codePool.getByte(this.ip);
    let propID = this.codePool.getUint2(this.ip + 1);
    Debug.instruction({'propID': propID, 'argc': argc});
    this.ip += 3;
    this.callprop(this.stack.getDefiningObject(), new VmProp(propID), argc, true);
  }

  op_ptrinherit() { // 0x73
    let argc = this.codePool.getByte(this.ip);
    let vmProp = this.stack.pop();
    Debug.instruction({'prop': vmProp, argc: argc});
    this.ip++;
    this.callprop(this.stack.getDefiningObject(), vmProp, argc, true);
  }

  op_expinherit() { // 0x74
    let argc = this.maybe_varargc(this.codePool.getByte(this.ip));
    let propID = this.codePool.getUint2(this.ip + 1);
    let objID = this.codePool.getUint4(this.ip + 3);
    Debug.instruction({ argc: argc, propID: propID, objID: objID });
    this.ip += 7;
    this.callprop(new VmObject(Heap.getObj(objID)), new VmProp(propID), argc, false, this.stack.getSelf() as VmObject); 
  }

  op_ptrexpinherit() { // 0x75
    let argc = this.maybe_varargc(this.codePool.getByte(this.ip));
    let objID = this.codePool.getUint4(this.ip + 1);
    let vmProp = this.stack.pop();
    Debug.instruction({ argc: argc, prop: vmProp, objID: objID });
    this.ip += 5;
    this.callprop(new VmObject(Heap.getObj(objID)), vmProp, argc, false, this.stack.getSelf() as VmObject); 
  }

  op_varargc() { // 0x76
    let val = this.stack.pop();
    Debug.instruction({ argc: val });
    if(!(val instanceof VmInt)) throw('NUM_VAL_REQD');
    this.varargc = val.unpack();
  }

  op_getargn0() { Debug.instruction(); this.stack.push(this.stack.getArg(0)); } // 0x7c
  op_getargn1() { Debug.instruction(); this.stack.push(this.stack.getArg(1)); } // 0x7d
  op_getargn2() { Debug.instruction(); this.stack.push(this.stack.getArg(2)); } // 0x7e
  op_getargn3() { Debug.instruction(); this.stack.push(this.stack.getArg(3)); } // 0x7f

  op_swap2() { // 0x7a
    Debug.instruction();
    let val1 = this.stack.pop();
    let val2 = this.stack.pop();
    let val3 = this.stack.pop();
    let val4 = this.stack.pop();
    this.stack.push(val2);
    this.stack.push(val1);
    this.stack.push(val4);
    this.stack.push(val3);
  }

  op_swapn() { // 0x7b (error in docs, they say this is 0x7a)
    let idx1 = this.codePool.getByte(this.ip);
    let idx2 = this.codePool.getByte(this.ip + 1);
    Debug.instruction({ idx1: idx1, idx2: idx2 });
    this.ip += 2;
    let val1 = this.stack.elements[this.stack.sp - idx1 - 1];
    let val2 = this.stack.elements[this.stack.sp - idx2 - 1];
    this.stack.elements[this.stack.sp - idx1 - 1] = val2;
    this.stack.elements[this.stack.sp - idx2 - 1] = val1;
  }

  op_getlcl1() { // 0x80
    let index = this.codePool.getByte(this.ip);
    Debug.instruction({ index: index });
    this.stack.push(this.stack.peek(this.stack.fp + index));
    this.ip++;
  }

  op_getlcl2() { // 0x81
    let index = this.codePool.getUint2(this.ip);
    Debug.instruction({ index: index });
    this.stack.push(this.stack.peek(this.stack.fp + index));
    this.ip += 2;
  }

  op_getarg1() { // 0x82 
    let index = this.codePool.getByte(this.ip);
    Debug.instruction({ index: index });
    this.stack.push(this.stack.getArg(index));
    this.ip++;
  }

  op_getarg2() { // 0x83 
    let index = this.codePool.getUint2(this.ip);
    Debug.instruction({ index: index });
    this.stack.push(this.stack.getArg(index));
    this.ip += 2;
  }

  op_pushself() { // 0x84
    Debug.instruction();
    this.stack.push(this.stack.getSelf());
  }

  op_getdblcl() { // 0x85
    Debug.instruction();
    throw('DEBUG INSTRUCTIONS NOT SUPORTED');
  }

  op_getdbarg() { // 0x86
    Debug.instruction();
    throw('DEBUG INSTRUCTIONS NOT SUPORTED');
  }

  op_getargc() { // 0x87 
    Debug.instruction();
    let argcount = this.stack.getArgCount();
    this.stack.push(new VmInt(argcount));
  }

  op_dup() { // 0x88
    Debug.instruction();
    this.stack.push(this.stack.peek(this.stack.sp - 1));
    // TODO: Probably needs deep copy
  }

  op_disc() { // 0x89
    Debug.instruction();
    this.stack.pop();
  }

  op_disc1() { // 0x8a
    let count = this.codePool.getByte(this.ip);
    Debug.instruction({ count: count});
    this.ip++;
    this.stack.popMany(count);
  }

  op_getr0() { // 0x8b
    Debug.instruction();
    this.stack.push(this.r0);
  }

  op_swap() { // 0x8d 
    Debug.instruction();
    let val1 = this.stack.pop();
    let val2 = this.stack.pop();
    this.stack.push(val1);
    this.stack.push(val2);
  }

  op_pushctxele() { // 0x8e 
    let element = this.codePool.getByte(this.ip);
    Debug.instruction({'element': element});
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

  op_dup2() { // 0x8f
    Debug.instruction();
    let val1 = this.stack.peek(this.stack.sp - 1); // top of stack
    let val2 = this.stack.peek(this.stack.sp - 2);
    this.stack.push(val2);
    this.stack.push(val1);
    // TODO: Probably needs deep copy
  }

  op_switch() { // 0x90
    let val = this.stack.pop();
    let case_count = this.codePool.getUint2(this.ip);
    Debug.instruction();
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

  op_jmp() { // 0x91
    let branch_offset = this.codePool.getInt2(this.ip);
    Debug.instruction({ offset: branch_offset});
    this.ip += branch_offset;
  }

  op_jt() { // 0x92
    let branch_offset = this.codePool.getInt2(this.ip);
    Debug.instruction({ offset: branch_offset});
    let val = this.stack.pop();
    if(val instanceof VmNil || (val instanceof VmInt && val.value == 0)) {
      this.ip += 2;
    } else {
      this.ip += branch_offset;
    }
  }
  
  op_jf() { // 0x93
    let branch_offset = this.codePool.getInt2(this.ip);
    Debug.instruction({ offset: branch_offset});
    let val = this.stack.pop();    
    if(val instanceof VmNil || (val instanceof VmInt && val.value == 0)) {
      this.ip += branch_offset;
    } else {
      this.ip += 2;
    }
  }  

  op_je() { // 0x94
    let branch_offset = this.codePool.getInt2(this.ip);
    Debug.instruction({ offset: branch_offset});
    let val2 = this.stack.pop();
    let val1 = this.stack.pop();
    if(val1.eq(val2)) {
      this.ip += branch_offset;
    } else {
      this.ip += 2;
    }
  }

  op_jne() { // 0x95
    let branch_offset = this.codePool.getInt2(this.ip);
    Debug.instruction({ offset: branch_offset});
    let val2 = this.stack.pop();
    let val1 = this.stack.pop();
    if(val1.eq(val2)) {
      this.ip += 2;
    } else {
      this.ip += branch_offset;
    }
  }

  op_jgt() { // 0x96
    let branch_offset = this.codePool.getInt2(this.ip);
    Debug.instruction({ offset: branch_offset});
    let val2 = this.stack.pop();
    let val1 = this.stack.pop();
    if(val1.lt(val2) || val1.eq(val2)) {
      this.ip += 2;
    } else {
      this.ip += branch_offset;
    }
  }

  op_jge() { // 0x97
    let branch_offset = this.codePool.getInt2(this.ip);
    Debug.instruction({ offset: branch_offset});
    let val2 = this.stack.pop();
    let val1 = this.stack.pop();
    if(val1.lt(val2)) {
      this.ip += 2;
    } else {
      this.ip += branch_offset;
    }
  }

  op_jlt() { // 0x98
    let branch_offset = this.codePool.getInt2(this.ip);
    Debug.instruction({ offset: branch_offset});
    let val2 = this.stack.pop();
    let val1 = this.stack.pop();
    if(val1.lt(val2)) {
      this.ip += branch_offset;
    } else {
      this.ip += 2;
    }
  }  

  op_jle() { // 0x99
    let branch_offset = this.codePool.getInt2(this.ip);
    Debug.instruction({ offset: branch_offset});
    let val2 = this.stack.pop();
    let val1 = this.stack.pop();
    if(val1.lt(val2) || val1.eq(val2)) {
      this.ip += branch_offset;
    } else {
      this.ip += 2;
    }
  }    

  op_jst() { // 0x9a 
    let branch_offset = this.codePool.getInt2(this.ip);
    Debug.instruction({ offset: branch_offset});
    let val = this.stack.peek(this.stack.sp - 1);
    if(val instanceof VmNil || (val instanceof VmInt && val.value == 0)) {
      this.stack.pop();
      this.ip += 2;
    } else {
      this.ip += branch_offset;
    }
  }

  op_jsf() { // 0x9b
    let branch_offset = this.codePool.getInt2(this.ip);
    Debug.instruction({ offset: branch_offset});
    let val = this.stack.peek(this.stack.sp - 1);
    if(val instanceof VmNil || (val instanceof VmInt && val.value == 0)) {
      this.ip += branch_offset;
    } else {
      this.stack.pop();
      this.ip += 2;
    }
  }

  op_ljsr() { // 0x9c
    let branch_offset = this.codePool.getInt2(this.ip);
    Debug.instruction({ offset: branch_offset});
    this.stack.push(new VmCodeOffset(this.ip + 2));
    this.ip += branch_offset;
  }

  op_lret() { // 0x9d
    let localNum = this.codePool.getUint2(this.ip);
    Debug.instruction({ local: localNum});
    this.ip = this.stack.getLocal(localNum).value;
  }

  op_jnil() { // 0x9e
    let branch_offset = this.codePool.getInt2(this.ip);
    Debug.instruction({ offset: branch_offset});
    let val = this.stack.pop();
    if(val instanceof VmNil) {
      this.ip += branch_offset;
      
    } else {
      this.ip += 2;
    }
  }

  op_jnotnil() { // 0x9f
    let branch_offset = this.codePool.getInt2(this.ip);
    Debug.instruction({ offset: branch_offset});
    let val = this.stack.pop();
    if(val instanceof VmNil) {
      this.ip += 2;
    } else {
      this.ip += branch_offset;
    }
  }

  op_jr0t() { // 0xa0
    let branch_offset = this.codePool.getInt2(this.ip);
    Debug.instruction({ offset: branch_offset});
    if(this.r0 instanceof VmNil || (this.r0 instanceof VmInt && this.r0.value == 0)) {
      this.ip += 2;
    } else {
      this.ip += branch_offset;
    }
  }

  op_jr0f() { // 0xa1
    let branch_offset = this.codePool.getInt2(this.ip);
    Debug.instruction({ offset: branch_offset});
    if(this.r0 instanceof VmNil || (this.r0 instanceof VmInt && this.r0.value == 0)) {
      this.ip += branch_offset;
    } else {
      this.ip += 2;
    }
  }  

  op_iternext() { // 0xa2 
    let localNum = this.codePool.getUint2(this.ip);
    let branch_offset = this.codePool.getInt2(this.ip + 2);
    Debug.instruction({ local: localNum, offset: branch_offset });
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

  op_getlclnx(index: number) { // 0xaa ... 0xaf
    Debug.instruction();
    this.stack.push(this.stack.getLocal(index));
  }

  op_say() { // 0xb0
    Debug.instruction();
    let arg = this.codePool.getUint4(this.ip);
    Debug.info('OUTPUT', this.dataPool.getString(arg));
    this.ip += 4;
  }

  op_builtin_a() { // 0xb1
    let argc = this.codePool.getByte(this.ip);
    let func_index = this.codePool.getByte(this.ip + 1);
    Debug.instruction({ argc: argc, func_index: func_index});
    this.ip += 2;
    this.imp_builtin(argc, func_index, 0);
  }

  op_builtin_b() { // 0xb2
    let argc = this.codePool.getByte(this.ip);
    let func_index = this.codePool.getByte(this.ip + 1);
    Debug.instruction({ argc: argc, func_index: func_index});
    this.ip += 2;
    this.imp_builtin(argc, func_index, 1);
  }

  op_builtin_c() { // 0xb3
    let argc = this.codePool.getByte(this.ip);
    let func_index = this.codePool.getByte(this.ip + 1);
    Debug.instruction( { argc: argc, func_index: func_index});
    this.ip += 2;
    this.imp_builtin(argc, func_index, 2);
  }

  op_builtin_d() { // 0xb4
    let argc = this.codePool.getByte(this.ip);
    let func_index = this.codePool.getByte(this.ip + 1);
    Debug.instruction({ argc: argc, func_index: func_index});
    this.ip += 2;
    this.imp_builtin(argc, func_index, 3);
  }

  op_builtin1() { // 0xb5
    let argc = this.codePool.getByte(this.ip);
    let func_index = this.codePool.getByte(this.ip + 1);
    let set_index = this.codePool.getByte(this.ip + 2);
    Debug.instruction({argc: argc, func_index: func_index, set_index: set_index});
    this.ip += 3;
    this.imp_builtin(argc, func_index, set_index);
  }

  op_builtin2() { // 0xb6
    let argc = this.codePool.getByte(this.ip);
    let func_index = this.codePool.getUint2(this.ip + 1);
    let set_index = this.codePool.getByte(this.ip + 3);
    Debug.instruction({argc: argc, func_index: func_index, set_index: set_index});
    this.ip += 4;
    this.imp_builtin(argc, func_index, set_index);
  }

  imp_builtin(argc: number, func_index: number, set_index: number) {
    this.r0 = Builtin.call(set_index, func_index, argc);
  }

  op_index() { // 0xba
    let indexVal = this.stack.pop();
    let val = this.stack.pop();
    Debug.instruction({'idx': indexVal});
    this.stack.push(val.getind(indexVal));
  }

  op_idxlcl1int8() { // 0xbb
    let localNum = this.codePool.getByte(this.ip);
    let indexVal = this.codePool.getByte(this.ip + 1);
    Debug.instruction({'local': localNum, 'idx': indexVal });
    this.ip += 2;
    let val = this.stack.getLocal(localNum);
    this.stack.push(val.getind(new VmInt(indexVal)));
  }

  op_idxint8() { // 0cbc
    let indexVal = new VmInt(this.codePool.getByte(this.ip));
    let val = this.stack.pop();
    Debug.instruction({'idx': indexVal.value });
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
    Debug.instruction({'metaclassID': metaclass_id, 'argc': argc, 'class': name });
    let instance = MetaclassFactory.create(metaclass_id, ...args);
    instance.setTransient(transient);
    this.r0 = new VmObject(instance);
  }

  op_inclcl() { // 0xd0 
    let localNum = this.codePool.getUint2(this.ip);
    Debug.instruction({ local: localNum});
    let val = this.stack.getLocal(localNum);
    val = val.add(new VmInt(1));
    this.stack.setLocal(localNum, val);
    this.ip += 2;
  }

  op_declcl() { // 0xd1
    let localNum = this.codePool.getUint2(this.ip);
    Debug.instruction({ local: localNum});
    let val = this.stack.getLocal(localNum);
    val = val.sub(new VmInt(1));
    this.stack.setLocal(localNum, val);
    this.ip += 2;
  }

  op_addilcl1() { // 0xd2
    let localNum = this.codePool.getByte(this.ip);
    let val = this.codePool.getSbyte(this.ip + 1);
    Debug.instruction({local: localNum, val: val});
    let loc = this.stack.getLocal(localNum);
    this.stack.setLocal(localNum, loc.add(new VmInt(val)));
    this.ip += 2;
  }

  op_addilcl4() { // 0xd3
    let localNum = this.codePool.getByte(this.ip);
    let val = this.codePool.getInt4(this.ip + 1);
    let loc = this.stack.getLocal(localNum);
    Debug.instruction({local: localNum, val: val});
    this.stack.setLocal(localNum, loc.add(new VmInt(val)));
    this.ip += 5;
  }

  op_addtolcl() { // 0xd4
    let localNum = this.codePool.getUint2(this.ip);
    Debug.instruction({local: localNum});
    let val = this.stack.pop();
    let loc = this.stack.getLocal(localNum);
    this.stack.setLocal(localNum, loc.add(val));
    this.ip += 2;
  }

  op_subfromlcl() { // 0xd5
    let localNum = this.codePool.getUint2(this.ip);
    Debug.instruction({local: localNum});
    let val = this.stack.pop();
    let loc = this.stack.getLocal(localNum);
    this.stack.setLocal(localNum, loc.sub(val));
    this.ip += 2;
  }  

  op_zerolcl1() { // 0xd6
    let localNum = this.codePool.getByte(this.ip);
    Debug.instruction( {local: localNum});
    this.stack.setLocal(localNum, new VmInt(0));
    this.ip++;
  }

  op_zerolcl2() { // 0xd7
    let localNum = this.codePool.getUint2(this.ip);
    Debug.instruction({local: localNum});
    this.stack.setLocal(localNum, new VmInt(0));
    this.ip += 2;
  }

  op_onelcl1() { // 0xda
    let localNum = this.codePool.getByte(this.ip);
    Debug.instruction({local: localNum});
    this.stack.setLocal(localNum, new VmInt(1));
    this.ip++;
  }

  op_onelcl2() { // 0xdb
    let localNum = this.codePool.getUint2(this.ip);
    Debug.instruction({local: localNum});
    this.stack.setLocal(localNum, new VmInt(1));
    this.ip += 2;
  }

  op_nillcl1() { // 0xd8
    let localNum = this.codePool.getByte(this.ip);
    Debug.instruction({local: localNum});
    this.stack.setLocal(localNum, new VmNil());
    this.ip++;
  }

  op_nillcl2() { // 0xd9
    let localNum = this.codePool.getUint2(this.ip);
    Debug.instruction( {local: localNum});
    this.stack.setLocal(localNum, new VmNil());
    this.ip += 2;
  }

  op_setlcl1() { // 0xe0
    let localNum = this.codePool.getByte(this.ip);
    Debug.instruction({local: localNum});
    let val = this.stack.pop();
    this.stack.setLocal(localNum, val);
    this.ip++;
  }

  op_setlcl2() { // 0xe1
    let localNum = this.codePool.getUint2(this.ip);
    Debug.instruction({local: localNum});
    let val = this.stack.pop();
    this.stack.setLocal(localNum, val);
    this.ip += 2;
  }

  op_setarg1() { // 0xe2 
    let argNum = this.codePool.getByte(this.ip);
    Debug.instruction({arg: argNum});
    let val = this.stack.pop();
    this.stack.setArg(argNum, val);
    this.ip++;
  }

  op_setarg2() { // 0xe3
    let argNum = this.codePool.getUint2(this.ip);
    Debug.instruction( {arg: argNum});
    let val = this.stack.pop();
    this.stack.setArg(argNum, val);
    this.ip += 2;
  }  

  op_setind() { // 0xe4
    Debug.instruction();
    let idx = this.stack.pop();
    let container = this.stack.pop();
    let val = this.stack.pop();
    let newlist = container.setind(idx, val);
    this.stack.push(newlist);
  }

  op_setprop() { // 0xe5
    let propID = this.codePool.getUint2(this.ip);
    Debug.instruction({ propID: propID });
    let obj = this.stack.pop();
    let val = this.stack.pop();
    if(!(obj instanceof VmObject)) throw('OBJ_VAL_REQD');
    obj.setprop(propID, val);
    this.ip += 2;
  }

  op_ptrsetprop() { // 0xe6
    let vmProp = this.stack.pop();
    Debug.instruction({ propID: vmProp });
    if(!(vmProp instanceof VmProp)) throw('PROPPTR_VAL_REQD');
    let obj = this.stack.pop();
    let val = this.stack.pop();
    if(!(obj instanceof VmObject)) throw('OBJ_VAL_REQD');
    obj.setprop(vmProp.value, val);
  }

  op_setpropself() { // 0xe7
    let propID = this.codePool.getUint2(this.ip);
    Debug.instruction({ propID: propID });
    let obj = this.stack.getSelf();
    let val = this.stack.pop();
    if(!(obj instanceof VmObject)) throw('OBJ_VAL_REQD');
    obj.setprop(propID, val);
    this.ip += 2;
  }

  op_objsetprop() { // 0xe8 
    let objID = this.codePool.getUint4(this.ip);
    let propID = this.codePool.getUint2(this.ip + 4);
    Debug.instruction({ propID: propID, objID: objID });
    let val = this.stack.pop();
    let obj = Heap.getObj(objID);
    obj.setprop(propID, val);
    this.ip + 6;
  }
  
  op_setself() { // 0xeb
    let vmVal = this.stack.pop();
    Debug.instruction({value: vmVal});
    if(!(vmVal instanceof VmNil) && !(vmVal instanceof VmObject)) throw('OBJ_VAL_REQD');
    this.stack.setSelf(vmVal);
  }

  op_loadctx() { // 0xec 
    Debug.instruction();
    let lst = this.stack.pop().unpack();
    this.stack.setSelf(lst[0]);
    this.stack.setTargetObject(lst[1]);
    this.stack.setDefiningObject(lst[2]);
    this.stack.setTargetProperty(lst[3]);
  }

  op_storectx() { // 0xed
    Debug.instruction();
    let lst = new VmList([this.stack.getSelf(), this.stack.getTargetObject(), this.stack.getDefiningObject(), this.stack.getTargetProperty()]);
    this.stack.push(lst);
  }

  op_setlcl1r0() { // 0xee 
    let localNum = this.codePool.getByte(this.ip);
    Debug.instruction({local: localNum});
    this.stack.setLocal(localNum, this.r0);
    this.ip++;
  }

  op_setindlcl1i8() { // 0xef
    let localNum = this.codePool.getByte(this.ip);
    let idx = this.codePool.getByte(this.ip + 1);
    Debug.instruction({local: localNum, idx: idx});
    this.ip += 2;
    let val = this.stack.pop();
    let container = this.stack.getLocal(localNum);
    let newlist = container.setind(new VmInt(idx), val);
    this.stack.setLocal(localNum, newlist);
  }

  imp_setind(container: VmData, idx: VmData, val: VmData) {
    return container.setind(idx, val);
  }

  op_bp() { //x 0f1
    Debug.instruction();
    // Breakpoint instruction is ignored.
    return ['BP'];
  }

  op_nop() { // 0xf2 
    Debug.instruction();
    return ['NOP'];
  }

  op_no_debug_support() {
    Debug.instruction();
    throw('DEBUG INSTRUCTIONS NOT SUPPORTED.');    
  }

}



