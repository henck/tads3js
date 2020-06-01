import { Vm } from './Vm';

Vm.getInstance().load('../test/debug/test.t3');
// Vm.getInstance().load('../goldskull/goldskull.t3');

try {
  Vm.getInstance().run();
} catch(ex) {
  console.log("*** FATAL ERROR ***");
  console.error(ex);
}

Vm.getInstance().dump();
