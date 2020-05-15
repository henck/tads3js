import { MetaclassRegistry, IMetaclass } from "./MetaclassRegistry";
import { SourceImage } from "../SourceImage";
import { Pool } from "../Pool";
import { AnonFunc, BigNumber, ByteArray, IntrinsicClass, List, RexPattern, MetaString, 
         StringBuffer, TadsObject, Vector, LookupTable, Dictionary } from "../metaimp";

class MetaclassFactory {
  //
  // Create an instance of the metaclass with the specified ID.
  // The metaclassID field of the instance is set to the metaclass ID for later reference.
  // The contructor is called with the arguments provided.
  // 
  public static create(id: number, ...args: any[]) {
    let klass = MetaclassFactory.getClass(id);
    let instance = new (klass as any)(...args);
    instance.metaclassID = (klass as any).metaclassID;
    return instance;
  }

  public static load(id: number, image: SourceImage, dataPool: Pool, dataOffset: number) {
    let klass = MetaclassFactory.getClass(id);
    if(!klass) return null;
    let instance = (klass as any).loadFromImage(image, dataPool, dataOffset)
    instance.metaclassID = (klass as any).metaclassID;
    return instance;
  }

  //
  // Given a Metaclass ID, return its implementation class,
  // or null if no implementation exists.
  // 
  private static getClass(id: number) {
    let metaclass: IMetaclass = MetaclassRegistry.classes[id];
    if(!metaclass) return null;

    switch(metaclass.name) {
      case 'bignumber/030001': return BigNumber;
      case 'bytearray/030002': return ByteArray;
      case 'intrinsic-class/030001':return IntrinsicClass;
      case 'list/030008': return List;
      case 'regex-pattern/030000': return RexPattern;
      case 'string/030008': return MetaString;
      case 'stringbuffer/030000':  return StringBuffer;
      case 'tads-object/030005': return TadsObject;
      case 'vector/030005': return Vector;
      case 'lookuptable/030003': return LookupTable;
      case 'dictionary2/030001': return Dictionary;
      case 'anon-func-ptr/000000': return AnonFunc;
      default:
        console.error('MetaclassFactory.getClass: Unknown metaclass ID ' + id.toString() + ': ' + metaclass.name);
        return null;
    }
  }    
}

export { MetaclassFactory }