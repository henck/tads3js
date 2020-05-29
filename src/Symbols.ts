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

  private static nameToSymbol(name: string): TSymbol {
    switch(name) {
      case 'objToString': return 'objToString';
      case 'String.specialsToHtml.flags': return 'String.specialsToHtml.flags';
      case 'String.specialsToHtml.tag': return 'String.specialsToHtml.tag';
      case 'length': return 'length';
      case 'IfcComparator.calcHash': return 'IfcComparator.calcHash';
      case 'IfcComparator.matchValues': return 'IfcComparator.matchValues';
      case 'LastProp': return 'LastProp';
      case 'Constructor': return 'Constructor';
      case 'Destructor': return 'Destructor';
      case 'GrammarProd.grammarInfo': return 'GrammarProd.grammarInfo';
      case 'GrammarProd.grammarTag': return 'GrammarProd.grammarTag';
      case 'GrammarProd.miscVocab': return 'GrammarProd.miscVocab';
      case 'GrammarProd.firstTokenIndex': return 'GrammarProd.firstTokenIndex';
      case 'GrammarProd.lastTokenIndex': return 'GrammarProd.lastTokenIndex';      
      case 'GrammarProd.tokenList': return 'GrammarProd.tokenList';
      case 'GrammarProd.tokenMatchList': return 'GrammarProd.tokenMatchList';
      case 'GrammarProd.altProps': return 'GrammarProd.altProps';
      case 'GrammarProd.GrammarAltInfo': return 'GrammarProd.GrammarAltInfo';
      case 'GrammarProd.GrammarAltTokInfo': return 'GrammarProd.GrammarAltTokInfo';
      case 'operator +': return 'operator +';
      case 'operator -': return 'operator -';
      case 'operator *': return 'operator *';
      case 'operator /': return 'operator /';
      case 'operator %': return 'operator %';
      case 'operator ^': return 'operator ^';
      case 'operator <<': return 'operator <<';
      case 'operator >>': return 'operator >>';
      case 'operator >>>': return 'operator >>>';
      case 'operator ~': return 'operator ~';
      case 'operator |': return 'operator |';
      case 'operator &': return 'operator &';
      case 'operator negate': return 'operator negate';
      case 'operator []': return 'operator []';
      case 'operator []=': return 'operator []=';
      case 'mainRestore': return 'mainRestore';
      case 'RuntimeError': return 'RuntimeError';
      case 'exceptionMessage': return 'exceptionMessage';
      case 'CharacterSet.UnknownCharSetException': return 'CharacterSet.UnknownCharSetException';
      case 'StorageServerError': return 'StorageServerError';
      case 'T3StackInfo': return 'T3StackInfo';
      case 'FileSpec.getFilename': return 'FileSpec.getFilename';
      case 'FileSpec.closeFile': return 'FileSpec.closeFile';
      case 'File.FileInfo': return 'File.FileInfo';
      case 'File.FileNotFoundException': return 'File.FileNotFoundException';
      case 'File.FileCreationException': return 'File.FileCreationException';
      case 'File.FileOpenException': return 'File.FileOpenException';
      case 'File.FileIOException': return 'File.FileIOException';
      case 'File.FileSyncException': return 'File.FileSyncException';
      case 'File.FileClosedException': return 'File.FileClosedException';
      case 'File.FileModeException': return 'File.FileModeException';
      case 'File.FileSafetyException': return 'File.FileSafetyException';
      case 'propNotDefined': return 'propNotDefined';
      default: 
        throw(`Unknown symbol: ${name}`);
    }
  }

  public static clear() {
    this.sym.clear();
  }

  public static set(name: string, value: VmData) {
    this.sym.set(this.nameToSymbol(name), value);
  }

  public static get(symbol: TSymbol): VmData {
    return this.sym.get(symbol);
  }
}