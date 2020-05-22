import { VmData } from "./VmData";
import { VmNil } from "./VmNil";
import { Heap } from "../Heap";
import { Metaclass } from "../metaclass/Metaclass";
import { IFuncInfo } from "../IFuncInfo";

export class VmObject extends VmData {
  constructor(value: number | Metaclass) {
    super(value);
  }

  getName() {
    return 'obj';
  }

  unpack(): any {
    let obj = this.getInstance();
    return obj.unpack();
  }

  getInstance(): Metaclass {
    // If this VmObject stores a reference to a Metaclass
    // instance, just return it.
    if(this.value instanceof Metaclass) return this.value;

    // Otherwise, this VmObject stores the ID of an object on
    // the heap. Look it up and return it.
    return Heap.getObj(this.value);
  }

  not() {
    return new VmNil();
  }

  neg(): VmData {
    let obj: Metaclass = this.getInstance();
    return obj.negate();
  }

  add(data: VmData): VmData {
    let obj: Metaclass = this.getInstance();
    return obj.add(data);
  }

  sub(data: VmData): VmData {
    let obj: Metaclass = this.getInstance();
    return obj.subtract(data);
  }

  eq(data: VmData): boolean {
    let obj: Metaclass = this.getInstance();
    return obj.equals(data);
  }

  lt(data: VmData): boolean {
    let obj: Metaclass = this.getInstance();
    return obj.compare(data);
  }

  getind(vmIndex: VmData): VmData {
    let obj: Metaclass = this.getInstance();
    return obj.getindex(vmIndex);
  }

  setind(vmIndex: VmData, data: VmData): VmObject {
    let obj: Metaclass = this.getInstance();
    return obj.setindex(vmIndex, data);
  }

  invoke(...args: VmData[]): VmData {
    let obj: Metaclass = this.getInstance();
    return obj.invoke(...args);
  }

  funcinfo(): IFuncInfo {
    let obj: Metaclass = this.getInstance();
    return obj.funcinfo();
  }  

  toStr(radix?: number, isSigned?: boolean): string {
    let obj: Metaclass = this.getInstance();
    // Does class implement toStr? Then use it.
    if((obj as any).toStr) return (obj as any).toStr(radix, isSigned);
    return `object#${this.value}`;
  }
}