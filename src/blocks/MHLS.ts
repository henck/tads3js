import { DataBlock } from './DataBlock'

/**
 * MHLS: Method Header List block.
 * 
 * This block is useful for source-level debuggers. This interpreter ignores it.
 */
class MHLS extends DataBlock {
  public toString() {
    return '[MHLS]';
  }
}

export { MHLS }