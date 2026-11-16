/**
 * VM run-time errors.
 *
 * When a run-time error occurs, the VM creates an instance of the program's
 * exported RuntimeError class with the error number as the constructor
 * argument, sets its exported exceptionMessage property to the error's
 * message, and throws it, so the program can catch it.
 *
 * Native code signals such errors by throwing a VmRuntimeError. Older code
 * throws plain strings instead; toVmError() maps the ones that represent
 * run-time errors to error numbers. Other exceptions are internal VM
 * failures, which programs can't catch.
 */

/** Error numbers and messages, from the System Manual ("VM Run-Time Error Codes"). */
export const VM_ERROR_MESSAGES: { [errno: number]: string } = {
  101: "error reading file",
  102: "error writing file",
  103: "file not found",
  104: "error creating file",
  105: "error closing file",
  106: "error deleting file",
  107: "data packer format string parsing error at character index nnn",
  108: "data packer argument type mismatch at format string index nnn",
  109: "wrong number of data packer arguments at format string index nnn",
  110: "this file operation isn't supported for storage server files",
  111: "error renaming file",
  201: "object ID in use - the image/save file might be corrupted",
  202: "out of memory",
  203: "out of memory allocating pool page",
  204: "invalid page size - file is not valid",
  205: "no more property ID's are available",
  206: "circular initialization dependency in intrinsic class (internal error)",
  301: "this interpreter version cannot run this program (program requires intrinsic class xxx, which is not available in this interpreter)",
  302: "this interpreter version cannot run this program (program requires intrinsic function set xxx, which is not available in this interpreter)",
  303: "reading past end of image file - program might be corrupted",
  304: "this is not an image file (no valid signature found)",
  305: "this interpreter version cannot run this program (unknown block type in image file)",
  306: "data block too small",
  307: "invalid image file: pool page before pool definition",
  308: "invalid image file: pool page out of range of definition",
  309: "invalid image file: invalid pool ID",
  310: "invalid image file: bad page index",
  311: "loading undefined pool page",
  312: "invalid image file: pool is defined more than once",
  313: "invalid image file: multiple intrinsic class dependency tables found",
  314: "invalid image file: no intrinsic class dependency table found",
  315: "invalid image file: multiple function set dependency tables found",
  316: "invalid image file: no function set dependency table found",
  317: "invalid image file: multiple entrypoints found",
  318: "invalid image file: no entrypoint found",
  319: "incompatible image file format version",
  320: "image contains no code",
  321: "incomptabile image file format: method header too old",
  322: "unavailable intrinsic function called (index nnn in function set \"xxx\")",
  323: "unknown internal intrinsic class ID nnn",
  324: "page mask is not allowed for in-memory image file",
  325: "no embedded image file found in executable",
  326: "object size exceeds hardware limits of this computer",
  327: "this interpreter is too old to run this program (program requires intrinsic class version xxx, interpreter provides version xxx)",
  328: "invalid intrinsic class data - image file may be corrupted",
  329: "invalid object - class does not allow loading",
  330: "this interpreter is too old to run this program (program requires function set version xxx, interpreter provides version xxx)",
  331: "exported symbol \"xxx\" is of incorrect datatype",
  332: "invalid data in macro definitions in image file (error code nnn)",
  333: "this program is not capable of restoring a saved state on startup",
  334: "image file is incompatible with debugger - recompile the program",
  400: "this operation is not allowed by the network safety level settings",
  1001: "property cannot be set for object",
  1201: "file is not a valid saved state file",
  1202: "saved state is for a different program or a different version of this program",
  1203: "intrinsic class name in saved state file is too long",
  1206: "invalid object ID in saved state file",
  1207: "saved state file is corrupted (incorrect checksum)",
  1209: "storage server error",
  1210: "saved file metadata table exceeds 64k bytes",
  1208: "invalid intrinsic class data in saved state file",
  2001: "cannot convert value to string",
  2002: "string conversion buffer overflow",
  2003: "invalid datatypes for addition operator",
  2004: "numeric value required",
  2005: "integer value required",
  2006: "cannot convert value to logical (true/nil)",
  2007: "invalid datatypes for subtraction operator",
  2008: "division by zero",
  2009: "invalid comparison",
  2010: "object value required",
  2011: "property pointer required",
  2012: "logical value required",
  2013: "function pointer required",
  2014: "invalid index operation - this type of value cannot be indexed",
  2015: "index out of range",
  2016: "invalid intrinsic class index",
  2017: "invalid dynamic object creation (intrinsic class does not support NEW)",
  2018: "object value required for base class",
  2019: "string value required",
  2020: "list value required",
  2021: "list or string reference found in dictionary (entry \"xxx\") - this dictionary cannot be saved in the image file",
  2022: "invalid object type - cannot convert to required object type",
  2023: "numeric overflow",
  2024: "invalid datatypes for multiplication operator",
  2025: "invalid datatypes for division operator",
  2026: "invalid datatype for arithmetic negation operator",
  2027: "value is out of range",
  2028: "string is too long",
  2029: "list too long",
  2030: "maximum equality test/hash recursion depth exceeded",
  2031: "cannot convert value to integer",
  2032: "invalid datatype for modulo operator",
  2033: "invalid datatype for bitwise AND operator",
  2034: "invalid datatype for bitwise OR operator",
  2035: "invalid datatype for XOR operator",
  2036: "invalid datatype for left-shift operator '<<'",
  2037: "invalid datatype for arithmetic right-shift operator '>>'",
  2038: "invalid datatype for bitwise NOT operator",
  2039: "code pointer value required",
  2040: "exception object required, but 'new' did not yield an object",
  2041: "cannot convert value to native floating point",
  2042: "cannot convert value to a numeric type",
  2043: "invalid datatype for logical right-shift operator '>>>'",
  2201: "wrong number of arguments",
  2202: "argument mismatch calling xxx - function definition is incorrect",
  2203: "nil object reference",
  2204: "missing named argument 'xxx'",
  2205: "invalid type for call",
  2206: "nil 'self' value is not allowed",
  2270: "cannot create instance of object - object is not a class",
  2271: "cannot create instance - class does not allow dynamic construction",
  2301: "invalid opcode - possible image file corruption",
  2302: "unhandled exception",
  2303: "stack overflow",
  2304: "invalid type for intrinsic function argument",
  2305: "default output function is not defined",
  2306: "invalid value for intrinsic function argument",
  2307: "breakpoint encountered",
  2308: "external function calls are not implemented in this version",
  2309: "invalid opcode modifier - possible image file corruption",
  2310: "No mapping file available for local character set \"xxx\"",
  2311: "Unhandled exception: xxx",
  2312: "VM Error: xxx",
  2313: "VM Error: code nnn",
  2314: "Exception in static initializer for xxx.xxx: xxx",
  2315: "intrinsic class exception: xxx",
  2316: "stack access is out of bounds",
  2391: "'abort' signal",
  2392: "'restart' signal",
  2394: "debugger VM halt",
  2395: "interrupted by user",
  2396: "no debugger available",
  2500: "invalid frame in debugger local/parameter evaluation",
  2501: "invalid speculative expression",
  2502: "invalid debugger expression",
  2503: "image file has no debugging information - recompile for debugging",
  2600: "out of temporary floating point registers (calculation too complex)",
  2601: "cannot convert value to BigNumber",
};

/** Commonly used error numbers. */
export const VmErr = {
  READ_FILE: 101,
  FILE_NOT_FOUND: 103,
  CREATE_FILE: 104,
  NOT_SAVE_FILE: 1201,
  WRONG_SAVE_FILE: 1202,
  SAVE_FILE_CORRUPT: 1207,
  BAD_TYPE_ADD: 2003,
  NUM_VAL_REQD: 2004,
  INT_VAL_REQD: 2005,
  NO_LOG_CONV: 2006,
  BAD_TYPE_SUB: 2007,
  DIVIDE_BY_ZERO: 2008,
  INVALID_COMPARISON: 2009,
  OBJ_VAL_REQD: 2010,
  INTRINSIC_CLASS_EXCEPTION: 2315,
  PROPPTR_VAL_REQD: 2011,
  BAD_SPEC_EVAL: 2501,
  LOG_VAL_REQD: 2012,
  FUNCPTR_VAL_REQD: 2013,
  CANNOT_INDEX_TYPE: 2014,
  INDEX_OUT_OF_RANGE: 2015,
  STRING_VAL_REQD: 2019,
  LIST_VAL_REQD: 2020,
  NUMERIC_OVERFLOW: 2023,
  BAD_TYPE_MUL: 2024,
  BAD_TYPE_DIV: 2025,
  BAD_TYPE_NEG: 2026,
  VALUE_OUT_OF_RANGE: 2027,
  BAD_TYPE_MOD: 2032,
  BAD_TYPE_BAND: 2033,
  BAD_TYPE_BOR: 2034,
  BAD_TYPE_XOR: 2035,
  BAD_TYPE_SHL: 2036,
  BAD_TYPE_ASHR: 2037,
  BAD_TYPE_BNOT: 2038,
  BAD_TYPE_LSHR: 2043,
  WRONG_NUM_OF_ARGS: 2201,
  NIL_DEREF: 2203,
  MISSING_NAMED_ARG: 2204,
  BAD_TYPE_CALL: 2205,
  STACK_OVERFLOW: 2303,
  BAD_TYPE_BIF: 2304,
  SAY_IS_NOT_DEFINED: 2305,
  BAD_VAL_BIF: 2306,
};

/**
 * A run-time error, to be thrown by native code.
 */
export class VmRuntimeError {
  public readonly errno: number;
  public readonly message: string;

  constructor(errno: number, message?: string) {
    this.errno = errno;
    this.message = message ?? VM_ERROR_MESSAGES[errno] ?? `VM error ${errno}`;
  }

  toString() {
    return `Runtime error ${this.errno}: ${this.message}`;
  }
}

/**
 * Error strings thrown by older code, and the run-time errors they mean.
 */
const LEGACY_ERRORS: { [s: string]: number } = {
  'NUM_VAL_REQD': VmErr.NUM_VAL_REQD,
  'INT_VAL_REQD': VmErr.INT_VAL_REQD,
  'INDEX_OUT_OF_RANGE': VmErr.INDEX_OUT_OF_RANGE,
  'index out of range': VmErr.INDEX_OUT_OF_RANGE,
  'Index out of bounds': VmErr.INDEX_OUT_OF_RANGE,
  'Out of bounds': VmErr.INDEX_OUT_OF_RANGE,
  'End index must be greater than or equal to start index': VmErr.INDEX_OUT_OF_RANGE,
  'OBJ_VAL_REQD': VmErr.OBJ_VAL_REQD,
  'CALLPROP: OBJ_VAL_REQD': VmErr.OBJ_VAL_REQD,
  'CANNOT_INDEX_TYPE': VmErr.CANNOT_INDEX_TYPE,
  'INVALID_COMPARISON': VmErr.INVALID_COMPARISON,
  'CANNOT_COMPARE_TYPE': VmErr.INVALID_COMPARISON,
  'PROPPTR_VAL_REQD': VmErr.PROPPTR_VAL_REQD,
  'NO_LOG_CONV': VmErr.NO_LOG_CONV,
  'LOG_VAL_REQD': VmErr.LOG_VAL_REQD,
  'LIST_VAL_REQD': VmErr.LIST_VAL_REQD,
  'DIVIDE_BY_ZERO': VmErr.DIVIDE_BY_ZERO,
  'BAD_TYPE_ADD': VmErr.BAD_TYPE_ADD,
  'BAD_TYPE_SUB': VmErr.BAD_TYPE_SUB,
  'BAD_TYPE_MUL': VmErr.BAD_TYPE_MUL,
  'BAD_TYPE_DIV': VmErr.BAD_TYPE_DIV,
  'BAD_TYPE_MOD': VmErr.BAD_TYPE_MOD,
  'BAD_TYPE_BAND': VmErr.BAD_TYPE_BAND,
  'BAD_TYPE_BOR': VmErr.BAD_TYPE_BOR,
  'BAD_TYPE_XOR': VmErr.BAD_TYPE_XOR,
  'BAD_TYPE_SHL': VmErr.BAD_TYPE_SHL,
  'BAD_TYPE_ASHR': VmErr.BAD_TYPE_ASHR,
  'BAD_TYPE_AHSR': VmErr.BAD_TYPE_ASHR,
  'BAD_TYPE_LSHR': VmErr.BAD_TYPE_LSHR,
  'BAD_TYPE_LHSR': VmErr.BAD_TYPE_LSHR,
  'BAD_TYPE_BNOT': VmErr.BAD_TYPE_BNOT,
  'PTRCALL: FUNCPTR_VAL_REQD': VmErr.FUNCPTR_VAL_REQD,
  'CANNOT_INVOKE_TYPE': VmErr.BAD_TYPE_CALL,
  'CANNOT_INVOKE': VmErr.BAD_TYPE_CALL,
  'NOT A FUNCTION': VmErr.BAD_TYPE_CALL,
  'WRONG NUMBER OF ARGUMENTS': VmErr.WRONG_NUM_OF_ARGS,
  'STACK OVERFLOW': VmErr.STACK_OVERFLOW,
  'Invalid type for built-in': VmErr.BAD_TYPE_BIF,
  'Undefined named argument.': VmErr.MISSING_NAMED_ARG,
  'No default display function defined.': VmErr.SAY_IS_NOT_DEFINED,
  'LIST OR VECTOR REQD': VmErr.LIST_VAL_REQD,
  'List-like argument expected': VmErr.LIST_VAL_REQD,
};

/**
 * Interpret a caught JS exception as a run-time error, if it is one.
 * @param e Caught value
 * @returns The run-time error, or null for an internal VM failure
 */
export function toVmError(e: any): VmRuntimeError {
  if(e instanceof VmRuntimeError) return e;
  if(typeof(e) == 'string') {
    if(LEGACY_ERRORS[e] !== undefined) return new VmRuntimeError(LEGACY_ERRORS[e]);
    if(e.startsWith('CALL: WRONG_NUM_OF_ARGS')) return new VmRuntimeError(VmErr.WRONG_NUM_OF_ARGS);
  }
  return null;
}
