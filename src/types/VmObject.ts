import { VmData } from "./VmData";
import { VmNil } from "./VmNil";
import { Heap } from "../Heap";
import { Metaclass } from "../metaclass/Metaclass";

export class VmObject extends VmData {
  constructor(value: number | Metaclass) {
    super(value);
  }

  getName() {
    return 'obj';
  }

  //
  // - If a MetaString or StringBuffer, return its string value
  // - Otherwise, return object instance
  // 
  unwrap(): any {
    let obj = this.getInstance();
    if(obj.constructor.name == 'MetaString') return obj.getValue();
    if(obj.constructor.name == 'StringBuffer') return obj.getValue();
    return obj;
  }  

  unpack(): any {
    let obj = this.getInstance();
    return obj.unpack();
  }

  getInstance(): Metaclass {
    // If this VmObject  stores a reference to a Metaclass
    // instance, just return it.
    if(this.value instanceof Metaclass) return this.value;

    // Otherwise, this VmObject stores the ID of and object on
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
}