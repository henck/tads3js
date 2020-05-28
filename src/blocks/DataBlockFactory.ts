import { SourceImage } from '../SourceImage';
import { DataBlock } from './DataBlock';

import { CPDF } from './CPDF';
import { CPPG } from './CPPG';
import { ENTP } from './ENTP';
import { EOF } from './EOF';
import { GSYM } from './GSYM';
import { MACR } from './MACR';
import { MCLD } from './MCLD';
import { MHLS } from './MHLS';
import { OBJS } from './OBJS';
import { SRCF } from './SRCF';
import { SYMD } from './SYMD';
import { FNSD } from './FNSD';

class DataBlockFactory {
  public static create(type: string, image: SourceImage, offset: number) {
    switch (type) {
      case 'ENTP': return new ENTP(image, offset);
      case 'CPDF': return new CPDF(image, offset);
      case 'CPPG': return new CPPG(image, offset);
      case 'MCLD': return new MCLD(image, offset);
      case 'OBJS': return new OBJS(image, offset);
      case 'SYMD': return new SYMD(image, offset);
      case 'SRCF': return new SRCF(image, offset);
      case 'GSYM': return new GSYM(image, offset);
      case 'MACR': return new MACR(image, offset);
      case 'MHLS': return new MHLS(image, offset);
      case 'FNSD': return new FNSD(image, offset);
      case 'EOF ': return new EOF(image, offset);
      default:
        return new DataBlock(image, offset);
    }
  }
}

export { DataBlockFactory };
