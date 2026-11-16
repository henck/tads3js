class SourceImage {
  public static HEADER_SIZE = 69;

  private view: Uint8Array = null;

  constructor(data: Uint8Array) {
    this.view = data;
  }

  length() {
    return this.view.byteLength;
  }

  /** A UTF-8 encoded string. */
  getUTF8String(offset: number, len: number): string {
    return new TextDecoder().decode(this.view.subarray(offset, offset + len));
  }

  /** A part of the image (not a copy). */
  getBytes(offset: number, len: number): Uint8Array {
    return this.view.subarray(offset, offset + len);
  }

  getString(offset: number, len: number) {
    let str = '';
    for(let i = 0; i < len; i++) {
      str = str + String.fromCharCode(this.view[offset++]);
    }
    return str;
  }

  getUInt8(offset: number) {
    return this.view[offset];
  }

  getInt8(offset: number) {
    let val = this.getUInt8(offset);
    if((val >> 7) == 1) return val - 256;
    return val;
  }

  getUInt16(offset: number) {
    return this.view[offset] + (this.view[offset+1] << 8);
  }

  getInt16(offset: number) {
    let val = this.getUInt16(offset);
    if((val >> 15) == 1) return val - 65536;
    return val;
  }

  getUInt32(offset: number) {
    return this.view[offset] + (this.view[offset+1] << 8) + (this.view[offset+2] << 16) + (this.view[offset+3] << 24);
  }

  getInt32(offset: number) {
    let val = this.getUInt32(offset);
    if((val >> 31) == 1) return val - 4294967296;
    return val;       
  }

  loadBlockHeader(offset: number) {
    let blocktype = this.getString(offset, 4);
    let length = this.getUInt32(offset + 4);
    let mandatory = this.getUInt16(offset + 8);
    return {
      type: blocktype,
      length: length,
      mandatory: mandatory
    }
  }
}

export { SourceImage }