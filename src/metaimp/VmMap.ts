import { VmData, VmNil } from "../types";

export class VmMap {
  private _keys: VmData[];
  private _values: VmData[];

  constructor(keys: VmData[], values: VmData[]) {
    this._keys = keys;
    this._values = values;
  }

  public clone(): VmMap {
    return new VmMap(this._keys.slice(), this._values.slice());
  }

  public indexOf(key: VmData) {
    return this._keys.findIndex((k) => k.eq(key));
  }

  public set(key: VmData, value: VmData) {
    // See if key already exist.
    let index = this.indexOf(key);
    // If it exists, replace it.
    if(index >= 0) {
      this._keys[index] = key;
      this._values[index] = value;
    } 
    // If it does not exist, add it.
    else {
      this._keys.push(key);
      this._values.push(value);
    }
  }

  public has(key: VmData) {
    let index = this.indexOf(key);
    return index >= 0;
  }

  public get(key: VmData): VmData {
    let index = this.indexOf(key);
    return index >= 0 ? this._values[index] : null;
  }

  public delete(key: VmData): VmData {
    let index = this.indexOf(key);
    if (index >= 0) {
      let value = this._values[index];
      this._keys.splice(index, 1);
      this._values.splice(index, 1);
      return value;
    } else {
      return new VmNil();
    }
  }

  public size(): number {
    return this._keys.length;
  }

  public keys() {
    return this._keys.slice();
  }

  public values() {
    return this._values.slice();
  }
}
