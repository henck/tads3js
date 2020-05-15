export class UTF8 {
  //
  // Decode an array of bytes containing UTF-8 codepoints
  // into an UTF-16 (JavaScript) string.
  // 
  static decode(bytes: number[]) {
    let pos = 0;
    let str = '';
    while(pos < bytes.length) {
      let value = bytes[pos];
      if((value & 0xe0) == 0xe0) {
        value = ((value & 0xf) << 12)
              + ((bytes[pos+1] & 0x3f) << 6)
              + (bytes[pos+2] & 0x3f);
        pos += 3;
      } else if ((value & 0xc0) == 0xc0) {
        value = ((value & 0x1f) << 6)
              + (bytes[pos+1] & 0x3f);
        pos += 2;
      } else {
        pos++;
      }
      str = str + String.fromCharCode(value);
    }
    return str;    
  }
}