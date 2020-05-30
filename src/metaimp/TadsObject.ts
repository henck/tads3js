import { MetaclassRegistry } from '../metaclass/MetaclassRegistry'
import { RootObject } from '../metaclass/RootObject';
import { SourceImage } from '../SourceImage'
import { Pool } from '../Pool';
import { DataFactory, VmData, VmTrue, VmNil, VmObject, VmNativeCode, VmProp, VmList, VmDstring, VmSstring, VmCodeOffset, VmFuncPtr } from '../types';
import { Vm } from '../Vm';
import { Symbols } from '../Symbols';
import { IntrinsicClass } from './IntrinsicClass';

class TadsObject extends RootObject
{
  constructor(...args: any[]) {
    super();

    // If this is called with any arguments, then it's been called through bytecode.
    // The first argument is the superclass object.
    // The rest of the arguments are constructor arguments.
    if(args.length >= 1) {
      let superClass = args.shift();
      // Set the superclass.
      console.log("NEW superclass=", superClass.value);
      this.superClasses = [superClass.value];
      // Call constructor, if any:
      this.callConstructor(...args);
    }
  }

  public callConstructor(...args: VmData[]) {
    // We get the 'Constructor' symbol to find the number of the constructor property.
    let constructorProp: VmProp = Symbols.get('Constructor');
    // See if there is a constructor.
    let propLocation = this.findProp(constructorProp.value, false);
    if(propLocation) {
      // Call it:
      Vm.getInstance().runContext(
        propLocation.prop.value,                  // offset
        constructorProp,                          // property
        new VmObject(this.id),                    // targetObject
        new VmObject(propLocation.object.value),  // definingObject
        new VmObject(this.id),                    // selfObject
        new VmNil(),                              // Invokee
        ...args);
    }
  }

  static loadFromImage(image: SourceImage, dataPool: Pool, offset: number): RootObject {
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

  getValue() {
    return `superclasses=[${this.superClasses}]`;
  }

  getMethodByIndex(idx: number): VmNativeCode {
    switch(idx) {
      case 0: return new VmNativeCode(this.createInstance, 0, 0, true);
      case 1: return new VmNativeCode(this.createClone, 0);
      case 2: return new VmNativeCode(this.createTransientInstance, 0, 0, true);
      case 3: return new VmNativeCode(this.createInstanceOf, 0, 0, true);
      case 4: return new VmNativeCode(this.createTransientInstanceOf, 0, 0, true);
      case 5: return new VmNativeCode(this.setSuperclassList, 1);
      case 6: return new VmNativeCode(this.getMethod, 1);
      case 7: return new VmNativeCode(this.setMethod, 2);
    }
    return null;
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
    // Copy transient state:
    instance._isTransient = this._isTransient;
    return new VmObject(instance);
  }   

  /**
   * Creates a new instance of the target object. This method's arguments are 
   * passed directly to the constructor, if any, of the new object; this method 
   * doesn't make any other use of the arguments. The method creates the object,
   * invokes the new object's constructor, then returns the new object.
   * @param args 
   */
  protected createInstance(...args: VmData[]): VmObject {
    // Create a new TadsObject instance, using the current object's ID 
    // as the superclass.
    let instance = new TadsObject(new VmObject(this.id), ...args);
    return new VmObject(instance);
  }

  /**
   * Creates a new instance based on multiple superclasses. Each
   * superclass may be a list containing constructor arguments.
   * @param args Superclass list.
   * @returns new TadsObject instance
   */
  protected createInstanceOf(...args: VmData[]) : VmObject {
    // Create a new TadsObject with no superclasses:
    let instance = new TadsObject();
    instance.superClasses = [];

    // For each argument:
    args.forEach((arg) => {
      let arr = arg.unpack();
      // Is the argument a list?
      if(Array.isArray(arr)) {
        // Then the first element is a superclass, 
        instance.superClasses.push(arr[0].value);
        // and we call its constructor with the remaining elements:
        instance.callConstructor(...arr.slice(1));
      }
      // Not a list - just add element as superclass:
      else {
        instance.superClasses.push(arg.value);
      }
    });

    // Return new instance as an object:
    return new VmObject(instance);
  }

  protected createTransientInstance(...args: VmData[]): VmObject {
    let vmObj: VmObject = this.createInstance(...args);
    vmObj.getInstance().setTransient(true);
    return vmObj;
  }

  protected createTransientInstanceOf(...args: VmData[]) : VmObject {
    let vmObj: VmObject = this.createInstanceOf(...args);
    vmObj.getInstance().setTransient(true);
    return vmObj;    
  }

  /**
   * Gets a function pointer to one of the object's methods. 
   * @param vmProp Property to retrieve
   * @todo anonymous functions, floating methods...
   * @ignore "adv3" doesn't use this method.
   */
  protected getMethod(vmProp: VmProp): VmData {
    // Find prop on myself.
    let propFound = this.findProp(vmProp.value, false);
    // Not found? Return nil.
    if(!propFound) return new VmNil();
    let data = propFound.prop;

    // If it's a DSTRING, return it as an SSTRING:
    if(data instanceof VmDstring) return new VmSstring(data.value);
    
    // If it's a function, return it:
    if(data instanceof VmCodeOffset) return data;

    // Return nil.
    return new VmNil();
  }

  /**
   * Assigns the function func as a method of the object, using the property prop.
   * @param vmProp Property to assign function to
   * @param func Function to assign
   * @todo What to do with anonymous functions, methods, DynamicFunc?
   * @ignore Doesn't properly deal with anonymous methods, but then "adv3" doesn't even use "setMethod"
   */
  protected setMethod(vmProp: VmProp, func: VmData): VmData {
    // A function pointer becomes a code offset, so that is is callable.
    if(func instanceof VmFuncPtr) func = new VmCodeOffset(func.value);
    // A single-quoted string becomes a double-quoted string.
    if(func instanceof VmSstring) func = new VmDstring(func.value);

    // Set my property:
    this.setprop(vmProp.value, func);
    return new VmNil();
  }

  /**
   * Sets the object's superclasses to the values in lst.
   * @param vmClasses Class list
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



}

MetaclassRegistry.register('tads-object/030005', TadsObject);

export { TadsObject }