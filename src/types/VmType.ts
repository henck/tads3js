export enum VmType {
   NIL = 1,
   TRUE = 2,
   STACK = 3,
   CODEPTR = 4,
   OBJ = 5,
   PROP = 6,
   INT = 7,
   SSTRING = 8,
   DSTRING = 9,
   LIST = 10,
   CODEOFS = 11,
   FUNCPTR = 12,
   EMPTY = 13,
   NATIVE_CODE = 14,
   ENUM = 15,
   BIFPTR = 16,
   OBJX = 17
}

export const VmTypeName = new Map<number, string>([
  [VmType.NIL, 'nil'],
  [VmType.TRUE, 'true'],
  [VmType.STACK, 'stack (unused)'],
  [VmType.CODEPTR, 'codeptr (unused)'],
  [VmType.OBJ, 'obj'],
  [VmType.PROP, 'prop'],
  [VmType.INT, 'int'],
  [VmType.SSTRING, 'sstring'],
  [VmType.DSTRING, 'dstring'],
  [VmType.LIST, 'list'],
  [VmType.CODEOFS, 'codeofs'],
  [VmType.FUNCPTR, 'funcptr'],
  [VmType.EMPTY, 'empty'],
  [VmType.NATIVE_CODE, 'native code (unused)'],
  [VmType.ENUM, 'enum'],
  [VmType.BIFPTR, 'built-in func'],
  [VmType.OBJX, 'objx (unused)']
]);
