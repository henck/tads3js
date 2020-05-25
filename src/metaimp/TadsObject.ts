import { MetaclassRegistry } from '../metaclass/MetaclassRegistry'
import { RootObject } from '../metaclass/RootObject';
import { SourceImage } from '../SourceImage'
import { Pool } from '../Pool';
import { DataFactory, VmData, VmTrue, VmNil, VmObject, VmNativeCode } from '../types';
import { Vm } from '../Vm';

class TadsObject extends RootObject
{
  private _isClass: boolean;

  constructor(...args: any[]) {
    // 1st arg = superclass
    // other args: constructor arguments

    super();

    // If this is called with any arguments, then it's been called through bytecode.
    // The first argument is the superclass object.
    // The rest of the arguments are constructor arguments.
    // The constructor is always property #1 (if one exists).
    if(args.length >= 1) {
      // Set the superclass.
      console.log("NEW superclass=", args[0].value);
      this.superClasses = [args[0].value];
      // See if there is a constructor.
      let propLocation = this.findProp(1);
      if(propLocation) {
        Vm.getInstance().runContext(propLocation.prop.value, new VmObject(this), new VmNil(), ...args.slice(1));
      }
    }

    this._isClass = false;
  }

  static loadFromImage(image: SourceImage, dataPool: Pool, offset: number) {
    let obj = new TadsObject();

    // Get # superclasses
    let numSuperclasses = image.getUInt16(offset); offset += 2;

    // Get # props
    let numProps = image.getUInt16(offset); offset += 2;

    // Read object flags
    let flags = image.getUInt16(offset); offset += 2;
    obj._isClass = (flags & 0x1) == 0x1;

    // Load superclasses
    for(let i = 0; i < numSuperclasses; i++) {
      let superClassID = image.getUInt32(offset); offset += 4;
      // console.log("Superclass ID", superClassID);
      obj.superClasses.push(superClassID);
    }
    
    // Load props
    // (The first prop is a mysterious INT prop which overlaps an existing 
    // string prop. This data must not be a prop.)
    for(let i = 0; i < numProps; i++) {
      let propID = image.getUInt16(offset);
      let type = image.getUInt8(offset + 2);
      let propOffset = image.getUInt32(offset + 3);
      // console.log('prop',  DataFactory.load(type, dataPool, propOffset));
      obj.props.set(propID, DataFactory.load(type, dataPool, propOffset));
      offset += 7;
    }

    console.log('TADS OBJECT', 'superclasses', numSuperclasses, 'flags', flags, 'props', obj.props);

    return obj;
  }

  getMethodByIndex(idx: number): VmNativeCode {
    switch(idx) {
      case 1: return new VmNativeCode(this.createClone, 0);
      case 5: return new VmNativeCode(this.setSuperclassList, 1);
    }
    return null;
  }    

  protected isClass(): VmData {
    return this._isClass ? new VmTrue() : new VmNil();
  }


  /*
   * Meta methods - all private as they should not be called
   * directly by other code, only when a property is evaluated.
   */

   protected setSuperclassList(vmClasses: VmData): VmData {
     let lst = vmClasses.unpack();
     this.superClasses = lst.map((vmObj: VmObject) => vmObj.getInstance().id);
     return new VmNil();
   }

   /**
    * Creates a new object that is an identical copy of this object.
    * @returns TadsObject instance
    */
   protected createClone(): VmData {
     let instance = new TadsObject();
     instance._isClass = this._isClass;
     // Copy superclass list:
     instance.superClasses = this.superClasses.slice();
     // Copy properties map:
     instance.props = new Map(this.props);
     return new VmObject(instance);
   }



}

MetaclassRegistry.register('tads-object/030005', TadsObject);

export { TadsObject }