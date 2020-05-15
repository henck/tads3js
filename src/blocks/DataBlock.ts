import { SourceImage } from '../SourceImage'

export class DataBlock {
  public length: number;
  public mandatory: boolean;
  public offset: number;      // Image offset of block's data (after the header)

  constructor(image: SourceImage, offset: number) {
    this.length = image.getUInt32(offset + 4);
    this.mandatory = image.getUInt16(offset + 8) == 1;
    this.offset = offset + 10;
  }

  toString(): string {
    return null;
  }
}