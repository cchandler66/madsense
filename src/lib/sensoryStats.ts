/**
 * sensoryStats.ts
 * -----------------------------------------------------------------------------
 * Dependency-free statistical engine for a beer sensory QC program.
 *
 * Three things a serious internal tool should do that "approachable" software
 * keeps shallow:
 *   1. Difference tests  -> exact binomial significance (triangle, tetrad,
 *      duo-trio, 2-AFC), not just "more than half got it right".
 *   2. True-to-Target    -> a release decision backed by your acceptance
 *      threshold AND a test against your historical pass rate.
 *   3. Control charts     -> real I-MR limits + run rules that catch drift,
 *      instead of a hard-coded "hedonic <= 4" flag.
 *
 * No imports, no build step. Drop this file into your AI Studio project and
 * import the functions you need.
 * -----------------------------------------------------------------------------
 */

/* =============================================================================
 * 1. MATH PRIMITIVES (exact binomial, computed in log-space for stability)
 * ========================================================================== */

/** Natural log of the gamma function (Lanczos approximation, g = 7). */
function lgamma(x: number): number {
  const g = 7;
  const c = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ];
  if (x < 0.5) {
    // Reflection formula for the left half-plane.
    return (
      Math.log(Math.PI / Math.sin(Math.PI * x)) - lgamma(1 - x)
    );
  }
  x -= 1;
  let a = c[0];
  const t = x + g + 0.5;
  for (let i = 1; i < g + 2; i++) a += c[i] / (x + i);
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}

/** log( n choose k ). */
function logChoose(n: number, k: number): number {
  if (k < 0 || k > n) return -Infinity;
  return lgamma(n + 1) - lgamma(k + 1) - lgamma(n - k + 1);
}

/** Binomial probability mass: P(X = k) for X ~ Binomial(n, p). */
function binomPmf(k: number, n: number, p: number): number {
  if (k < 0 || k > n) return 0;
  if (p <= 0) return k === 0 ? 1 : 0;
  if (p >= 1) return k === n ? 1 : 0;
  const logP = logChoose(n, k) + k * Math.log(p) + (n - k) * Math.log(1 - p);
  return Math.exp(logP);
}

/** Upper tail: P(X >= x) for X ~ Binomial(n, p). One-sided p-value. */
function binomUpperTail(x: number, n: number, p: number): number {
  if (x <= 0) return 1;
  if (x > n) return 0;
  let sum = 0;
  for (let k = x; k <= n; k++) sum += binomPmf(k, n, p);
  return Math.min(1, sum);
}

/* =============================================================================
 * 2. DIFFERENCE TESTS
 * ========================================================================== */

export type DiffTestMethod = 'triangle' | 'tetrad' | 'duo-trio' | 'two-afc';

/** Guessing (chance) probability for each forced-choice method. */
export function guessingProbability(method: DiffTestMethod): number {
  switch (method) {
    case 'triangle':
    case 'tetrad':
      return 1 / 3;
    case 'duo-trio':
    case 'two-afc':
      return 1 / 2;
  }
}

export interface DiffTestResult {
  method: DiffTestMethod;
  n: number;
  correct: number;
  alpha: number;
  /** Chance probability of a correct answer by guessing. */
  pGuess: number;
  /** Observed proportion correct. */
  proportionCorrect: number;
  /** One-sided binomial p-value: P(X >= correct | n, pGuess). */
  pValue: number;
  /** True when pValue <= alpha (a perceptible difference is supported). */
  significant: boolean;
  /**
   * Estimated proportion of the population who can distinguish the samples,
   * corrected for guessing: Pd = (pc - pGuess) / (1 - pGuess), clamped >= 0.
   */
  pDistinguishers: number;
  /** Smallest number correct that would reach significance at this n & alpha. */
  minCorrectForSig: number | null;
  /** Plain-language QC conclusion. */
  conclusion: string;
}

/** Smallest x such that P(X >= x | n, p) <= alpha. Null if unreachable. */
function minimumCorrectForSignificance(
  n: number,
  p: number,
  alpha: number
): number | null {
  for (let x = 0; x <= n; x++) {
    if (binomUpperTail(x, n, p) <= alpha) return x;
  }
  return null;
}

/**
 * Analyze a forced-choice difference test.
 * @param method   triangle | tetrad | duo-trio | two-afc
 * @param n        total assessors / responses
 * @param correct  number of correct identifications
 * @param alpha    significance level (default 0.05)
 */
export function analyzeDifferenceTest(
  method: DiffTestMethod,
  n: number,
  correct: number,
  alpha = 0.05
): DiffTestResult {
  if (n <= 0) throw new Error('n must be positive');
  if (correct < 0 || correct > n)
    throw new Error('correct must be between 0 and n');

  const pGuess = guessingProbability(method);
  const proportionCorrect = correct / n;
  const pValue = binomUpperTail(correct, n, pGuess);
  const significant = pValue <= alpha;
  const pDistinguishers = Math.max(
    0,
    (proportionCorrect - pGuess) / (1 - pGuess)
  );
  const minCorrectForSig = minimumCorrectForSignificance(n, pGuess, alpha);

  const conclusion = significant
    ? `Significant difference detected (p = ${pValue.toFixed(4)} <= ${alpha}). ` +
      `Estimated ${(pDistinguishers * 100).toFixed(0)}% of tasters can tell the samples apart.`
    : `No significant difference (p = ${pValue.toFixed(4)} > ${alpha}). ` +
      (minCorrectForSig !== null
        ? `Would have needed >= ${minCorrectForSig} of ${n} correct.`
        : `Significance is not achievable with only ${n} assessors.`);

  return {
    method,
    n,
    correct,
    alpha,
    pGuess,
    proportionCorrect,
    pValue,
    significant,
    pDistinguishers,
    minCorrectForSig,
    conclusion,
  };
}

/* =============================================================================
 * 3. TRUE-TO-TARGET (release decision)
 * ========================================================================== */

export interface TrueToTargetOptions {
  /** Minimum proportion on-target required to pass on its own merits. */
  acceptanceThreshold?: number; // default 0.70
  /** Your established baseline off-target rate from history. */
  baselineOffTargetRate?: number; // default 0.20
  /** Significance level for the "worse than usual" test. */
  alpha?: number; // default 0.05
}

export interface TrueToTargetResult {
  n: number;
  onTarget: number;
  offTarget: number;
  proportionOnTarget: number;
  acceptanceThreshold: number;
  /** Meets the acceptance threshold on its own. */
  passByThreshold: boolean;
  baselineOffTargetRate: number;
  /** P(off-target >= observed | batch were at the baseline rate). */
  pValueWorseThanBaseline: number;
  /** This batch is statistically worse than your normal pass rate. */
  significantlyWorse: boolean;
  recommendation: 'release' | 'hold-review';
  conclusion: string;
}

/**
 * True-to-Target release analysis. Passes only when the batch clears your
 * acceptance threshold AND is not significantly worse than your baseline.
 */
export function analyzeTrueToTarget(
  n: number,
  onTarget: number,
  opts: TrueToTargetOptions = {}
): TrueToTargetResult {
  if (n <= 0) throw new Error('n must be positive');
  if (onTarget < 0 || onTarget > n)
    throw new Error('onTarget must be between 0 and n');

  const acceptanceThreshold = opts.acceptanceThreshold ?? 0.7;
  const baselineOffTargetRate = opts.baselineOffTargetRate ?? 0.2;
  const alpha = opts.alpha ?? 0.05;

  const offTarget = n - onTarget;
  const proportionOnTarget = onTarget / n;
  const passByThreshold = proportionOnTarget >= acceptanceThreshold;
  const pValueWorseThanBaseline = binomUpperTail(
    offTarget,
    n,
    baselineOffTargetRate
  );
  const significantlyWorse = pValueWorseThanBaseline <= alpha;

  const recommendation: 'release' | 'hold-review' =
    passByThreshold && !significantlyWorse ? 'release' : 'hold-review';

  const conclusion =
    recommendation === 'release'
      ? `Release. ${(proportionOnTarget * 100).toFixed(0)}% on-target, at or above ` +
        `the ${(acceptanceThreshold * 100).toFixed(0)}% bar and in line with your baseline.`
      : `Hold for review. ${(proportionOnTarget * 100).toFixed(0)}% on-target` +
        (!passByThreshold
          ? ` is below the ${(acceptanceThreshold * 100).toFixed(0)}% bar.`
          : `, but the off-target rate is significantly worse than baseline ` +
            `(p = ${pValueWorseThanBaseline.toFixed(4)}).`);

  return {
    n,
    onTarget,
    offTarget,
    proportionOnTarget,
    acceptanceThreshold,
    passByThreshold,
    baselineOffTargetRate,
    pValueWorseThanBaseline,
    significantlyWorse,
    recommendation,
    conclusion,
  };
}

export interface OffFlavorFlag {
  offFlavor: string;
  count: number;
  proportion: number;
  flagged: boolean;
}

/**
 * Flag any off-flavor cited by a critical share of the panel, independent of
 * the overall True-to-Target verdict. (e.g. half the panel detecting diacetyl
 * should hold a batch even if the headline numbers look fine.)
 */
export function criticalOffFlavorFlags(
  citationCounts: Record<string, number>,
  n: number,
  criticalThreshold = 0.5
): OffFlavorFlag[] {
  return Object.entries(citationCounts).map(([offFlavor, count]) => {
    const proportion = count / n;
    return {
      offFlavor,
      count,
      proportion,
      flagged: proportion >= criticalThreshold,
    };
  });
}

/* =============================================================================
 * 4. CONTROL CHARTS  (Individuals + Moving Range on per-batch attribute means)
 * ========================================================================== */

// Control-chart constants for a moving range of 2 consecutive points.
const D2_N2 = 1.128; // unbiasing constant -> sigma_hat = MRbar / d2
const D4_N2 = 3.267; // moving-range chart upper limit factor

export interface BatchPoint {
  batchId: string;
  value: number;
  date?: string;
}

export interface ControlChartOptions {
  /**
   * Fixed center line (your brand target). If omitted, the process mean of the
   * supplied points is used.
   */
  target?: number;
  /** Length of a one-sided run that signals a shift. Default 8. */
  runLength?: number;
  /** Length of a monotonic run that signals a trend/drift. Default 6. */
  trendLength?: number;
}

export interface ChartedPoint extends BatchPoint {
  /** Rule violations triggered at this point. */
  violations: string[];
}

export interface ControlChartResult {
  points: ChartedPoint[];
  centerLine: number;
  sigmaHat: number;
  ucl: number; // center + 3 sigma
  lcl: number; // center - 3 sigma
  mrBar: number;
  uclMovingRange: number;
  anyOutOfControl: boolean;
  rulesApplied: string[];
}

/**
 * Build an Individuals (I-MR) control chart over a time-ordered series of
 * per-batch attribute means and apply run rules that catch drift the way a
 * static threshold never will.
 *
 * Rules applied:
 *   - any point beyond +/- 3 sigma
 *   - \`runLength\` consecutive points on the same side of the center line
 *   - 2 of 3 consecutive points beyond +/- 2 sigma on the same side
 *   - \`trendLength\` consecutive strictly increasing or decreasing points
 */
export function buildControlChart(
  rawPoints: BatchPoint[],
  opts: ControlChartOptions = {}
): ControlChartResult {
  if (rawPoints.length < 2)
    throw new Error('Need at least 2 points to compute a moving range');

  const runLength = opts.runLength ?? 8;
  const trendLength = opts.trendLength ?? 6;
  const values = rawPoints.map((p) => p.value);

  const processMean =
    values.reduce((s, v) => s + v, 0) / values.length;
  const centerLine = opts.target ?? processMean;

  // Moving ranges of consecutive points.
  const movingRanges: number[] = [];
  for (let i = 1; i < values.length; i++)
    movingRanges.push(Math.abs(values[i] - values[i - 1]));
  const mrBar =
    movingRanges.reduce((s, v) => s + v, 0) / movingRanges.length;

  const sigmaHat = mrBar / D2_N2;
  const ucl = centerLine + 3 * sigmaHat;
  const lcl = centerLine - 3 * sigmaHat;
  const uclMovingRange = D4_N2 * mrBar;
  const twoSigmaUpper = centerLine + 2 * sigmaHat;
  const twoSigmaLower = centerLine - 2 * sigmaHat;

  // Per-point side relative to the center line: +1 above, -1 below, 0 on it.
  const side = values.map((v) =>
    v > centerLine ? 1 : v < centerLine ? -1 : 0
  );

  const points: ChartedPoint[] = rawPoints.map((p) => ({
    ...p,
    violations: [],
  }));

  for (let i = 0; i < values.length; i++) {
    const v = values[i];

    // Rule 1: beyond 3 sigma.
    if (v > ucl || v < lcl) points[i].violations.push('beyond-3-sigma');

    // Rule 2: runLength consecutive points on the same side.
    if (i >= runLength - 1) {
      const s = side[i];
      if (s !== 0) {
        let run = true;
        for (let j = i - runLength + 1; j <= i; j++)
          if (side[j] !== s) {
            run = false;
            break;
          }
        if (run) points[i].violations.push(`run-of-${runLength}-one-side`);
      }
    }

    // Rule 3: 2 of 3 consecutive beyond 2 sigma on the same side.
    if (i >= 2) {
      const window = [i - 2, i - 1, i];
      const aboveCount = window.filter((j) => values[j] > twoSigmaUpper).length;
      const belowCount = window.filter((j) => values[j] < twoSigmaLower).length;
      if (aboveCount >= 2 || belowCount >= 2)
        points[i].violations.push('2-of-3-beyond-2-sigma');
    }

    // Rule 4: trendLength consecutive strictly increasing or decreasing.
    if (i >= trendLength - 1) {
      let inc = true;
      let dec = true;
      for (let j = i - trendLength + 2; j <= i; j++) {
        if (!(values[j] > values[j - 1])) inc = false;
        if (!(values[j] < values[j - 1])) dec = false;
      }
      if (inc || dec)
        points[i].violations.push(`trend-of-${trendLength}`);
    }
  }

  const anyOutOfControl = points.some((p) => p.violations.length > 0);

  return {
    points,
    centerLine,
    sigmaHat,
    ucl,
    lcl,
    mrBar,
    uclMovingRange,
    anyOutOfControl,
    rulesApplied: [
      'beyond-3-sigma',
      `run-of-${runLength}-one-side`,
      '2-of-3-beyond-2-sigma',
      `trend-of-${trendLength}`,
    ],
  };
}
