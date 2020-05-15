import { Metaclass, TPropFunc } from '../metaclass/Metaclass';
import { MetaclassRegistry } from '../metaclass/MetaclassRegistry'

import { SourceImage } from '../SourceImage'
import { Pool } from '../Pool';
import { DataFactory, VmData } from '../types';

export class TadsObject extends Metaclass
{
  private isClass: boolean;

  constructor() {
    super();
    this.isClass = false;
  }

  static loadFromImage(image: SourceImage, dataPool: Pool, offset: number) {
    let obj = new TadsObject();

    // Get # superclasses
    let numSuperclasses = image.getUInt16(offset); offset += 2;

    // Get # props
    let numProps = image.getUInt16(offset); offset += 2;

    // Read object flags
    let flags = image.getUInt16(offset + 4); offset += 2;
    //console.log('flags', flags);
    obj.isClass = (flags & 0x8) == 0x8;
    //console.log('isClass', obj.isClass ? 'true' : 'false' );

    // Load superclasses
    for(let i = 0; i < numSuperclasses; i++) {
      let superClassID = image.getUInt32(offset); offset += 4;
      //console.log("Superclass ID", superClassID);
      obj.superClasses.push(superClassID);
    }
    
    // Load props
    // (The first prop is a mysterious INT prop which overlaps an existing 
    // string prop. This data must not be a prop.)
    for(let i = 0; i < numProps; i++) {
      let propID = image.getUInt16(offset);
      let type = image.getUInt8(offset + 2);
      let propOffset = image.getUInt32(offset + 3);
      obj.props.set(propID, DataFactory.load(type, dataPool, propOffset));
      offset += 7;
    }

    // Dump props to console
    obj.props.forEach((value: VmData, key: number) => {
      //console.log("Prop ", key, 'value', value);
    });

    return obj;
  }

}

MetaclassRegistry.register('tads-object/030005', TadsObject);