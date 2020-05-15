class SourceImage {
  public static HEADER_SIZE = 69;

  private buffer: ArrayBuffer = null;
  private view: Uint8Array = null;
  
  constructor(buffer: Buffer) {
    // buffer can be either a Buffer or an ArrayBuffer
    // If a Buffer, convert it to ArrayBuffer first.
    this.buffer = this.toArrayBuffer(buffer);

    // Create a byteview on the ArrayBuffer:
    this.view = new Uint8Array(this.buffer);
  }

  toArrayBuffer(buf: Buffer) {
    var ab = new ArrayBuffer(buf.length);
    var view = new Uint8Array(ab);
    for (var i = 0; i < buf.length; ++i) {
        view[i] = buf[i];
    }
    return ab;
  }  

  length() {
    return this.view.byteLength;
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