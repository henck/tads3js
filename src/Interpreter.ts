import { Vm } from './Vm';

Vm.getInstance().load('../test/debug/test.t3');
// Vm.getInstance().load('goldskull.t3');

try {
  Vm.getInstance().run();
} catch(ex) {
  console.error(ex);
}

Vm.getInstance().dump();
