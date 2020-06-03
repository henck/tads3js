import { VmData } from "./VmData";
import { VmNil } from "./VmNil";
import { Heap } from "../Heap";
import { IFuncInfo } from "../IFuncInfo";
import { RootObject } from "../metaclass/RootObject";
import { Symbols, TSymbol } from "../Symbols";
import { Vm } from "../Vm";

export class VmObject extends VmData {
  constructor(value: number | RootObject) {
    if(value instanceof RootObject) {
      super(value.id);
    } else {
      super(value);
    }
  }

  getName() {
    return 'obj';
  }

  getType() {
    let obj = this.getInstance();
    return obj.getType();
  }

  unpack(): any {
    let obj = this.getInstance();
    return obj.unpack();
  }

  getInstance(): RootObject {
    // If this VmObject stores a reference to a Metaclass
    // instance, just return it.
    if(this.value instanceof RootObject) return this.value;

    // Otherwise, this VmObject stores the ID of an object on
    // the heap. Look it up and return it.
    return Heap.getObj(this.value);
  }

  // Operator overloading: call property by symbol.
  private overload(symbol: TSymbol, ...args: VmData[]) {
    let propInfo = Vm.getInstance().getprop(this, Symbols.get(symbol), false);
    if(!propInfo) return null;
    return Vm.getInstance().runContext(propInfo.data.value, propInfo.data, 
      this, this, this, new VmNil(), ...args);    
  }

  // Operators

  not() {
    return new VmNil();
  }

  /**
   * Call object's virtual "negate" method. If not available,
   * try operator overloading.
   */
  neg(): VmData {
    let obj: RootObject = this.getInstance();
    let res = obj.negate();
    if(res === null) res = this.overload('operator negate');
    if(res === null) throw('NUM_VAL_REQD');
    return res;
  }

  /**
   * Try operator overloading.
   * (There is no "bnot" virtual method.)
   */
  bnot() {
    let res = this.overload('operator ~');
    if(res === null) throw('BAD_TYPE_BNOT');
    return res;    
  }

  /**
   * Call object's virtual "add" method. If not available,
   * try operator overloading.
   */
  add(data: VmData): VmData {
    let obj: RootObject = this.getInstance();
    let res = obj.add(data);
    if(res === null) res = this.overload('operator +', data);
    if(res === null) throw('BAD_TYPE_ADD');
    return res;
  }

  /**
   * Call object's virtual "subtract" method. If not available,
   * try operator overloading.
   */  
  sub(data: VmData): VmData {
    let obj: RootObject = this.getInstance();
    let res = obj.subtract(data);
    if(res === null) res = this.overload('operator -', data);
    if(res === null) throw('BAD_TYPE_SUB');
    return res;
  }

  /**
   * Try operator overloading.
   * (There is no virtual "multiply" method).
   */  
  mul(data: VmData): VmData {
    let res = this.overload('operator *', data);
    if(res === null) throw('BAD_TYPE_MUL');
    return res;
  }

  /**
   * Try operator overloading.
   * (There is no virtual "band" method).
   */  
  band(data: VmData): VmData {
    let res = this.overload('operator &', data);
    if(res === null) throw('BAD_TYPE_BAND');
    return res;
  }

  /**
   * Try operator overloading.
   * (There is no virtual "bor" method).
   */  
  bor(data: VmData): VmData {
    let res = this.overload('operator |', data);
    if(res === null) throw('BAD_TYPE_BOR');
    return res;
  }  

  /**
   * Try operator overloading.
   * (There is no virtual "shl" method).
   */  
  shl(data: VmData): VmData {
    let res = this.overload('operator <<', data);
    if(res === null) throw('BAD_TYPE_SHL');
    return res;
  }    

  /**
   * Try operator overloading.
   * (There is no virtual "ashr" method).
   */  
  ashr(data: VmData): VmData {
    let res = this.overload('operator >>', data);
    if(res === null) throw('BAD_TYPE_ASHR');
    return res;
  }      

  /**
   * Try operator overloading.
   * (There is no virtual "xor" method).
   */  
  xor(data: VmData): VmData {
    let res = this.overload('operator ^', data);
    if(res === null) throw('BAD_TYPE_XOR');
    return res;
  }      

  /**
   * Try operator overloading.
   * (There is no virtual "lshr" method).
   */  
  lshr(data: VmData): VmData {
    let res = this.overload('operator >>>', data);
    if(res === null) throw('BAD_TYPE_LSHR');
    return res;
  }      

  /**
   * Try operator overloading.
   * (There is no virtual "div" method).
   */  
  div(data: VmData): VmData {
    let res = this.overload('operator /', data);
    if(res === null) throw('BAD_TYPE_DIV');
    return res;
  }        

  /**
   * Try operator overloading.
   * (There is no virtual "mod" method).
   */  
  mod(data: VmData): VmData {
    let res = this.overload('operator %', data);
    if(res === null) throw('BAD_TYPE_MOD');
    return res;
  }        

  eq(data: VmData, depth?: number): boolean {
    let obj: RootObject = this.getInstance();
    return obj.equals(data, depth);
  }

  lt(data: VmData): boolean {
    let obj: RootObject = this.getInstance();
    return obj.compare(data);
  }

  getind(vmIndex: VmData): VmData {
    let obj: RootObject = this.getInstance();
    let res = obj.getindex(vmIndex);
    if(res === null) res = this.overload('operator []', vmIndex);
    if(res === null) throw('CANNOT_INDEX_TYPE');
    return res;
  }

  setind(vmIndex: VmData, data: VmData): VmData {
    let obj: RootObject = this.getInstance();
    let res = obj.setindex(vmIndex, data);
    if(res === null) res = this.overload('operator []=', vmIndex, data);
    if(res === null) throw('CANNOT_INDEX_TYPE');
    return res;    
  }

  setprop(propID: number, data: VmData) {
    let obj: RootObject = this.getInstance();
    obj.setprop(propID, data);
  }

  invoke(...args: VmData[]): VmData {
    let obj: RootObject = this.getInstance();
    return obj.invoke(...args);
  }

  funcinfo(): IFuncInfo {
    let obj: RootObject = this.getInstance();
    return obj.funcinfo();
  }  

  toStr(radix?: number, isSigned?: boolean): string {
    let obj: RootObject = this.getInstance();
    return obj.toStr(radix, isSigned);
  }
}