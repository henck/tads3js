import { VmData } from "./VmData";
import { VmNil } from "./VmNil";
import { Heap } from "../Heap";
import { IFuncInfo } from "../IFuncInfo";
import { RootObject } from "../metaclass/RootObject";
import { VmProp } from "./VmProp";

export class VmObject extends VmData {
  constructor(value: number | RootObject) {
    super(value);
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

  // Operators

  not() {
    return new VmNil();
  }

  neg(): VmData {
    let obj: RootObject = this.getInstance();
    return obj.negate();
  }

  add(data: VmData): VmData {
    let obj: RootObject = this.getInstance();
    return obj.add(data);
  }

  sub(data: VmData): VmData {
    let obj: RootObject = this.getInstance();
    return obj.subtract(data);
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
    return obj.getindex(vmIndex);
  }

  setind(vmIndex: VmData, data: VmData): VmObject {
    let obj: RootObject = this.getInstance();
    return obj.setindex(vmIndex, data);
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
    // Does class implement toStr? Then use it.
    if((obj as any).toStr) return (obj as any).toStr(radix, isSigned);
    return `object#${this.value}`;
  }
}