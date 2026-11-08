/**
 * Demo data for the matmul shown in the video.
 *
 * Every number on screen is read from a recorded run of the real hardware:
 *   rtl/*.sv -> Verilator -> WebAssembly (tiny_tpu.wasm), driven by scripts/rtl/trace.mjs,
 *   which writes src/rtl_trace.json (one entry per clock cycle).
 *   scripts/rtl/verify_numpy.py checks that trace against NumPy and writes src/numpy_golden.json.
 * This file only reads those two files, and asserts the same facts again at load time.
 */
import trace from './rtl_trace.json';
import golden from './numpy_golden.json';

export const N = 4;
export const A: number[][] = trace.A;
export const B: number[][] = trace.B;
export const GOLDEN: number[][] = golden.golden;

const cycles = trace.cycles;
const firstStream = cycles.findIndex((c) => c.fsmState === 'STREAM');
if (firstStream < 0) throw new Error('RTL trace has no STREAM phase');

/**
 * Partial sum of C[m][j] after accumulating rows 0..k, read from the psum register of PE[k][j].
 * Row m reaches PE[k][j] at cycle firstStream + k + j + m (the diagonal skew).
 */
export const partial = (m: number, j: number, k: number): number => {
  const pe = cycles[firstStream + k + j + m]?.pes[k * N + j];
  if (!pe) throw new Error(`RTL trace has no PE[${k}][${j}] for row ${m}`);
  return pe.psum;
};

/** The result matrix as the hardware result buffer produced it. */
export const RTL_C: number[][] = Array.from({length: N}, (_, i) =>
  Array.from({length: N}, (_, j) => trace.result[i * N + j]!),
);

for (let i = 0; i < N; i++)
  for (let j = 0; j < N; j++) {
    if (RTL_C[i]![j] !== GOLDEN[i]![j]) throw new Error(`RTL result mismatch at C[${i}][${j}]`);
    if (partial(i, j, N - 1) !== GOLDEN[i]![j]) throw new Error(`PE[${N - 1}][${j}] mismatch for row ${i}`);
  }
