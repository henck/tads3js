import { Iterator } from "./Iterator";
import { VmData, VmTrue, VmNil, VmInt } from "../types";
import { MetaclassRegistry } from "../metaclass/MetaclassRegistry";
import { VmMap } from "./VmMap";

export class LookupTableIterator extends Iterator {
  public index: number;
  public data: VmMap;

  /**
   * Create a new Iterator. 
   * @param iterable Iterable collection
   * @param data (Copy of) Collection data; caller is responsible for making copy if desired
   */
  constructor(data: VmMap) {
    super();
    this.index = null;
    this.data = data;
  }

  private hasValidIndex(): boolean {
    return (this.index != null && this.index >= 0 && this.index < this.data.size());
  }

  /*
   * Virtual methods - all private as they should not be called
   * directly by other code, only when a property is evaluated.
   */

  protected resetIterator(): VmData {
    this.index = null;
    return null; // Returned in R0
  }

  protected isNextAvailable(): VmData {
    if(this.index == null) this.index = 0;
    return this.hasValidIndex() ? new VmTrue() : new VmNil();
  }

  protected getNext(): VmData {
    if(this.index == null) this.index = 0;
    if(!this.hasValidIndex()) throw('Index out of bounds');
    return this.data.values()[this.index++];
  }

  protected getCurKey(): VmData {
    if(!this.hasValidIndex()) throw('Index out of bounds');
    return new VmInt(this.index);
  }

  protected getCurVal(): VmData {
    if(!this.hasValidIndex()) throw('Index out of bounds');
    return this.data.values()[this.index];
  }

}

MetaclassRegistry.register('lookuptable-iterator/030000', LookupTableIterator);