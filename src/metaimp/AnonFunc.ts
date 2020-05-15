import { Metaclass, TPropFunc } from '../metaclass/Metaclass';
import { MetaclassRegistry } from '../metaclass/MetaclassRegistry'

import { VmData, VmInt, VmFuncPtr, VmObject } from "../types";
import { SourceImage } from "../SourceImage";
import { Pool } from "../Pool";
import { Vm } from '../Vm';
import { Vector } from './Vector';



export class AnonFunc extends Vector {
  private funcptr: VmFuncPtr;

  constructor(...args: VmData[]) {
    super();
    if(args.length < 1) throw('WRONG NUMBER OF ARGUMENTS');
    this.funcptr = args[0];
    // AnonFunc is a descendant of Vector. Place all arguments inside
    // the vector (including the function pointer).
    for(let i = 0; i < args.length; i++) {
      this.value.push(args[i]);
    }
  }

  getMethodByIndex(idx: number): TPropFunc {
    switch(idx) {
    }
    return null;
  }  

  /*
   * Virtual methods implementation
   */
  
  invoke(...args: VmData[]): VmData {
    return Vm.getInstance().runContext(this.funcptr.value, new VmObject(this), ...args);
  }
   

  /*
   * Meta methods - all private as they should not be called
   * directly by other code, only when a property is evaluated.
   */
}

MetaclassRegistry.register('anon-func-ptr/000000', AnonFunc);