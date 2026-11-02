import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
import katex from 'katex';

const source = await readFile(new URL('../src/math/numericalMethods.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } });
const numericalModule = 'data:text/javascript;base64,' + Buffer.from(outputText).toString('base64');
const { solveLagrangeAndRomberg: solve, HYDROLOGY_PRESETS: presets } = await import(numericalModule);
const interpretationSource = await readFile(new URL('../src/math/interpretation.ts', import.meta.url), 'utf8');
const interpretationJS = ts.transpileModule(interpretationSource, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText.replaceAll("'./numericalMethods'", JSON.stringify(numericalModule));
const interpretationModule = 'data:text/javascript;base64,' + Buffer.from(interpretationJS).toString('base64');
const { assessFlow, convergenceLevels, preciseLatex } = await import(interpretationModule);
const presentationSource = await readFile(new URL('../src/math/presentation.ts', import.meta.url), 'utf8');
const presentationJS = ts.transpileModule(presentationSource, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText.replaceAll("'./numericalMethods'", JSON.stringify(numericalModule)).replaceAll("'./interpretation'", JSON.stringify(interpretationModule));
const { presentationOperations } = await import('data:text/javascript;base64,' + Buffer.from(presentationJS).toString('base64'));
const trapSource = await readFile(new URL('../src/math/trapezoids.ts', import.meta.url), 'utf8');
const trapJS = ts.transpileModule(trapSource, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText.replaceAll("'./numericalMethods'", JSON.stringify(numericalModule));
const { trapezoidContributions } = await import('data:text/javascript;base64,' + Buffer.from(trapJS).toString('base64'));
const near = (actual, expected, label, tolerance = 1e-8) => assert.ok(Math.abs(actual - expected) <= tolerance * Math.max(1, Math.abs(expected)), `${label}: ${actual} != ${expected}`);
const pointsOf = (fn, xs) => xs.map((x, i) => ({ id: String(i), x, y: fn(x) }));
let formulasChecked = 0;
function checkFormulas(value) {
  if (Array.isArray(value)) { value.forEach(checkFormulas); return; }
  if (!value || typeof value !== 'object') return;
  for (const [key, entry] of Object.entries(value)) {
    if (key.endsWith('Latex') && typeof entry === 'string') {
      katex.renderToString(entry, { throwOnError: true, strict: false }); formulasChecked++;
    } else if (Array.isArray(entry)) checkFormulas(entry);
  }
}

for (const p of presets) {
  const s = solve(p.points, p.targetX, p.a, p.b, p.levels, p.velocity);
  assert.equal(s.isValid, true, p.id);
  p.points.forEach(point => near(s.evaluateP(point.x), point.y, 'Interpolation at measured point'));
  near(s.rombergFinalValue, s.exactIntegralValue, 'Romberg vs analytic integral');
  near(s.dischargeQ, s.rombergFinalValue * p.velocity, 'Discharge');
  for (const [m, column] of s.rombergColumns.entries()) for (const cell of column) {
    if (m === 0) near(cell.value, s.trapezoidalLevels[cell.rowIndex].areaValue, 'A0 trapezoidal base');
    else near(cell.value, (4 ** m * cell.lowerParentValue - cell.upperParentValue) / (4 ** m - 1), 'Romberg recurrence');
  }
  checkFormulas(s);
  for (const level of s.trapezoidalLevels) {
    const pieces = trapezoidContributions(s, level.k);
    assert.equal(pieces.length, level.N);
    near(pieces.reduce((sum, piece) => sum + piece.area, 0), level.areaValue, 'Sum of selected trapezoid contributions');
    near(pieces[0].leftX, s.a, 'First trapezoid begins at a');
    near(pieces.at(-1).rightX, s.b, 'Last trapezoid ends at b');
    for (const piece of pieces) {
      near(piece.width, level.h, 'Trapezoid base');
      near(piece.leftHeight, s.evaluateP(piece.leftX), 'Left height from Lagrange');
      near(piece.rightHeight, s.evaluateP(piece.rightX), 'Right height from Lagrange');
    }
  }
}
const quadratic = solve(pointsOf(x => 2 + 3 * x - x * x, [0, 1, 2]), .5, 0, 2, 4, 2);
near(quadratic.targetY, 3.25, 'Quadratic evaluation');
near(quadratic.rombergFinalValue, 22 / 3, 'Known quadratic integral');
const quartic = solve(pointsOf(x => 1 + x ** 4, [0, .25, .5, .75, 1]), .3, 0, 1, 4, 1);
near(quartic.rombergFinalValue, 1.2, 'Known quartic integral');
const sixth = solve(pointsOf(x => 1 + x ** 6, [0, 1/6, 2/6, .5, 4/6, 5/6, 1]), .4, 0, 1, 5, 1);
near(sixth.rombergFinalValue, 8 / 7, 'Known sixth degree integral');
const p = presets[0];
const invalid = (points, x = p.targetX, a = p.a, b = p.b, v = p.velocity) => assert.equal(solve(points, x, a, b, 4, v).isValid, false);
invalid([{ id: 'a', x: 0, y: 1 }, { id: 'b', x: 0, y: 2 }]);
invalid([{ id: 'a', x: 0, y: NaN }, { id: 'b', x: 1, y: 2 }]);
invalid([{ id: 'a', x: 0, y: -1 }, { id: 'b', x: 1, y: 2 }]);
invalid(p.points, NaN); invalid(p.points, p.targetX, 5, 2); invalid(p.points, p.targetX, 0, 12, -1);
const zero = solve(pointsOf(() => 0, [0, 1, 2]), 1, 0, 2, 4, 0);
assert.equal(zero.isValid, true); near(zero.dischargeQ, 0, 'Dry section');
const reordered = solve([...p.points].reverse(), p.targetX, p.a, p.b, 4, p.velocity);
near(reordered.rombergFinalValue, solve(p.points, p.targetX, p.a, p.b, 4, p.velocity).rombergFinalValue, 'Input ordering');
const convergence = convergenceLevels(quartic);
assert.equal(convergence.length, 4);
convergence.forEach((row, k) => {
  assert.equal(row.N, 2 ** k);
  near(row.romberg, quartic.rombergColumns[k][0].value, 'Best estimate available with N');
  near(row.error, Math.abs(row.romberg - 1.2), 'Convergence absolute error');
});
assert.ok(convergence[1].error > 0.001);
assert.ok(convergence[2].error < 1e-10);
assert.ok(preciseLatex(1e-14).includes('10^{-14}'));
assert.equal(preciseLatex(0), '0');
assert.equal(convergenceLevels(zero).every(row => row.error === 0), true);

const positive = pointsOf(() => 2, [0, .5, 1]);
assert.equal(assessFlow(solve(positive, .5, 0, 1, 4, 1)).state, 'consistent');
const queryOnly = assessFlow(solve(positive, 2, 0, 1, 4, 1));
assert.equal(queryOnly.state, 'consistent');
assert.equal(queryOnly.queryExtrapolated, true);
assert.equal(assessFlow(solve(positive, .5, 0, 2, 4, 1)).state, 'extrapolated');
assert.equal(assessFlow(solve(positive, NaN, 0, 1, 4, 1)).state, 'invalid');
// A very narrow negative dip between positive samples must still be detected.
const narrowDip = pointsOf(x => (x - .501) ** 2 - 1e-8, [0, .9, 1]);
const nonphysical = solve(narrowDip, .1, 0, 1, 4, 1);
assert.ok(nonphysical.dischargeQ > 0, 'Numeric Q remains positive');
assert.equal(assessFlow(nonphysical).state, 'nonphysical');
const subinterval = assessFlow(solve(narrowDip, .501, .6, 1, 4, 1));
assert.equal(subinterval.state, 'consistent');
assert.equal(subinterval.queryNegative, true);
assert.equal(assessFlow(zero).state, 'consistent');

for (const preset of presets) {
  const s = solve(preset.points, preset.targetX, preset.a, preset.b, preset.levels, preset.velocity);
  const stages = presentationOperations(s);
  assert.equal(stages.length, 4);
  const seen = new Set();
  for (const op of stages.flat()) {
    for (const phase of op.phases) if (phase.math) {
      katex.renderToString(phase.math, { throwOnError: true, strict: false }); formulasChecked++;
    }
    for (const operand of op.operands || []) katex.renderToString(operand.math, { throwOnError: true, strict: false });
    if (op.cell) {
      assert.equal(op.phases.length, 3);
      if (op.cell.upperParentId) assert.ok(seen.has(op.cell.upperParentId), 'First operand already calculated');
      if (op.cell.lowerParentId) assert.ok(seen.has(op.cell.lowerParentId), 'Second operand already calculated');
      seen.add(op.cell.id);
    }
  }
  assert.equal(seen.size, s.rombergColumns.flat().length);
}
console.log(`Verified numerical methods, convergence, flow interpretation, progressive presentation and ${formulasChecked} LaTeX expressions.`);
