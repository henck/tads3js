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
  | 'operator []=';

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