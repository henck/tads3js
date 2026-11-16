import { DataBlock } from './DataBlock'

/**
 * MACR: Preprocessor Macro Symbol Table.
 * 
 * This block is useful for source-level debuggers. This interpreter ignores it.
 */
class MACR extends DataBlock {
  public toString() {
    return '[MACR]';
  }
}

export { MACR }