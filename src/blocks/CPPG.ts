import { DataBlock } from './DataBlock'
import { SourceImage } from '../SourceImage'
import { PoolType } from './CPDF';

class CPPG extends DataBlock {
  public identifier: PoolType;
  public index: number;
  public mask: number;

  constructor(image: SourceImage, offset: number) {
    super(image, offset);
    this.identifier = image.getUInt16(offset + 10) == 1 ? 'code' : 'data';
    this.index = image.getUInt32(offset + 12);
    this.mask = image.getUInt8(offset + 16);
  }

  getByte(image: SourceImage, pageOffset: number): number {
    // 7 is CPPG block header
    let byte = image.getUInt8(this.offset + 7 + pageOffset) ^ this.mask;
    return byte;
  }

  toString() {
    return '[CPPG] length ' + this.length.toString() + ' id ' + this.identifier.toString() + ', index ' + this.index.toString() + ', mask ' + this.mask.toString();
  }
}

export { CPPG }