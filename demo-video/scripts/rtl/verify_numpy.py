"""Checks the recorded RTL trace against NumPy and writes src/numpy_golden.json.

Fails the build if the hardware result differs from NumPy in any of the 16 outputs,
or in any of the 64 partial sums that the video shows on the PE grid.
"""
import json
import pathlib

import numpy as np

root = pathlib.Path(__file__).resolve().parents[2]  # demo-video/
trace = json.loads((root / "src/rtl_trace.json").read_text())

A = np.array(trace["A"], dtype=np.int64)
B = np.array(trace["B"], dtype=np.int64)
golden = A @ B

rtl = np.array(trace["result"], dtype=np.int64).reshape(4, 4)
assert np.array_equal(rtl, golden), "RTL result differs from NumPy"

cycles = trace["cycles"]
start = next(i for i, c in enumerate(cycles) if c["fsmState"] == "STREAM")
for m in range(4):
    for j in range(4):
        for k in range(4):
            want = int(sum(A[m, q] * B[q, j] for q in range(k + 1)))
            got = cycles[start + k + j + m]["pes"][k * 4 + j]["psum"]  # diagonal skew: PE[k][j] lags by k+j
            assert got == want, f"partial sum mismatch at m={m} j={j} k={k}: {got} != {want}"

(root / "src/numpy_golden.json").write_text(json.dumps({"golden": golden.tolist()}, indent=1))
print("RTL trace matches NumPy: 16 outputs and 64 partial sums")
