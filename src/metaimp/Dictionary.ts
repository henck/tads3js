import { Metaclass, TPropFunc } from '../metaclass/Metaclass';
import { MetaclassRegistry } from '../metaclass/MetaclassRegistry'

import { SourceImage } from "../SourceImage";
import { Pool } from "../Pool";
import { VmObject, VmData, VmProp, VmNil, VmTrue } from '../types';
import { List } from './List';
import { Vm } from '../Vm';
import { MetaString } from './MetaString';

class DictionaryEntry {
  public str: string;
  public propID: number;
  public objects: VmObject[];

  constructor(str: string, propID: number, objects?: VmObject[]) {
    this.str = str;
    this.propID = propID;
    this.objects = objects ?? [];
  }

  public compare(str: string, propID?: number) {
    if(this.str.toLowerCase() != str.toLowerCase()) return false;
    if(propID && this.propID != propID) return false;
    return true;
  }

  public hasObject(obj: VmObject): boolean {
    return !!this.objects.find((o) => o.value === obj.value);
  }

  public addObject(obj: VmObject) {
    this.objects.push(obj);
  }

  public removeObject(obj: VmObject) {
    this.objects = this.objects.filter((o) => o.value !== obj.value);
  }

  public isEmpty(): boolean {
    return this.objects.length == 0;
  }
}

export class Dictionary extends Metaclass {
  private value: DictionaryEntry[];

  constructor() {
    super();
    this.value = [];
  }

  static loadFromImage(image: SourceImage, dataPool: Pool, offset: number) {
    throw('Dictionary: Cannot load from image');
  }  

  getMethodByIndex(idx: number): TPropFunc {
    switch(idx) {
      case 0: return this.setComparator;
      case 1: return this.findWord;
      case 2: return this.addWord;
      case 3: return this.removeWord;
      case 4: return this.isWordDefined;
      case 5: return this.forEachWord;
    }
    return null;
  }  

  getValue() {
    return this.value;
  }

  get(str: string, propID: number): DictionaryEntry {
    // Is there an entry with (str, propID)? Then return it. 
    // Or undefined if not found.
    return this.value.find((entry) => entry.compare(str, propID));
  }

  /*
   * Virtual methods implementation
   */


  /*
   * Meta methods - all private as they should not be called
   * directly by other code, only when a property is evaluated.
   */

   addWord(vmObj: VmObject, vmStr: VmData, vocabProp: VmProp): VmData {
     let str = vmStr.unwrap();
     let propID = vocabProp.unwrap();

     // See if a string-prop-object combination already exists in the
     // Dictionary. If so, ignore the new word.
     let entry = this.get(str, propID);
     if(entry && entry.hasObject(vmObj)) return null;

     // Add or update the key in the Dictionary.
     if(!entry) {
       entry = new DictionaryEntry(str, propID, []);
       this.value.push(entry);
     }
     entry.addObject(vmObj);
     return null;
   }

   findWord(vmStr: VmData, vocabProp?: VmProp): VmObject {
    let str = vmStr.unwrap();
    let propID = vocabProp ? vocabProp.unwrap() : null;
    let matches: (VmObject|VmTrue)[] = [];

    this.value.forEach((entry: DictionaryEntry) => {
      // Does string match?
      if(entry.compare(str, propID)) {
        console.log("COMPARED MATCH");
        entry.objects.forEach((obj) => {
          console.log(obj);
          // Do not include object if already in matches
          let found = matches.find((o) => o.value == obj.value);
          if(!found) {
            // Add matching object
            matches.push(obj);
            // Add matchValues() return value (always true) 
            matches.push(new VmTrue());
          }
        });
      }
    });

    return new VmObject(new List(matches));
  }

  removeWord(vmObj: VmObject, vmStr: VmData, vocabProp: VmProp): VmData {
    let str = vmStr.unwrap();
    let propID = vocabProp ? vocabProp.unwrap() : null;

    // Remove object from all entries
    this.value.forEach((entry: DictionaryEntry) => {
      if(entry.compare(str, propID)) {
        entry.removeObject(vmObj);
      }
    });

    // Remove any empty entries:
    this.value = this.value.filter((entry: DictionaryEntry) => !entry.isEmpty());

    return null;
  }

  isWordDefined(vmStr: VmData): VmData {
    let str = vmStr.unwrap();
    return !!this.value.find((entry: DictionaryEntry) => entry.compare(str)) ? new VmTrue() : new VmNil();
  }

  setComparator(compObj: VmObject): VmData {
    return null;
  }

  forEachWord(vmFunc: VmData): VmData {
    this.value.forEach((entry:DictionaryEntry) => {
      entry.objects.forEach((obj) => {
        vmFunc.invoke(obj, new VmObject(new MetaString(entry.str)), new VmProp(entry.propID));
      });
    });
    return null;
  }
}

MetaclassRegistry.register('dictionary2/030001', Dictionary);