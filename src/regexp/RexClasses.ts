export class RexClasses {
  public static NamedCharacters: Map<string, string> = new Map<string, string>([
    ['lparen',    '\\('],
    ['rparen',    '\\)'],
    ['lsquare',   '\\['],
    ['rsquare',   '\\]'],
    ['lbrace',    '\\{'],
    ['rbrace',    '\\}'],
    ['langle',    '\\<'],
    ['rangle',    '\\>'],
    ['vbar',      '\\|'],
    ['caret',     '\\^'],
    ['period',    '\\.'],
    ['dot',       '\\.'],
    ['squote',    '\\\''],
    ['dquote',    '\\"'],
    ['star',      '\\*'],
    ['plus',      '\\+'],
    ['percent',   '\\%'],
    ['question',  '\\?'],
    ['dollar',    '\\$'],
    ['backslash', '\\\\'],
    ['return',    '\\r'],
    ['linefeed',  '\\n'],
    ['tab',       '\\t'],
    ['nul',       '\\0'],
    ['null',      '\\0']
  ]);

  private static LatinSupLower  = 'ßàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ';
  private static LatinSupUpper  = 'ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞ';
  private static LatinExtALower = 'āăąćĉċčďđēĕėęěĝğġģĥħĩīĭįıĳĵķĸĺļľŀłńņňŉŋōŏőœŕŗřśŝşšţťŧũūŭůűųŵŷźżžſ';
  private static LatinExtAUpper = 'ĀĂĄĆĈĊČĎĐĒĔĖĘĚĜĞĠĢĤĦĨĪĬĮİĲĴĶĹĻĽĿŁŃŅŇŊŌŎŐŒŔŖŘŚŜŞŠŢŤŦŨŪŬŮŰŲŴŶŸŹŻŽ';
  private static Lower = RexClasses.LatinSupLower + RexClasses.LatinExtALower;
  private static Upper = RexClasses.LatinSupUpper + RexClasses.LatinExtAUpper;

  public static CharacterClasses: Map<string, string> = new Map<string, string>([
    ['alpha',    `A-Za-z${RexClasses.Lower}${RexClasses.Upper}`],
    ['upper',    `A-Z${RexClasses.Lower}`],
    ['lower',    `a-z${RexClasses.Upper}`],
    ['digit',    '0-9'],
    ['alphanum', `A-Za-z0-9${RexClasses.Lower}${RexClasses.Upper}`],
    ['space',    '\u0020\u0009\u000c\u001f\u00a0\u2000-\u200b\u0085\u1680\u202f\u205f\u3000'],
    ['vspace',   '\r\n\u000b\u001c-\u001e\u2028\u2029'],
    ['punct',    '\u0021\u0022\u0023\u0025\u0026\u0027\u002a\u002c\u002e\u002f\u003a\u003b\u003f\u0040\u005c\u00a1\u00a7\u00b6\u00b7\u00bf'],
    ['newline',  '\n\r\u000b\u2028\u2029']
  ]);  
}