import { DataBlock } from './DataBlock'
import { SourceImage } from '../SourceImage'

class OBJS extends DataBlock {
  public numEntries: number;
  public metaclass: number;
  public isLarge: boolean;
  public isTransient: boolean;
  public objsOffset: number;
  public ids: number[];

  constructor(image: SourceImage, offset: number) {
    super(image, offset);
    this.numEntries = image.getUInt16(this.offset);
    this.metaclass = image.getUInt16(this.offset + 2);
    let flags = image.getUInt16(this.offset + 4);
    this.isLarge = (flags & 0x1) == 0x1;
    this.isTransient = (flags & 0x2) == 0x2;
    this.objsOffset = this.offset + 6;
  }

  load(image: SourceImage, callback: (id: number, metaclassID: number, dataOffset: number) => void) {
    let offset = this.offset + 6; // Skip numentries, metaclass, flags
    for(let i = 0; i < this.numEntries; i++) {
      let id = image.getUInt32(offset);
      let size = this.isLarge ? image.getUInt32(offset + 4) : image.getUInt16(offset + 4);
      offset += 4 + (this.isLarge ? 4 : 2);
      callback(id, this.metaclass, offset);
      offset += size;
    }
  }

  toString() {
    return '[OBJS] entries ' + this.numEntries.toString() + ' class ' + this.metaclass.toString();
  }
}

export { OBJS }