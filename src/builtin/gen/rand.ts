import { VmData, VmInt, VmNil, VmObject, VmList, VmSstring } from "../../types";
import { MetaString } from "../../metaimp";
import { random, randomString } from "../../util/Random";

/**
 * rand(n): a random integer from 0 to n-1. rand(list): a random element.
 * rand(template): a random string (see util/Random). With several
 * arguments, one is chosen at random (the compiler arranges for only the
 * chosen one to be evaluated). With no arguments, a random 32-bit integer.
 */
export function builtin_rand(...args: VmData[]): VmData {
  if(args.length == 0) return new VmInt(random.int(0x100000000) | 0);
  if(args.length > 1) return args[random.int(args.length)];
  let arg = args[0];
  if(arg instanceof VmInt) return new VmInt(random.int(Math.max(0, arg.unpack())));
  let v = arg.unpack();
  if(typeof(v) == 'string') return new VmSstring(randomString(v));
  if(Array.isArray(v)) return v.length ? v[random.int(v.length)] : new VmNil();
  return arg;
}
