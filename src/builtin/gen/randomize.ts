import { VmData, VmInt, VmNil, VmList, VmSstring } from "../../types";
import { random, RNG_ISAAC } from "../../util/Random";

/**
 * randomize(): ISAAC, seeded from the operating system.
 * randomize(nil): returns the RNG state as [id, state].
 * randomize([id, state]): restores a state.
 * randomize(id): selects an algorithm.
 * randomize(id, nil): selects an algorithm, seeded from the OS.
 * randomize(id, seed): selects an algorithm with a fixed seed (int or string).
 */
export function builtin_randomize(...args: VmData[]): VmData {
  if(args.length == 0) {
    random.select(RNG_ISAAC, null);
    return new VmNil();
  }
  let a = args[0];
  if(args.length == 1) {
    if(a instanceof VmNil) {
      let [id, state] = random.getState();
      return new VmList([new VmInt(id), new VmSstring(state)]);
    }
    let v = a.unpack();
    if(Array.isArray(v)) {
      random.setState(v[0].unpack(), v[1].unpack());
      return new VmNil();
    }
    random.select(a.unpack());
    return new VmNil();
  }
  let seed = args[1];
  random.select(a.unpack(), seed instanceof VmNil ? null : seed.unpack());
  return new VmNil();
}
