import { VmData } from "./types";

export type TSymbol = 
    'objToString' 
  | 'String.specialsToHtml.flags'
  | 'String.specialsToHtml.tag'
  | 'length'
  | 'IfcComparator.calcHash'
  | 'IfcComparator.matchValues'
  | 'LastProp'
  | 'Constructor'
  | 'Destructor'
  | 'GrammarProd.grammarInfo'
  | 'GrammarProd.grammarTag'
  | 'GrammarProd.miscVocab'
  | 'GrammarProd.firstTokenIndex'
  | 'GrammarProd.lastTokenIndex'
  | 'GrammarProd.tokenList'
  | 'GrammarProd.tokenMatchList'
  | 'GrammarProd.altProps'
  | 'GrammarProd.GrammarAltInfo'
  | 'GrammarProd.GrammarAltTokInfo'
  | 'operator +'
  | 'operator -'
  | 'operator *'
  | 'operator /'
  | 'operator %'
  | 'operator ^'
  | 'operator <<'
  | 'operator >>'
  | 'operator >>>'
  | 'operator ~'
  | 'operator |'
  | 'operator &'
  | 'operator negate'
  | 'operator []'
  | 'operator []='
  | 'mainRestore'
  | 'RuntimeError'
  | 'exceptionMessage'
  | 'CharacterSet.UnknownCharSetException'
  | 'StorageServerError'
  | 'T3StackInfo'
  | 'FileSpec.getFilename'
  | 'FileSpec.closeFile'
  | 'File.FileInfo'
  | 'File.FileNotFoundException'
  | 'File.FileCreationException'
  | 'File.FileOpenException'
  | 'File.FileIOException'
  | 'File.FileSyncException'
  | 'File.FileClosedException'
  | 'File.FileModeException'
  | 'File.FileSafetyException'
  | 'propNotDefined';

export class Symbols {
  private static sym: Map<TSymbol, VmData> = new Map<TSymbol, VmData>();

  /**
   * Record an exported symbol. Programs can export any name; the TSymbol
   * type lists the ones the VM itself uses.
   */
  public static set(name: string, value: VmData) {
    this.sym.set(name as TSymbol, value);
  }

  public static get(symbol: TSymbol): VmData {
    return this.sym.get(symbol);
  }

  /** All symbol values. */
  public static values(): VmData[] {
    return Array.from(Symbols.sym.values());
  }

  public static clear() {
    Symbols.sym.clear();
  }
}
