import { DataBlock } from './DataBlock'
import { SourceImage } from '../SourceImage'

type PoolType = 'code' | 'data';

class CPDF extends DataBlock {
  public identifier: PoolType;
  public pages: number;       // Number of pages in pool
  public size: number;        // Size in bytes of each page

  constructor(image: SourceImage, offset: number) {
    super(image, offset);
    this.identifier = image.getUInt16(offset + 10) == 1 ? 'code' : 'data';
    this.pages = image.getUInt32(offset + 12);
    this.size = image.getUInt32(offset + 16);
  }

  getPage(offset: number) {
    let page = Math.floor(offset / this.size);
    let pageOffset = offset % this.size;    
    return { page, pageOffset };
  }

  toString() {
    return '[CPDF] id ' + this.identifier.toString() + ', pages ' + this.pages.toString() + ', size ' + this.size.toString();
  }
}

export { CPDF, PoolType }