import { Iterator } from "./Iterator";
import { VmData, VmTrue, VmNil, VmInt } from "../types";
import { MetaclassRegistry } from "../metaclass/MetaclassRegistry";
import { RootObject } from "../metaclass/RootObject";
import { VmRuntimeError, VmErr } from '../VmErrors';

class IndexedIterator extends Iterator {
  public index: number;
  // The collection (live), or a snapshot of its elements.
  private source: RootObject | VmData[];
  // Number of elements to iterate over, fixed at creation.
  private length: number;

  /**
   * Create a new Iterator. 
   * @param source The collection (for a live iterator), or a snapshot of its elements
   * @param length Number of elements to iterate over
   */
  constructor(source: RootObject | VmData[], length: number) {
    super();
    this.index = -1;
    this.source = source;
    this.length = length;
  }

  private data(): VmData[] {
    return Array.isArray(this.source) ? this.source : this.source.getValue();
  }

  private isValidIndex(index: number): boolean {
    return (index >= 0 && index < this.length && index < this.data().length);
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
    return (this.index + 1 < this.length ? new VmTrue() : new VmNil());
  }

  protected getNext(): VmData {
    this.beforeChange();
    // Past the end, the reference VM reports "value is out of range", and
    // the iterator stays on the last item.
    if(!this.isValidIndex(this.index + 1)) throw new VmRuntimeError(VmErr.VALUE_OUT_OF_RANGE);
    this.index++;
    return this.data()[this.index];
  }

  protected getCurKey(): VmData {
    if(!this.isValidIndex(this.index)) throw new VmRuntimeError(VmErr.VALUE_OUT_OF_RANGE);
    return new VmInt(this.index + 1); // T3 indices are 1-based
  }

  protected getCurVal(): VmData {
    if(!this.isValidIndex(this.index)) throw new VmRuntimeError(VmErr.VALUE_OUT_OF_RANGE);
    return this.data()[this.index];
  }
}

MetaclassRegistry.register('indexed-iterator/030000', IndexedIterator);

export { IndexedIterator }