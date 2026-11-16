import { DataBlock } from './DataBlock'
import { SourceImage } from '../SourceImage'

/**
 * MRES: multimedia resources (images, sounds, text files) embedded in the
 * image. An image may have several MRES blocks.
 */
class MRES extends DataBlock {
  public toString() {
    return '[MRES]';
  }

  /** The resources: name (as stored) -> [image offset, size]. */
  entries(image: SourceImage): { name: string, offset: number, size: number }[] {
    let list = [];
    let pos = this.offset;
    let count = image.getUInt16(pos); pos += 2;
    for(let i = 0; i < count; i++) {
      let offset = image.getUInt32(pos);
      let size = image.getUInt32(pos + 4);
      let len = image.getUInt8(pos + 8);
      pos += 9;
      // The name is stored with each byte inverted.
      let name = '';
      for(let j = 0; j < len; j++) name += String.fromCharCode(image.getUInt8(pos + j) ^ 0xFF);
      pos += len;
      // (offsets are relative to the start of the block's data)
      list.push({ name: name, offset: this.offset + offset, size: size });
    }
    return list;
  }
}

/**
 * The resources embedded in an image file's MRES blocks, without loading
 * the program: lower-case name -> location in the file.
 */
function readResources(data: Uint8Array): Map<string, { offset: number, size: number }> {
  let image = new SourceImage(data);
  let map = new Map<string, { offset: number, size: number }>();
  let pos = SourceImage.HEADER_SIZE;
  while(pos + 10 <= data.length) {
    let type = image.getString(pos, 4);
    let length = image.getUInt32(pos + 4);
    if(type == 'MRES') for(let r of new MRES(image, pos).entries(image)) map.set(r.name.toLowerCase(), r);
    if(type == 'EOF ') break;
    pos += 10 + length;
  }
  return map;
}

export { MRES, readResources }
