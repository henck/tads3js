import { RootObject, TPropFunc } from '../metaclass/RootObject';
import { MetaclassRegistry } from '../metaclass/MetaclassRegistry'

import { SourceImage } from "../SourceImage";
import { Pool } from "../Pool";
import { VmObject, VmData, VmProp, VmNil, VmTrue, VmList, VmSstring, VmInt } from '../types';
import { List } from './List';
import { MetaString } from './MetaString';
import { levenshtein } from '../util/Levenshtein';


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

class Dictionary extends RootObject {
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
      case 6: return this.correctSpelling;
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

  /**
  * Add an object to the dictionary with the given string and property key.
  * @param vmObj Object
  * @param vmStr String, or list-like collection of strings
  * @param vocabProp Property
  * @returns null
  */
  addWord(vmObj: VmObject, vmStr: VmData, vocabProp: VmProp): VmData {
    let propID = vocabProp.unpack();
    let words = vmStr.unpack(); // should be native string or array if list-like
    if (!Array.isArray(words)) words = [vmStr]; // if not list-like, make array

    // Add the words, one by one:
    words.forEach((vmWord: VmData): void => {
      let word = vmWord.unpack();
      if(typeof(word) === 'string') {
        // See if a string-prop-object combination already exists in the
        // Dictionary. If so, ignore the new word.
        let entry = this.get(word, propID);
        if(entry && entry.hasObject(vmObj)) return null;

        // Add or update the key in the Dictionary. 
        if(!entry) {
          entry = new DictionaryEntry(word, propID, []);
          this.value.push(entry);
        }
        entry.addObject(vmObj);
      }
    });

    return null;
  }

  /**
   * Search the dictionary for the given string and property ID. 
   * Returns a list giving all of the matching objects.
   * @param vmStr String to look for
   * @param vocabProp Propery to look for
   * @returns List of matching objects
   */
  findWord(vmStr: VmData, vocabProp?: VmProp): VmObject {
    let str = vmStr.unpack();
    let propID = vocabProp ? vocabProp.unpack() : null;
    let matches: (VmObject|VmTrue)[] = [];

    this.value.forEach((entry: DictionaryEntry) => {
      // Does string match?
      if(entry.compare(str, propID)) {
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

  /**
   * Removes from the dictionary the object's association with the given 
   * string and property ID key.
   * @param vmObj Object
   * @param vmStr String, or list of strings
   * @param vocabProp Property
   * @returns null
   */
  removeWord(vmObj: VmObject, vmStr: VmData, vocabProp: VmProp): VmData {
    let propID = vocabProp ? vocabProp.unpack() : null;

    let words = vmStr.unpack(); // should be native string or array if list-like
    if (!Array.isArray(words)) words = [vmStr]; // if not list-like, make array

    // Remove the words, one by one:
    words.forEach((vmWord: VmData): void => {
      let word = vmWord.unpack();
      if(typeof(word) === 'string') {
        // Remove object from all entries
        this.value.forEach((entry: DictionaryEntry) => {
          if(entry.compare(word, propID)) {
            entry.removeObject(vmObj);
          }
        });
      }
    });

    // Remove any empty entries:
    this.value = this.value.filter((entry: DictionaryEntry) => !entry.isEmpty());

    return null;
  }

  /**
   * Searches the dictionary for the given string and determines if it's associated 
   * with any objects.
   * @param vmStr String to look for
   * @returns true or nil
   */
  isWordDefined(vmStr: VmData): VmData {
    let str = vmStr.unpack();
    return !!this.value.find((entry: DictionaryEntry) => entry.compare(str)) ? new VmTrue() : new VmNil();
  }

  /**
   * Set the comparator object.
   * @param compObj Comparator object
   */
  setComparator(compObj: VmObject): VmData {
    throw 'NOT IMPLEMENTED';
    return null;
  }

  /**
   * Invokes the callback function on each word association in the dictionary.
   * @param vmFunc Callback function (obj, string, prop)
   */
  forEachWord(vmFunc: VmData): VmData {
    this.value.forEach((entry:DictionaryEntry) => {
      entry.objects.forEach((obj) => {
        vmFunc.invoke(obj, new VmObject(new MetaString(entry.str)), new VmProp(entry.propID));
      });
    });
    return null;
  }

  /**
   * Returns a list of words in the dictionary that are
   * possible spelling corrections for the given string. 
   * @param vmStr string
   * @param vmMaxEditDistance max Levenshtein distance
   * @returns List of lists, with each item [word, dist, repl],
   * where dist = Levenshtein distance, and repl 
   * should be replacements (but it currently also Levenshtein
   * distance).
   */
  correctSpelling(vmStr: VmData, vmMaxEditDistance: VmInt): VmObject {
    let str = vmStr.unpack();
    let maxDist = vmMaxEditDistance.unpack();

    // Get all words in dictionary (removing duplicates):
    let words = [...new Set(this.value.map((entry: DictionaryEntry) => entry.str))];

    // Calculate distances:
    let distances = words.map((word: string) => {
      let dist = levenshtein(word, str);
      return [word, dist, dist];
    })

    // Remove words with distance > maxdist
    .filter((d) => d[1] <= maxDist)

    // Turn all distances into List objects
    .map((d) => new VmObject(new List(d)));

    return new VmObject(new List(distances));
  }
}


MetaclassRegistry.register('dictionary2/030001', Dictionary);

export { Dictionary }