import { DataBlock } from './DataBlock'
import { SourceImage } from '../SourceImage';

/**
 * FNSD: Function Set Dependency List block.
 * 
 * Specifies the function sets that the program contained in the image file 
 * depends upon, and provides the mapping from function set index numbers (which 
 * the image file uses in byte code to invoke intrinsic functions) to the 
 * corresponding function entrypoint vectors in the VM. 
 * 
 * This implementation contains all functions set, so the FNSD isn't really
 * needed.
 */
class FNSD extends DataBlock {
  // This will contain the function sets that the program depends on,
  // e.g.
  // t3vm/010006
  // tads-gen/030008
  // tads-io/030007
  public sets: string[];

  constructor(image: SourceImage, offset: number) {
    super(image, offset);

    // Skip header
    offset += 10;

    // Read set count
    let count = image.getUInt16(offset); offset += 2;

    // Read name of each set and store it.
    for(let i = 0; i < count; i++) {
      let len = image.getUInt8(offset++);
      let name = '';
      for(let j = 0; j < len; j++) {
        name = name + String.fromCharCode(image.getUInt8(offset++));
      }
      this.sets.push(name);
    }
  }


  public toString() {
    return '[FNSD]';
  }
}

export { FNSD }