'use strict';

// Independent numerical checks for the lesson's number-line motion.
// Run from any directory: node qa_bounce/check_math.js
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const sourcePath = path.join(__dirname, 'math.js');
assert.ok(fs.existsSync(sourcePath), 'qa_bounce/math.js must exist before running this check.');
const context = vm.createContext({ window: {}, console });
vm.runInContext(fs.readFileSync(sourcePath, 'utf8'), context, { filename: sourcePath });
const math = context.window.BounceMath;
assert.equal(typeof math?.at, 'function', 'window.BounceMath.at must be available.');
assert.equal(typeof math?.fmt, 'function', 'window.BounceMath.fmt must be available.');

const EPS = 1e-8;
let checkedStates = 0;
function near(actual, expected, label) {
  assert.equal(typeof actual, 'number', `${label}: expected a number`);
  assert.ok(Number.isFinite(actual), `${label}: expected a finite number`);
  assert.ok(Math.abs(actual - expected) < EPS,
    `${label}: expected ${expected}, received ${actual}`);
}
function state(t) {
  const value = math.at(t);
  for (const field of ['p', 'm', 'q', 'n', 'gap']) {
    assert.ok(Number.isFinite(value[field]), `t=${t}: ${field} must be finite`);
  }
  assert.ok([0, 1, -1].includes(value.dir), `t=${t}: invalid direction ${value.dir}`);
  near(value.n - value.m, 6, `t=${t}: segment length`);
  near((value.m + value.n) / 2, value.q, `t=${t}: midpoint`);
  near(value.gap, Math.abs(value.p - value.q), `t=${t}: distance`);
  assert.ok(value.q >= -7 - EPS && value.q <= 11 + EPS,
    `t=${t}: Q must stay between -7 and 11`);
  checkedStates++;
  return value;
}

// These positions are hand-computed from the given distances and speeds,
// including both sides of the encounter and every relevant turnaround.
const keyStates = [
  // t,      P,     M,     Q,     N, gap
  [0,     -30,   -10,    -7,    -4, 23],
  [5,     -20,   -10,    -7,    -4, 13],
  [11,     -8,     8,    11,    14, 19],
  [14.6, -0.8,  -2.8,   0.2,   3.2, 1],
  [14.8, -0.4,  -3.4,  -0.4,   2.6, 0],
  [15,      0,    -4,    -1,     2, 1],
  [17,      4,   -10,    -7,    -4, 11],
  [20,     10,    -1,     2,     5, 8],
  [22,     14,     5,     8,    11, 6],
  [23,     16,     8,    11,    14, 5],
  [24,     18,     5,     8,    11, 10],
  [29,     28,   -10,    -7,    -4, 35],
];
for (const [t, ...expected] of keyStates) {
  const value = state(t);
  ['p', 'm', 'q', 'n', 'gap'].forEach((field, i) => {
    near(value[field], expected[i], `t=${t}: ${field}`);
  });
}

// Check each distinct motion interval at its midpoint and an interior step.
// The instantaneous direction exactly at a turnaround may use either adjacent
// convention; inside every interval it must match the physical motion.
for (const [start, end, direction] of [
  [0, 5, 0], [5, 11, 1], [11, 17, -1],
  [17, 23, 1], [23, 29, -1], [29, 35, 1],
]) {
  const t = (start + end) / 2;
  const first = state(t);
  const second = state(t + 0.25);
  assert.equal(first.dir, direction, `t=${t}: direction inside interval`);
  assert.equal(second.dir, direction, `t=${t + 0.25}: direction inside interval`);
  near(second.p - first.p, 0.5, `interval ${start}..${end}: P speed`);
  near(second.q - first.q, direction * 0.75, `interval ${start}..${end}: Q speed`);
}

// Solve signed separation = +/- target within each affine motion interval.
// This verifies the complete answer set before t=23 rather than just checking
// that the printed answers happen to satisfy the distance condition.
function distanceRoots(target) {
  const roots = [];
  for (const [left, right] of [[0, 5], [5, 11], [11, 17], [17, 23]]) {
    const a = state(left);
    const b = state(right);
    const da = a.p - a.q;
    const db = b.p - b.q;
    for (const wanted of [-target, target]) {
      const fraction = (wanted - da) / (db - da);
      if (fraction >= -EPS && fraction <= 1 + EPS) {
        const t = left + fraction * (right - left);
        near(state(t).gap, target, `root for distance ${target}`);
        if (!roots.some(value => Math.abs(value - t) < EPS)) roots.push(t);
      }
    }
  }
  return roots.sort((a, b) => a - b);
}
function sameRoots(actual, expected, label) {
  assert.equal(actual.length, expected.length, `${label}: wrong number of solutions`);
  actual.forEach((value, i) => near(value, expected[i], `${label}: solution ${i + 1}`));
}
sameRoots(distanceRoots(1), [73 / 5, 15], 'Original question');
sameRoots(distanceRoots(2), [72 / 5, 76 / 5], 'Practice: distance 2');
near(state(22).n, 11, 'Original question: N when P reaches C');
near(state(20).n, 5, 'Practice: N at t=20');

// After t=23, P is already at 16 and keeps moving right, while Q never exceeds
// 11. Thus neither distance 1 nor distance 2 can recur. Check the continuing
// 12-second segment cycle separately from P, which must NOT repeat.
for (const base of [5, 8, 11, 14]) {
  const first = state(base);
  for (const periods of [1, 2]) {
    const later = state(base + periods * 12);
    for (const field of ['m', 'q', 'n']) {
      near(later[field], first[field], `12-second cycle: ${field}`);
    }
    near(later.p - first.p, periods * 24, 'P continues moving across segment cycles');
  }
}

console.log(`BOUNCE MATH QA PASS (${checkedStates} checked states)`);
console.log('Original: a=-30, b=-10, c=14; t=22 -> N=11; PQ=1 -> t=73/5 or 15.');
console.log('Practice: PQ=2 -> t=72/5 or 76/5; t=20 -> N=5.');
