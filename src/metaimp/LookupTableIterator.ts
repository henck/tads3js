import { Iterator } from "./Iterator";
import { VmData, VmTrue, VmNil, VmInt } from "../types";
import { MetaclassRegistry } from "../metaclass/MetaclassRegistry";
import { RootObject } from "../metaclass/RootObject";
import { VmMap } from "./VmMap";
import { VmRuntimeError, VmErr } from '../VmErrors';

class LookupTableIterator extends Iterator {
  public index: number;
  // The table (live), or a snapshot of its contents.
  private source: RootObject | VmMap;

  /**
   * Create a new Iterator. 
   * @param iterable Iterable collection
   * @param source The table (for a live iterator), or a copy of its contents
   */
  constructor(source: RootObject | VmMap) {
    super();
    this.index = -1;
    this.source = source;
  }

  private get data(): VmMap {
    return this.source instanceof VmMap ? this.source : this.source.getValue();
  }

  private isValidIndex(index: number): boolean {
    return (index >= 0 && index < this.data.size());
  }  

  /*
   * Virtual methods - all private as they should not be called
   * directly by other code, only when a property is evaluated.
   */

  protected resetIterator(): VmData {
    this.beforeChange();
    this.index = -1;
    return new VmNil(); // Returned in R0
  }

  protected isNextAvailable(): VmData {
    return (this.isValidIndex(this.index + 1) ? new VmTrue() : new VmNil());
  }  

  protected getNext(): VmData {
    this.beforeChange();
    // Past the end, the reference VM reports "value is out of range", and
    // the iterator stays on the last item.
    if(!this.isValidIndex(this.index + 1)) throw new VmRuntimeError(VmErr.VALUE_OUT_OF_RANGE);
    this.index++;
    return this.data.values()[this.index];
  }  

  protected getCurKey(): VmData {
    if(!this.isValidIndex(this.index)) throw new VmRuntimeError(VmErr.VALUE_OUT_OF_RANGE);
    return this.data.keys()[this.index];
  }  

  protected getCurVal(): VmData {
    if(!this.isValidIndex(this.index)) throw new VmRuntimeError(VmErr.VALUE_OUT_OF_RANGE);
    return this.data.values()[this.index];
  }  
}

MetaclassRegistry.register('lookuptable-iterator/030000', LookupTableIterator);

export { LookupTableIterator }