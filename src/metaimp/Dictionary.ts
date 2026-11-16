import { RootObject } from '../metaclass/RootObject';
import { MetaclassRegistry } from '../metaclass/MetaclassRegistry'

import { SourceImage } from "../SourceImage";
import { Pool } from "../Pool";
import { VmObject, VmData, VmProp, VmNil, VmTrue, VmSstring, VmInt, VmNativeCode, VmList } from '../types';
import { List } from './List';
import { editDistance } from '../util/EditDistance';
import { StringComparator } from './StringComparator';
import { UTF8 } from '../utf8';
import { Symbols } from '../Symbols';
import { Vm } from '../Vm';

/**
 * One word association: a string, a vocabulary property, and an object.
 */
interface IAssociation {
  str: string;
  propID: number;
  obj: VmObject;
}

// The index is stored under a Symbol, so undo snapshots, saving and the
// garbage collector don't see it.
const INDEX = Symbol('index');

/**
 * Index of the associations by a key that strings which can match share:
 * the string itself without a comparator, or a StringComparator's hash.
 * (With another kind of comparator there's no index.)
 */
interface IIndex {
  associations: IAssociation[];   // (the index is for this array, with this length)
  length: number;
  comparator: VmData;
  buckets: Map<string | number, IAssociation[]>;
}

class Dictionary extends RootObject {
  private associations: IAssociation[];
  // Comparator object, or nil for exact matching.
  private comparator: VmData;

  // new Dictionary() or new Dictionary(comparator)
  constructor(comparator?: VmData) {
    super();
    this.associations = [];
    this.comparator = comparator ?? new VmNil();
  }

  static loadFromImage(image: SourceImage, dataPool: Pool, offset: number): RootObject {
    let dict = new Dictionary();

    // Read comparator object ID (0 for none).
    let comparatorObjID = image.getUInt32(offset); offset += 4;
    if(comparatorObjID != 0) dict.comparator = new VmObject(comparatorObjID);

    // Read entry count:
    let entryCount = image.getUInt16(offset); offset += 2;

    // For each entry:
    for(let i = 0; i < entryCount; i++) {
      // Read the obfuscated key string
      let len = image.getUInt8(offset); offset++;
      let bytes = [];
      for(let j = 0; j < len; j++) {
        bytes.push(image.getUInt8(offset++) ^ 0xbd);
      }
      let key = UTF8.decode(bytes);

      // Read subentries:
      let subEntryCount = image.getUInt16(offset); offset += 2;
      for(let j = 0; j < subEntryCount; j++) {
        let objID = image.getUInt32(offset); offset += 4;
        let propID = image.getUInt16(offset); offset += 2;
        dict.addAssociation(key, propID, new VmObject(objID));
      }
    }

    return dict;
  }

  getMethodByIndex(idx: number): VmNativeCode {
    switch(idx) {
      case 0: return new VmNativeCode("Dictionary.setComparator", this.setComparator, 1);
      case 1: return new VmNativeCode("Dictionary.findWord", this.findWord, 1, 1);
      case 2: return new VmNativeCode("Dictionary.addWord", this.addWord, 3);
      case 3: return new VmNativeCode("Dictionary.removeWord", this.removeWord, 3);
      case 4: return new VmNativeCode("Dictionary.isWordDefined", this.isWordDefined, 1);
      case 5: return new VmNativeCode("Dictionary.forEachWord", this.forEachWord, 1);
      case 6: return new VmNativeCode("Dictionary.correctSpelling", this.correctSpelling, 2);
    }
    return null;
  }

  getValue() {
    return this.associations;
  }

  /**
   * Add an association, unless exactly the same one already exists.
   */
  private addAssociation(str: string, propID: number, obj: VmObject) {
    this.beforeChange();
    let index = this.index();
    let exists = this.candidates(str).some((a) =>
      a.str === str && a.propID == propID && a.obj.value === obj.value);
    if(exists) return;
    let a = { str: str, propID: propID, obj: obj };
    this.associations.push(a);
    // Keep the index up to date.
    if(index) {
      let key = this.keyOf(str);
      let bucket = index.buckets.get(key);
      if(bucket) bucket.push(a); else index.buckets.set(key, [a]);
      index.length = this.associations.length;
    }
  }

  /** The comparator, if it's a StringComparator (which we can call directly). */
  private stringComparator(): StringComparator {
    if(!(this.comparator instanceof VmObject)) return null;
    let c = this.comparator.getInstance();
    return c instanceof StringComparator ? c : null;
  }

  /** The index key for a string, or undefined if there's no index. */
  private keyOf(str: string): string | number {
    if(this.comparator instanceof VmNil) return str;
    let c = this.stringComparator();
    return c ? c.hash(str) : undefined;
  }

  /** The index (rebuilt if it's out of date), or null if there can't be one. */
  private index(): IIndex {
    if(this.keyOf('') === undefined) return null;
    let index: IIndex = (this as any)[INDEX];
    if(!index || index.associations !== this.associations || index.length != this.associations.length
       || index.comparator !== this.comparator) {
      index = { associations: this.associations, length: this.associations.length, comparator: this.comparator, buckets: new Map() };
      for(let a of this.associations) {
        let key = this.keyOf(a.str);
        let bucket = index.buckets.get(key);
        if(bucket) bucket.push(a); else index.buckets.set(key, [a]);
      }
      (this as any)[INDEX] = index;
    }
    return index;
  }

  /** The associations that might match a string (in the order they were added). */
  private candidates(str: string): IAssociation[] {
    let index = this.index();
    if(!index) return this.associations;
    return index.buckets.get(this.keyOf(str)) ?? [];
  }

  /**
   * Match an input string against a dictionary string using the
   * comparator. Without a comparator, strings must match exactly and
   * the match value is 1.
   * @returns The comparator's match value, or null for no match
   */
  public match(input: string, dictStr: string): VmData {
    if(this.comparator instanceof VmNil) {
      return input === dictStr ? new VmInt(1) : null;
    }
    let c = this.stringComparator();
    if(c) {
      let m = c.match(input, dictStr);
      return m ? new VmInt(m) : null;
    }
    let res = Vm.getInstance().callMethod(this.comparator,
      Symbols.get('IfcComparator.matchValues') as VmProp,
      new VmSstring(input), new VmSstring(dictStr));
    return res.isTruthy() ? res : null;
  }

  /** The properties under which a string is defined (matching with the comparator). */
  public propsFor(input: string): Set<number> {
    let props = new Set<number>();
    for(let a of this.candidates(input)) {
      if(!props.has(a.propID) && this.match(input, a.str)) props.add(a.propID);
    }
    return props;
  }

  /** Add a word (for native code). */
  public addWordFor(obj: VmObject, str: string, propID: number) {
    this.addAssociation(str, propID, obj);
  }

  /** Remove a word (for native code). */
  public removeWordFor(obj: VmObject, str: string, propID: number) {
    this.beforeChange();
    this.associations = this.associations.filter((a) => !(a.str === str && a.propID == propID && a.obj.value === obj.value));
  }

  /**
   * Get the strings from a string or list-like argument.
   */
  private static strings(vmStr: VmData): string[] {
    let val = vmStr.unpack(); // native string, or array if list-like
    let items: VmData[] = Array.isArray(val) ? val : [vmStr];
    return items.map((x) => x.unpack()).filter((s) => typeof(s) === 'string');
  }

  /*
   * Meta methods - all private as they should not be called
   * directly by other code, only when a property is evaluated.
   */

  /**
  * Add an object to the dictionary with the given string and property key.
  * @param vmObj Object
  * @param vmStr String, or list-like collection of strings
  * @param vocabProp Property
  * @returns nil
  */
  private addWord(vmObj: VmObject, vmStr: VmData, vocabProp: VmProp): VmData {
    Dictionary.strings(vmStr).forEach((s) => this.addAssociation(s, vocabProp.unpack(), vmObj));
    return new VmNil();
  }

  /**
   * Search the dictionary for the given string and (optional) property.
   * @param vmStr String to look for
   * @param vocabProp Property to look for, or nil/omitted for any property
   * @returns List of [obj, matchValue, obj, matchValue, ...], with an
   * entry for each matching association
   */
  private findWord(vmStr: VmData, vocabProp?: VmData): VmData {
    let str = vmStr.unpack();
    let propID = (vocabProp instanceof VmProp) ? vocabProp.unpack() : null;
    let result: VmData[] = [];
    this.candidates(str).forEach((a) => {
      if(propID !== null && a.propID != propID) return;
      let m = this.match(str, a.str);
      if(m) result.push(a.obj, m);
    });
    return new VmList(result);
  }

  /**
   * Removes the association between the object and the given string
   * (or each string in a list) and property.
   * @param vmObj Object
   * @param vmStr String, or list of strings
   * @param vocabProp Property
   * @returns nil
   */
  private removeWord(vmObj: VmObject, vmStr: VmData, vocabProp: VmProp): VmData {
    this.beforeChange();
    let propID = vocabProp.unpack();
    let strs = Dictionary.strings(vmStr);
    this.associations = this.associations.filter((a) =>
      !(strs.includes(a.str) && a.propID == propID && a.obj.value === vmObj.value));
    return new VmNil();
  }

  /**
   * Determines whether the string matches any word in the dictionary.
   * @param vmStr String to look for
   * @returns true or nil
   */
  private isWordDefined(vmStr: VmData): VmData {
    let str = vmStr.unpack();
    return this.candidates(str).some((a) => this.match(str, a.str)) ? new VmTrue() : new VmNil();
  }

  /**
   * Set the comparator object (nil for exact matching).
   * @param compObj Comparator object
   * @returns nil
   */
  private setComparator(compObj: VmData): VmData {
    this.beforeChange();
    this.comparator = compObj;
    return new VmNil();
  }

  /**
   * Invokes the callback function on each word association in the dictionary.
   * @param vmFunc Callback function (obj, string, prop)
   * @returns nil
   */
  private forEachWord(vmFunc: VmData): VmData {
    // Iterate over a copy, in case the callback changes the dictionary.
    this.associations.slice().forEach((a) => {
      vmFunc.invoke(a.obj, new VmSstring(a.str), new VmProp(a.propID));
    });
    return new VmNil();
  }

  /**
   * Returns a list of the dictionary words that are possible spelling
   * corrections for the given string: those within the given edit
   * distance, not counting an exact match.
   * @param vmStr string
   * @param vmMaxEditDistance maximum edit distance
   * @returns List of [word, dist, repl] lists, where dist is the edit
   * distance and repl the number of character replacements
   *
   * With a StringComparator, its approximations (case folding, truncation,
   * and single-character equivalence mappings) are not counted as edits.
   * Other comparators are ignored, as in the reference VM.
   */
  private correctSpelling(vmStr: VmData, vmMaxEditDistance: VmInt): VmData {
    let str = vmStr.unpack();
    let maxDist = vmMaxEditDistance.unpack();

    let comp = (this.comparator instanceof VmObject) ? this.comparator.getInstance() : null;
    let eq: (x: string, y: string) => boolean = undefined;
    let minPrefix = 0;
    if(comp instanceof StringComparator) {
      const sc = comp;
      eq = (x, y) => sc.charEquals(x, y);
      minPrefix = sc.getTruncLen();
    }

    // Unique dictionary words:
    let words = [...new Set(this.associations.map((a) => a.str))];

    let result = words
      .map((word) => ({ word: word, ...editDistance(str, word, eq, minPrefix) }))
      .filter((c) => c.dist > 0 && c.dist <= maxDist)
      .map((c) => new VmList([new VmSstring(c.word), new VmInt(c.dist), new VmInt(c.repl)]));

    return new VmList(result);
  }
}


MetaclassRegistry.register('dictionary2/030000', Dictionary);
MetaclassRegistry.register('dictionary2/030001', Dictionary);

export { Dictionary }
