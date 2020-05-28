import { DataBlock } from './DataBlock'

/**
 * GSYM: Global Symbol Table block.
 * 
 * This block is useful for source-level debuggers. This interpreter ignores it.
 */
class GSYM extends DataBlock {
  public toString() {
    return '[GSYM]';
  }
}

export { GSYM }