import { SourceImage } from "../SourceImage";
import { MCLD } from "../blocks";
import { Debug } from "../Debug";

// In our metaclass implementation register, we keep a list
// of name/implementation class tuples.
interface IRegister {
  name: string;
  klass: any;
}

// In our registry, we keep a list of metaclass entries.
// Each entry has a name, a list of propsIDs, and 
// a reference to the implementing class.
interface IMetaclass {
  name: string;
  props: number[];
  implementationClass?: any;
}

class MetaclassRegistry {
  public static registration: IRegister[] = [];
  public static classes: IMetaclass[] = [];

  // 
  // Every metaclass will have registered itself with MetaclassFactory
  // using 'register'. Here, we parse the MCLD, getting metaclass IDs
  // and names. We match these names to the registered names, storing
  // a metaclass ID on the metaclass implementations as static fields,
  // and storing a reference to the metaclass implementation.
  // 
  public static parseMCLD(image: SourceImage, mcld: MCLD): void {
    MetaclassRegistry.classes = [];
    let unregistered: string[] = [];
    for(let i = 0; i < mcld.numEntries; i++) {
      // Create a metaclass entry in our list.
      let metaclass: IMetaclass = mcld.getEntry(image, i);
      MetaclassRegistry.classes.push(metaclass);
      // See if the metaclass implementation registered itself with this name.
      let reg: IRegister = MetaclassRegistry.registration.find((x) => x.name == metaclass.name);
      // If registered, store the metaclass ID on the implementation,
      // and keep a reference to the implementation.
      // Debug.info("Register metaclass", "metaclassID", i, "name", metaclass.name);
      if(reg) {
        reg.klass.metaclassID = i;
        metaclass.implementationClass = reg.klass;
        // Debug.info("Register metaclass", "metaclassID", i, "name", metaclass.name);
      } 
      // No metaclass implementation has registered itself for this name.
      // TODO: This is a fatal error.
      else {
        unregistered.push(metaclass.name);
      }
    }
    if(unregistered.length > 0) {
      Debug.info("Unregistered metaclasses: " + unregistered.join(', '));
    }
  }

  //
  // Metaclass implementation must register themselves with the MetaclassRegistry
  // using this method. They provide a name, e.g. "tads-object/030005", and
  // their implementation class, e.g. TadsObject.
  //
  public static register(name: string, klass: any): void {
    // Skip registration if already registered during a previous Vm run:
    if(MetaclassRegistry.registration.find((x) => x.name == 'name')) return;

    MetaclassRegistry.registration.push({
      name: name,
      klass: klass
    });
  }

  // 
  // Get the name of a Metaclass by index.
  // 
  public static indexToName(id: number) {
    let name = MetaclassRegistry.classes[id].name;
    return name;
  }  

  // 
  // Convert a propID to a metaprop index.
  // If no metaprop with this propID exists on the given metaclass, return null.
  //
  public static getMetaIndex(metaclassID: number, propID: number) {
    let index = MetaclassRegistry.classes[metaclassID].props.indexOf(propID);
    return index == -1 ? null : index;
  }  

  /**
   * Return a reference to the implementation class of a metaclass ID.
   * @param metaclassID Metaclass ID
   * @returns Class reference
   */
  public static getClass(metaclassID: number): any {
    return MetaclassRegistry.classes[metaclassID].implementationClass;
  }
}

export { IMetaclass, MetaclassRegistry }