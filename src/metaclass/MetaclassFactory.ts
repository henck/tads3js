import { MetaclassRegistry, IMetaclass } from "./MetaclassRegistry";
import { SourceImage } from "../SourceImage";
import { Pool } from "../Pool";
import { RootObject } from "./RootObject";
import { AnonFunc, BigNumber, ByteArray, IntrinsicClass, List, RexPattern, MetaString, 
         StringBuffer, TadsObject, IntrinsicClassModifier, Vector, LookupTable, Dictionary, GrammarProd, File, StringComparator } from "../metaimp";

class MetaclassFactory {
  //
  // Create an instance of the metaclass with the specified ID.
  // The contructor is called with the arguments provided.
  // 
  public static create(metaclassID: number, ...args: any[]): RootObject {
    let klass = MetaclassFactory.getClass(metaclassID);
    let instance = new (klass as any)(...args);
    return instance;
  }

  public static load(metaclassID: number, image: SourceImage, dataPool: Pool, dataOffset: number, size: number): RootObject {
    let klass = MetaclassFactory.getClass(metaclassID);
    if(!klass) return null;
    let instance = (klass as any).loadFromImage(image, dataPool, dataOffset, size);
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
      case 'bignumber/000000': return BigNumber;
      case 'bytearray/030002': return ByteArray;
      case 'intrinsic-class/030001':return IntrinsicClass;
      case 'list/030008': return List;
      case 'regex-pattern/030000': return RexPattern;
      case 'string/030008': return MetaString;
      case 'stringbuffer/030000':  return StringBuffer;
      case 'tads-object/030005': return TadsObject;
      case 'int-class-mod/030000': return IntrinsicClassModifier;
      case 'vector/030005': return Vector;
      case 'lookuptable/030003': return LookupTable;
      case 'dictionary2/030000': return Dictionary;
      case 'dictionary2/030001': return Dictionary;
      case 'anon-func-ptr/000000': return AnonFunc;
      case 'root-object/030004': return RootObject;
      case 'grammar-production/030002': return GrammarProd;
      case 'file/030003': return File;
      case 'string-comparator/030000': return StringComparator;
      default:
        console.error('MetaclassFactory.getClass: Unknown metaclass ID ' + id.toString() + ': ' + metaclass.name);
        return null;
    }
  }    
}

export { MetaclassFactory }