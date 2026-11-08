// Runs the shipped TinyTPU WebAssembly (compiled from rtl/ by Verilator + Emscripten)
// on the demo matrices and records every clock cycle into src/rtl_trace.json.
// Every number the video shows comes from this file. See verify_numpy.py for the check.
import {writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import createTinyTpu from './tiny_tpu.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, '../../src/rtl_trace.json');

const A = [
  [1, 2, 0, -1],
  [3, 1, 2, 0],
  [0, -2, 1, 4],
  [2, 0, 3, 1],
];
const B = [
  [2, 0, 1, -1],
  [1, 3, 0, 2],
  [-1, 1, 2, 0],
  [0, 2, 1, 3],
];

const mod = await createTinyTpu();
const sim = new mod.TinyTpuSim();
sim.reset();
sim.loadA(A.flat());
sim.loadB(B.flat());
sim.start();
const cycles = Array.from(sim.run()).map((s) => JSON.parse(JSON.stringify(s)));
const result = Array.from(sim.getResult());

writeFileSync(out, JSON.stringify({A, B, result, cycles}));
console.log(`recorded ${cycles.length} cycles -> ${out}`);
