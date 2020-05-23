import { MetaclassRegistry } from '../metaclass/MetaclassRegistry'

import { VmData, VmFuncPtr, VmObject, VmNativeCode } from "../types";
import { Vm } from '../Vm';
import { Vector } from './Vector';
import { IFuncInfo } from '../IFuncInfo';
import { VmType } from '../types/VmType';

class AnonFunc extends Vector {
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

  getType() {
    // TODO: An anonymous function can be represented as either TypeFuncPtr or TypeObject. 
    // This depends on whether or not the function refers to any of the local variables from 
    // the enclosing scope where the function is defined. (This includes self and the other 
    // method context pseudo-variables.) If the anonymous function does refer to any variables 
    // from the enclosing scope, it's represented as an object, which contains the context 
    // information tying the function to the local scope in effect when the function was created. 
    // If the function doesn't reference anything in its enclosing scope, no context information 
    // is required, so the function is represented as a simple static function pointer. 
    return VmType.OBJ;
  }

  getMethodByIndex(idx: number): VmNativeCode {
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
   
  funcinfo(): IFuncInfo {
    return Vm.getInstance().getFuncInfo(this.funcptr.value);
  }  

  /*
   * Meta methods - all private as they should not be called
   * directly by other code, only when a property is evaluated.
   */
}

MetaclassRegistry.register('anon-func-ptr/000000', AnonFunc);

export { AnonFunc }