import { DataBlock } from './DataBlock'

/**
 * EOF: End Of File block.
 */
class EOF extends DataBlock {
  public toString() {
    return '[EOF]';
  }
}

export { EOF }