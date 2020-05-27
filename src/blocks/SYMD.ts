import { DataBlock } from './DataBlock'
import { SourceImage } from '../SourceImage'
import { DataFactory, VmData } from '../types';
import { Pool } from '../Pool';

class SYMD extends DataBlock {
  constructor(image: SourceImage, offset: number) {
    super(image, offset);
  }

  /**
   * Read symbols from image, calling a callback with name and value
   * for each symbol found.
   * @param image Source image
   * @param dataPool Data pool, for value loading
   * @param callback Callback
   */
  public processEntries(image: SourceImage, dataPool: Pool, callback: (name: string, value: VmData) => void): void {
    // Read number of entries
    let numEntries = image.getUInt16(this.offset);
    let pos = this.offset + 2;
    // Read all entries:
    for(let i = 0; i < numEntries; i++) {
      // Dataholder type
      let type = image.getUInt8(pos); pos += 1;
      // Dataholder offset
      let offset = image.getUInt32(pos); pos += 4;
      // Load value from datapool
      let value = DataFactory.load(type, dataPool, offset);
      // Load symbol name
      let len = image.getUInt8(pos); pos += 1;
      let name = '';
      for(let j = 0; j < len; j++) {
        name = name + String.fromCharCode(image.getUInt8(pos++));
      }
      callback(name, value);
    }
  }

  public toString() {
    return '[SYMD]';
  }
}

export { SYMD }