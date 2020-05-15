export abstract class VmData {
  public value: any;

  constructor(value: any) {
    this.value = value;
  }

  getName() {
    return '(type not set)';
  }

  //
  // Helper methods
  //

  /**
   * Returns true if data is falsy. Nil is falsy, as is int=0.
   */
  isFalsy(): boolean {
    return false;
  }
  
  /**
   * Returns true is data is truthy. Nil is falsy, as it int=0.
   */
  isTruthy(): boolean {
    return !this.isFalsy();
  }

  /**
   * Retrieve native value from data. 
   */
  unwrap(): any {
    return this.value;
  }

  //
  // Operations
  //

  neg(): VmData {
    throw('NUM_VAL_REQD');
  }
  
  bnot(): VmData {
    throw('BAD_TYPE_BNOT');
  }

  add(data: VmData): VmData {
    throw('BAD_TYPE_ADD');
  }

  sub(data: VmData): VmData {
    throw('BAD_TYPE_SUB'); 
  }

  mul(data: VmData): VmData {
    throw('BAD_TYPE_MUL');    
  }

  band(data: VmData): VmData {
    throw('BAD_TYPE_BAND');
  }

  bor(data: VmData): VmData {
    throw('BAD_TYPE_BOR');
  }
  
  shl(data: VmData): VmData {
    throw('BAD_TYPE_SHL');
  }

  ashr(data: VmData): VmData {
    throw('BAD_TYPE_ASHR');
  }  

  xor(data: VmData): VmData {
    throw('BAD_TYPE_XOR');
  }  
  
  lshr(data: VmData): VmData {
    throw('BAD_TYPE_LSHR');
  }    

  div(data: VmData): VmData {
    throw('BAD_TYPE_DIV');
  }

  mod(data: VmData): VmData {
    throw('BAD_TYPE_MOD');
  }

  not(): VmData {
    throw('NO_LOG_CONV');
  }

  boolize(): VmData {
    throw('NO_LOG_CONV');
  }

  eq(data: VmData): boolean {
    return false;
  }

  ne(data: VmData): boolean {
    return !this.eq(data);
  }

  lt(data: VmData): boolean {
    throw('INVALID_COMPARISON');
  }

  getind(index: VmData): VmData {
    throw('CANNOT_INDEX_TYPE');
  }  

  setind(index: VmData, data: VmData): VmData {
    throw('CANNOT_INDEX_TYPE');
  }

  invoke(...args: VmData[]): VmData {
    throw('CANNOT_INVOKE');
  }
}
