import { Iterator } from "./Iterator";
import { VmData, VmTrue, VmNil, VmInt } from "../types";
import { MetaclassRegistry } from "../metaclass/MetaclassRegistry";
import { VmMap } from "./VmMap";

class LookupTableIterator extends Iterator {
  public index: number;
  public data: VmMap;

  /**
   * Create a new Iterator. 
   * @param iterable Iterable collection
   * @param data (Copy of) Collection data; caller is responsible for making copy if desired
   */
  constructor(data: VmMap) {
    super();
    this.index = -1;
    this.data = data;
  }

  private isValidIndex(index: number): boolean {
    return (index >= 0 && index < this.data.size());
  }  

  /*
   * Virtual methods - all private as they should not be called
   * directly by other code, only when a property is evaluated.
   */

  protected resetIterator(): VmData {
    this.index = -1;
    return new VmNil(); // Returned in R0
  }

  protected isNextAvailable(): VmData {
    return (this.isValidIndex(this.index + 1) ? new VmTrue() : new VmNil());
  }  

  protected getNext(): VmData {
    this.index++;
    if(!this.isValidIndex(this.index)) throw('Index out of bounds');
    return this.data.values()[this.index];
  }  

  protected getCurKey(): VmData {
    if(!this.isValidIndex(this.index)) throw('Index out of bounds');
    return new VmInt(this.index);
  }  

  protected getCurVal(): VmData {
    if(!this.isValidIndex(this.index)) throw('Index out of bounds');
    return this.data.values()[this.index];
  }  
}

MetaclassRegistry.register('lookuptable-iterator/030000', LookupTableIterator);

export { LookupTableIterator }