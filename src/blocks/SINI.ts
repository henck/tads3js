import { DataBlock } from './DataBlock'
import { SourceImage } from '../SourceImage';

/**
 * SINI: Static initializers
 * 
 */
class SINI extends DataBlock {
  constructor(image: SourceImage, offset: number) {
    super(image, offset);

    // Skip header
    offset += 10;

    let header_size = image.getUInt32(offset); offset += 4;
    let static_code_offset = image.getUInt32(offset); offset += 4;
    let initializer_count = image.getUInt32(offset); offset += 4;

    // Skip future header fields
    offset = this.offset + 10 + header_size;

    // console.log(header_size, static_code_offset, initializer_count);
    if(initializer_count > 0) console.error("WARNING WARNING WARNING: There are static initializers.");

    // TODO: Execute static initializers
  }


  public toString() {
    return '[SINI]';
  }
}

export { SINI }