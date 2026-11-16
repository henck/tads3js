import { SourceImage } from "./SourceImage";
import { DataFactory } from "./types";
import { CPDF } from "./blocks/CPDF";
import { CPPG } from "./blocks/CPPG";
import { UTF8 } from "./utf8";

export class Pool {
  private image: SourceImage;
  private cpdf: CPDF;
  private pages: CPPG[];

  // The whole pool, unmasked, in one array (reads are frequent: every
  // instruction and operand is read from the code pool).
  private bytes: Uint8Array;
  // Strings decoded so far, by offset.
  private strings = new Map<number, string>();

  constructor(image: SourceImage, cpdf: CPDF, pages: CPPG[]) {
    this.image = image;
    this.cpdf = cpdf;
    this.pages = pages;
    this.bytes = new Uint8Array(cpdf.size * pages.length);
    pages.forEach((pg, i) => {
      if(!pg) return;
      let n = Math.min(cpdf.size, pg.length - 7);
      for(let k = 0; k < n; k++) this.bytes[i * cpdf.size + k] = pg.getByte(image, k);
    });
  }

  getByte(offset: number): number {
    return this.bytes[offset];
  }

  // Read an sbyte from a page:
  getSbyte(offset: number): number {
    let val = this.getByte(offset);
    if((val >> 7) == 1) return val - 256;
    return val;
  }

  // Read an Uint16 from a page:
  getUint2(offset: number): number {
    let b = this.bytes;
    return b[offset] + (b[offset + 1] << 8);
  }

  // Read an Int16 from a page:
  getInt2(offset: number): number {
    let val = this.getUint2(offset);
    if((val >> 15) == 1) return val - 65536;
    return val;
  }

  // Read an Uint32 from a page:
  getUint4(offset: number): number {
    let b = this.bytes;
    return b[offset] + (b[offset + 1] << 8) + (b[offset + 2] << 16) + (b[offset + 3] << 24);
  }

  // Read an Int32 from a page:
  getInt4(offset: number): number {
    let val = this.getUint4(offset);
    if((val >> 31) == 1) return val - 4294967296;
    return val;    
  }

  // Read a string from a page:
  getString(offset: number): string {
    let cached = this.strings.get(offset);
    if(cached !== undefined) return cached;
    let str = this.readString(offset);
    this.strings.set(offset, str);
    return str;
  }

  private readString(offset: number): string {
    let len = this.getUint2(offset);
    let bytes: number[] = [];
    for(let i = 0; i < len; i++) {
      bytes.push(this.getByte(offset + 2 + i));
    }
    return UTF8.decode(bytes);
  }

  // Read a list from a page:
  getList(offset: number): any[] {
    // Read list length:
    let len = this.getUint2(offset);
    // Read list elements:
    let lst = [];
    for(let i = 0; i < len; i++) {
      let type = this.getByte(offset + 2 + i * 5);
      let offsetOrValue = this.getUint4(offset + 2 + i * 5 + 1);
      lst.push(DataFactory.load(type, this, offsetOrValue));
    }
    return lst;
  }  
}
