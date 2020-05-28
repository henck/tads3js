import { MetaclassRegistry } from '../metaclass/MetaclassRegistry'
import { RootObject } from '../metaclass/RootObject';
import { SourceImage } from '../SourceImage'
import { Pool } from '../Pool';
import { DataFactory, VmData, VmTrue, VmNil, VmObject, VmNativeCode, VmProp, VmList } from '../types';
import { Vm } from '../Vm';
import { Symbols } from '../Symbols';
import { Heap } from '../Heap';
import { IntrinsicClass } from './IntrinsicClass';

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
      let constructorProp: VmProp = Symbols.get('Constructor');
      let propLocation = this.findProp(constructorProp.value, false);
      if(propLocation) {
        Vm.getInstance().runContext(propLocation.prop.value, constructorProp, new VmObject(this), new VmObject(this), new VmObject(this), new VmNil(), ...args.slice(1));
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

    //console.log('TADS OBJECT', 'superclasses', numSuperclasses, 'flags', flags, 'props', obj.props);

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

  /**
   * Returns a list containing the immediate superclasses of the object. 
   * A TadsObject implements this by looking at its superClasses array.
   */
  protected getSuperclassList(): VmData {
    return new VmList(this.superClasses.map((sc) => new VmObject(sc)));
  }  

  /*
   * Meta methods - all private as they should not be called
   * directly by other code, only when a property is evaluated.
   */

   protected setSuperclassList(vmClasses: VmData): VmData {
     let lst = vmClasses.unpack();
     // Check that argument is a list
     if(!Array.isArray(lst)) throw('setSuperclassList: list expected');
     // Check that list contains only VmObject instances
     if(lst.find((x) => !(x instanceof VmObject))) throw('setSuperclassList: List must contain objects');
     let objs: VmObject[] = lst;

     // Special case: list may be [TadsObject]
     if(objs.length == 1 && objs[0].getInstance() instanceof IntrinsicClass) {
       let obj = objs[0].unpack();
       if(obj == TadsObject) {
         this.superClasses = [];
         return new VmNil();
       }
     }

     // Verify that all list elements are TadsObject instances:
     if (objs.find((x) => !(x.getInstance() instanceof TadsObject))) throw('setSuperclassList: Only TadsObject instances allowed.');

     // Create list of object IDs:
     this.superClasses = objs.map((x) => x.value);
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