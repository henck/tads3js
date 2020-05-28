import { DataBlock } from './DataBlock'

/**
 * SRCF: Souce File Descriptor block.
 * 
 * This block is useful for source-level debuggers. This interpreter ignores it.
 */
class SRCF extends DataBlock {
  public toString() {
    return '[SRCF]';
  }
}

export { SRCF }