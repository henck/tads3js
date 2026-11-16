import { DataBlock } from './DataBlock'
import { SourceImage } from '../SourceImage'

class MCLD extends DataBlock {
  public numEntries: number;

  constructor(image: SourceImage, offset: number) {
    super(image, offset);
    this.numEntries = image.getUInt16(offset + 10);
  }

  /*
   * Retrieve metaclass dependency with specified index
   * from the image.
   */
  getEntry(image: SourceImage, idx: number): { name: string, props: number[] } {
    let offset = this.offset + 2; // Skip number of entries
    // Skip entries:
    while(idx-- > 0) {
      let offsetToNext = image.getUInt16(offset);
      offset += offsetToNext;
    }
    // Read entry:
    image.getUInt16(offset);                     offset += 2; // Skip offset to next
    let nameLen = image.getUInt8(offset);        offset += 1;
    let name = image.getString(offset, nameLen); offset += nameLen;
    let numProps = image.getUInt16(offset);      offset += 2;
    let propSize = image.getUInt16(offset);      offset += 2;
    let props = [];
    for(let i = 0; i < numProps; i++) {
      props.push(image.getUInt16(offset));
      offset += 2;
    }
    return {
      name: name,
      props: props
    }
  }

  /* 
   * List all metaclass dependencies in the image, with
   * their names and list of property IDs.
   */
  dump(image: SourceImage) {
    for(let i = 0; i < this.numEntries; i++) {
      let entry = this.getEntry(image, i);
      console.log('Metaclass', i, ':', entry.name, 'props', '[' + entry.props.join(',') + ']');
    }
  }

  toString() {
    return '[MCLD] entries ' + this.numEntries.toString();
  }
}

export { MCLD }