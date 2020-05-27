import { SourceImage } from '../SourceImage'
import { DataBlock } from './DataBlock';
import { ENTP } from './ENTP';
import { CPDF } from './CPDF';
import { CPPG } from './CPPG';
import { MCLD } from './MCLD';
import { OBJS } from './OBJS';
import { SYMD } from './SYMD';

class DataBlockFactory {
  public static create(type: string, image: SourceImage, offset: number) {
    switch(type) {
      case 'ENTP': return new ENTP(image, offset);
      case 'CPDF': return new CPDF(image, offset);
      case 'CPPG': return new CPPG(image, offset);
      case 'MCLD': return new MCLD(image, offset);
      case 'OBJS': return new OBJS(image, offset);
      case 'SYMD': return new SYMD(image, offset);
      default:
        return new DataBlock(image, offset);
    }
  }
}

export { DataBlockFactory }