import { SourceImage } from "./SourceImage";
import { DataFactory } from "./types";
import { CPDF } from "./blocks/CPDF";
import { CPPG } from "./blocks/CPPG";
import { UTF8 } from "./utf8";

export class Pool {
  private image: SourceImage;
  private cpdf: CPDF;
  private pages: CPPG[];

  constructor(image: SourceImage, cpdf: CPDF, pages: CPPG[]) {
    this.image = image;
    this.cpdf = cpdf;
    this.pages = pages;
  }

  getByte(offset: number): number {
    let { page, pageOffset } = this.cpdf.getPage(offset);
    let thePage = this.pages[page];
    return thePage.getByte(this.image, pageOffset);
  }

  // Read an sbyte from a page:
  getSbyte(offset: number): number {
    let val = this.getByte(offset);
    if((val >> 7) == 1) return val - 256;
    return val;
  }

  // Read an Uint16 from a page:
  getUint2(offset: number): number {
    return  this.getByte(offset) 
         + (this.getByte(offset+1) << 8);
  }

  // Read an Int16 from a page:
  getInt2(offset: number): number {
    let val = this.getUint2(offset);
    if((val >> 15) == 1) return val - 65536;
    return val;
  }

  // Read an Uint32 from a page:
  getUint4(offset: number): number {
    return  this.getByte(offset) 
         + (this.getByte(offset+1) << 8)
         + (this.getByte(offset+2) << 16)
         + (this.getByte(offset+3) << 32);
  }

  // Read an Int32 from a page:
  getInt4(offset: number): number {
    let val = this.getUint4(offset);
    if((val >> 31) == 1) return val - 4294967296;
    return val;    
  }

  // Read a string from a page:
  getString(offset: number): string {
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
