/**
 * panelistStats.ts
 * -----------------------------------------------------------------------------
 * Panelist-performance engine for a beer sensory program.
 *
 * Scores every taster the way ISO 11132 intends, plus the brewery-specific
 * piece that matters most:
 *
 *   1. Discrimination          -> are they correct above chance on difference
 *                                 tests? (binomial test)
 *   2. Off-flavor recognition  -> signal-detection d' from hits vs. false
 *                                 alarms on spiked samples. Who can actually
 *                                 catch diacetyl, and who just guesses?
 *   3. Repeatability           -> do they reproduce their own scores on blind
 *                                 duplicates? (pooled within-sample SD)
 *   4. Agreement               -> do they track with the panel, and do they
 *                                 run lenient or severe? (correlation + bias)
 *   5. Scorecard               -> one call rolls it into qualified / monitor /
 *                                 retrain, with reasons.
 *
 * Standalone, dependency-free. Feed `rollingAccuracy()` output into
 * `buildControlChart()` from sensoryStats.ts to chart a taster's drift.
 * -----------------------------------------------------------------------------
 */

export type DiffTestMethod = 'triangle' | 'tetrad' | 'duo-trio' | 'two-afc';

/* =============================================================================
 * MATH PRIMITIVES (self-contained)
 * ========================================================================== */

function lgamma(x: number): number {
  const g = 7;
  const c = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ];
  if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - lgamma(1 - x);
  x -= 1;
  let a = c[0];
  const t = x + g + 0.5;
  for (let i = 1; i < g + 2; i++) a += c[i] / (x + i);
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}

function binomPmf(k: number, n: number, p: number): number {
  if (k < 0 || k > n) return 0;
  if (p <= 0) return k === 0 ? 1 : 0;
  if (p >= 1) return k === n ? 1 : 0;
  const logP =
    lgamma(n + 1) - lgamma(k + 1) - lgamma(n - k + 1) +
    k * Math.log(p) + (n - k) * Math.log(1 - p);
  return Math.exp(logP);
}

/** P(X >= x) for X ~ Binomial(n, p). */
function binomUpperTail(x: number, n: number, p: number): number {
  if (x <= 0) return 1;
  if (x > n) return 0;
  let sum = 0;
  for (let k = x; k <= n; k++) sum += binomPmf(k, n, p);
  return Math.min(1, sum);
}

function mean(xs: number[]): number {
  return xs.reduce((s, v) => s + v, 0) / xs.length;
}

function pearson(xs: number[], ys: number[]): number {
  const n = xs.length;
  if (n < 2 || n !== ys.length) return NaN;
  const mx = mean(xs);
  const my = mean(ys);
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - mx;
    const dy = ys[i] - my;
    sxy += dx * dy;
    sxx += dx * dx;
    syy += dy * dy;
  }
  if (sxx === 0 || syy === 0) return NaN;
  return sxy / Math.sqrt(sxx * syy);
}

/** Inverse standard-normal CDF (probit) via Acklam's algorithm. ~1e-9 accurate. */
function probit(p: number): number {
  const a = [
    -3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2,
    1.38357751867269e2, -3.066479806614716e1, 2.506628277459239,
  ];
  const b = [
    -5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2,
    6.680131188771972e1, -1.328068155288572e1,
  ];
  const c = [
    -7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838,
    -2.549732539343734, 4.374664141464968, 2.938163982698783,
  ];
  const d = [
    7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996,
    3.754408661907416,
  ];
  const plow = 0.02425;
  const phigh = 1 - plow;
  let q: number;
  if (p < plow) {
    q = Math.sqrt(-2 * Math.log(p));
    return (
      (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    );
  } else if (p <= phigh) {
    q = p - 0.5;
    const r = q * q;
    return (
      ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) *
        q) /
      (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
    );
  } else {
    q = Math.sqrt(-2 * Math.log(1 - p));
    return -(
      (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    );
  }
}

function guessingProbability(method: DiffTestMethod): number {
  return method === 'triangle' || method === 'tetrad' ? 1 / 3 : 1 / 2;
}

/* =============================================================================
 * 1. DISCRIMINATION (difference-test accuracy vs. chance)
 * ========================================================================== */

export interface DiscriminationResult {
  method: DiffTestMethod;
  nTests: number;
  nCorrect: number;
  correctRate: number;
  chance: number;
  /** P(this many or more correct if they were guessing). Lower = better. */
  pValueAboveChance: number;
  /** True when performance is significantly above chance. */
  isDiscriminator: boolean;
  conclusion: string;
}

/**
 * Is this taster correct above chance on a given difference-test method?
 * Run once per method if a taster does more than one type.
 */
export function assessDiscrimination(
  method: DiffTestMethod,
  nTests: number,
  nCorrect: number,
  alpha = 0.05
): DiscriminationResult {
  if (nTests <= 0) throw new Error('nTests must be positive');
  if (nCorrect < 0 || nCorrect > nTests)
    throw new Error('nCorrect must be between 0 and nTests');
  const chance = guessingProbability(method);
  const correctRate = nCorrect / nTests;
  const pValueAboveChance = binomUpperTail(nCorrect, nTests, chance);
  const isDiscriminator = pValueAboveChance <= alpha;
  return {
    method,
    nTests,
    nCorrect,
    correctRate,
    chance,
    pValueAboveChance,
    isDiscriminator,
    conclusion: isDiscriminator
      ? `Reliable discriminator: ${nCorrect}/${nTests} correct (p = ${pValueAboveChance.toFixed(
          4
        )}).`
      : `Not above chance: ${nCorrect}/${nTests} correct (p = ${pValueAboveChance.toFixed(
          4
        )}). Watch or retrain.`,
  };
}

/* =============================================================================
 * 2. OFF-FLAVOR RECOGNITION (signal detection theory)
 * ========================================================================== */

export interface OffFlavorTrial {
  offFlavor: string;
  /** Was this sample actually spiked with the compound? */
  spiked: boolean;
  /** Did the taster report detecting it? */
  detected: boolean;
}

export interface OffFlavorRecognition {
  offFlavor: string;
  nSpiked: number;
  hits: number;
  hitRate: number;
  nBlank: number;
  falseAlarms: number;
  falseAlarmRate: number;
  /**
   * Sensitivity d' = z(hitRate) - z(falseAlarmRate), with the Hautus
   * log-linear correction so perfect/zero rates don't blow up. Higher = better.
   * Rough guide: ~1 weak, ~2 solid, >3 excellent.
   */
  dPrime: number;
  /** Response bias c. Positive = conservative (under-reports). */
  criterion: number;
}

/**
 * Per-off-flavor recognition profile from spiked-and-blank training trials.
 * Pass every trial for one taster; results are grouped by off-flavor.
 */
export function assessOffFlavorRecognition(
  trials: OffFlavorTrial[]
): OffFlavorRecognition[] {
  const groups: Record<string, OffFlavorTrial[]> = {};
  for (const t of trials) (groups[t.offFlavor] ??= []).push(t);

  return Object.entries(groups).map(([offFlavor, ts]) => {
    const spiked = ts.filter((t) => t.spiked);
    const blank = ts.filter((t) => !t.spiked);
    const hits = spiked.filter((t) => t.detected).length;
    const falseAlarms = blank.filter((t) => t.detected).length;
    const nSpiked = spiked.length;
    const nBlank = blank.length;

    const hitRate = nSpiked ? hits / nSpiked : NaN;
    const falseAlarmRate = nBlank ? falseAlarms / nBlank : NaN;

    // Hautus (1995) log-linear correction for d'.
    const hAdj = (hits + 0.5) / (nSpiked + 1);
    const faAdj = (falseAlarms + 0.5) / (nBlank + 1);
    const zH = probit(hAdj);
    const zFA = probit(faAdj);
    const dPrime = zH - zFA;
    const criterion = -0.5 * (zH + zFA);

    return {
      offFlavor,
      nSpiked,
      hits,
      hitRate,
      nBlank,
      falseAlarms,
      falseAlarmRate,
      dPrime,
      criterion,
    };
  });
}

/* =============================================================================
 * 3. REPEATABILITY (blind duplicates / replicates)
 * ========================================================================== */

export interface ReplicateRecord {
  sampleId: string;
  /** Repeat scores the same taster gave the same blind sample. */
  values: number[];
}

export interface RepeatabilityResult {
  nSamplesWithReplicates: number;
  /** Pooled within-sample standard deviation. Lower = more repeatable. */
  repeatabilitySD: number;
  tolerance: number;
  isRepeatable: boolean;
  conclusion: string;
}

/**
 * Pooled within-sample SD across all blind duplicates. On a 0-10 intensity
 * scale, a tolerance around 1.0 is a reasonable starting bar.
 */
export function assessRepeatability(
  records: ReplicateRecord[],
  tolerance = 1.0
): RepeatabilityResult {
  let ssWithin = 0;
  let dfWithin = 0;
  let used = 0;
  for (const r of records) {
    if (r.values.length < 2) continue;
    used++;
    const m = mean(r.values);
    for (const v of r.values) ssWithin += (v - m) * (v - m);
    dfWithin += r.values.length - 1;
  }
  const repeatabilitySD = dfWithin > 0 ? Math.sqrt(ssWithin / dfWithin) : NaN;
  const isRepeatable = !Number.isNaN(repeatabilitySD) && repeatabilitySD <= tolerance;
  return {
    nSamplesWithReplicates: used,
    repeatabilitySD,
    tolerance,
    isRepeatable,
    conclusion: Number.isNaN(repeatabilitySD)
      ? 'No replicate data yet.'
      : isRepeatable
      ? `Repeatable (within-sample SD = ${repeatabilitySD.toFixed(2)} <= ${tolerance}).`
      : `Inconsistent (within-sample SD = ${repeatabilitySD.toFixed(
          2
        )} > ${tolerance}). Coach on anchoring to the scale.`,
  };
}

/* =============================================================================
 * 4. AGREEMENT WITH THE PANEL + SCALE BIAS
 * ========================================================================== */

export interface PanelEval {
  sampleId: string;
  panelistValue: number;
  /** Panel mean for that sample/attribute (exclude this taster if you can). */
  panelMean: number;
}

export interface AgreementResult {
  n: number;
  /** Correlation between the taster's scores and the panel's. */
  correlationWithPanel: number;
  /** Mean signed deviation: + runs high (lenient), - runs low (severe). */
  bias: number;
  /** Mean absolute deviation from the panel. */
  meanAbsoluteDeviation: number;
  scaleTendency: 'lenient' | 'severe' | 'centered';
  conclusion: string;
}

export function assessAgreement(
  evals: PanelEval[],
  biasTolerance = 0.75
): AgreementResult {
  const n = evals.length;
  const pv = evals.map((e) => e.panelistValue);
  const pm = evals.map((e) => e.panelMean);
  const correlationWithPanel = pearson(pv, pm);
  const deviations = evals.map((e) => e.panelistValue - e.panelMean);
  const bias = mean(deviations);
  const meanAbsoluteDeviation = mean(deviations.map(Math.abs));
  const scaleTendency =
    bias > biasTolerance ? 'lenient' : bias < -biasTolerance ? 'severe' : 'centered';
  return {
    n,
    correlationWithPanel,
    bias,
    meanAbsoluteDeviation,
    scaleTendency,
    conclusion:
      `Correlation with panel = ${correlationWithPanel.toFixed(2)}; ` +
      (scaleTendency === 'centered'
        ? `well-centered (bias ${bias >= 0 ? '+' : ''}${bias.toFixed(2)}).`
        : `runs ${scaleTendency} (bias ${bias >= 0 ? '+' : ''}${bias.toFixed(
            2
          )}) — correct for this when reading their scores.`),
  };
}

/* =============================================================================
 * 5. SCORECARD (qualified / monitor / retrain)
 * ========================================================================== */

export interface ScorecardInputs {
  panelistId: string;
  discrimination?: DiscriminationResult;
  repeatability?: RepeatabilityResult;
  agreement?: AgreementResult;
}

export interface ScorecardThresholds {
  minCorrelation?: number; // default 0.6
}

export interface Scorecard {
  panelistId: string;
  status: 'qualified' | 'monitor' | 'retrain';
  reasons: string[];
}

/**
 * Roll the available axes into a single qualification status. Any axis you
 * don't pass in is simply skipped, so this works with partial data.
 */
export function panelistScorecard(
  inputs: ScorecardInputs,
  thresholds: ScorecardThresholds = {}
): Scorecard {
  const minCorrelation = thresholds.minCorrelation ?? 0.6;
  const reasons: string[] = [];
  let fails = 0;
  let hardFail = false;

  if (inputs.discrimination) {
    if (inputs.discrimination.isDiscriminator) {
      reasons.push('Discriminates above chance.');
    } else {
      reasons.push('Not above chance on difference tests.');
      fails++;
      hardFail = true; // can't tell samples apart -> primary failure
    }
  }
  if (inputs.repeatability && !Number.isNaN(inputs.repeatability.repeatabilitySD)) {
    if (inputs.repeatability.isRepeatable) {
      reasons.push('Repeatable on blind duplicates.');
    } else {
      reasons.push('Inconsistent on blind duplicates.');
      fails++;
    }
  }
  if (inputs.agreement && !Number.isNaN(inputs.agreement.correlationWithPanel)) {
    if (inputs.agreement.correlationWithPanel >= minCorrelation) {
      reasons.push('Tracks with the panel.');
    } else {
      reasons.push('Low correlation with the panel.');
      fails++;
    }
    if (inputs.agreement.scaleTendency !== 'centered') {
      reasons.push(`Scale bias: runs ${inputs.agreement.scaleTendency}.`);
    }
  }

  let status: Scorecard['status'];
  if (hardFail || fails >= 2) status = 'retrain';
  else if (fails === 1) status = 'monitor';
  else status = 'qualified';

  return { panelistId: inputs.panelistId, status, reasons };
}

/* =============================================================================
 * 6. ROLLING ACCURACY (feed into buildControlChart for drift detection)
 * ========================================================================== */

/**
 * Convert a time-ordered list of correct/incorrect outcomes into a rolling
 * hit-rate series. Pipe the result into buildControlChart() from
 * sensoryStats.ts to flag a taster whose performance is sliding.
 */
export function rollingAccuracy(
  orderedOutcomes: boolean[],
  windowSize = 10
): { index: number; accuracy: number }[] {
  const out: { index: number; accuracy: number }[] = [];
  for (let i = 0; i < orderedOutcomes.length; i++) {
    const start = Math.max(0, i - windowSize + 1);
    const window = orderedOutcomes.slice(start, i + 1);
    const acc = window.filter(Boolean).length / window.length;
    out.push({ index: i, accuracy: acc });
  }
  return out;
}
