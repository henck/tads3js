import { DataBlock } from './DataBlock'
import { SourceImage } from '../SourceImage'

class ENTP extends DataBlock {
  public codePoolOffset: number;
  public methodHeaderSize: number;
  public exceptionTableEntrySize: number;
  public debuggerLineTableEntrySize: number;
  public debugTableHeaderSize: number;
  public debugTableLocalRecordHeaderSize: number;
  public debugRecordsVersion: number;
  public debugTableFrameHeaderSize: number;
  
  constructor(image: SourceImage, offset: number) {
    super(image, offset);
    this.codePoolOffset = image.getUInt32(this.offset);
    this.methodHeaderSize = image.getUInt16(this.offset + 4);
    this.exceptionTableEntrySize = image.getUInt16(this.offset + 6);
    this.debuggerLineTableEntrySize = image.getUInt16(this.offset + 8);
    this.debugTableHeaderSize = image.getUInt16(this.offset + 10);
    this.debugTableLocalRecordHeaderSize = image.getUInt16(this.offset + 12);
    this.debugRecordsVersion = image.getUInt16(this.offset + 14);
    this.debugTableFrameHeaderSize = image.getUInt16(this.offset + 16);
  }

  public toString() {
    return '[ENTP] code offset ' + this.codePoolOffset.toString();
  }
}

export { ENTP }