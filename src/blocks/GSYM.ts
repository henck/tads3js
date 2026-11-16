import { DataBlock } from './DataBlock'
import { SourceImage } from '../SourceImage'

/**
 * GSYM: Global Symbol Table block, present in images compiled for
 * debugging (t3make -d). We use it only for diagnostics: names for
 * objects, properties and functions.
 */
class GSYM extends DataBlock {
  public toString() {
    return '[GSYM]';
  }

  /** Read the symbols. */
  load(image: SourceImage) {
    let names = { objects: new Map<number, string>(), props: new Map<number, string>(), funcs: new Map<number, string>() };
    let offset = this.offset;
    let count = image.getUInt32(offset); offset += 4;
    for(let i = 0; i < count; i++) {
      let nameLen = image.getUInt16(offset);
      let extraLen = image.getUInt16(offset + 2);
      let type = image.getUInt16(offset + 4);
      let name = image.getUTF8String(offset + 6, nameLen);
      let extra = offset + 6 + nameLen;
      switch(type) {
        case 1: names.funcs.set(image.getUInt32(extra), name); break;
        case 2: names.objects.set(image.getUInt32(extra), name); break;
        case 3: names.props.set(image.getUInt16(extra), name); break;
      }
      offset = extra + extraLen;
    }
    return names;
  }
}

export { GSYM }
