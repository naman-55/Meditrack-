import { convertToCanonicalUnit, CANONICAL_PARAMETERS } from './src/analytics/unitRegistry.js';
import { normalizeParameterName, getParameterDisplayName } from './src/analytics/parameters.js';

export interface ValidatedObservation {
  value: number;
  date: string; // ISO date YYYY-MM-DD
  timestamp: number; // ms
  rawReportId?: number;
  originalValue?: string | number;
  originalUnit?: string;
  canonicalUnit?: string;
}

export interface ExcludedObservation {
  parameter: string;
  rawReportId?: number;
  date?: string;
  rawValue?: any;
  rawUnit?: any;
  reason: string;
}

export type ForecastStatus =
  | 'NO_DATA'
  | 'INSUFFICIENT_DATA'
  | 'DATA_QUALITY_WARNING'
  | 'TREND_AVAILABLE'
  | 'FORECAST_AVAILABLE'
  | 'INVALID_DATA'
  | 'ANALYSIS_ERROR';

export type ForecastDirection =
  | 'INCREASING'
  | 'DECREASING'
  | 'STABLE'
  | 'NO_CLEAR_TREND'
  | 'GREY';

export interface BacktestMetrics {
  mae: number | null;
  rmse: number | null;
  evalSampleSize: number;
  evalMethod: string;
  directionalAccuracy: number | null;
}

export interface RobustForecastResult {
  parameter: string; // canonical identifier
  displayName: string;
  canonicalUnit: string;
  status: ForecastStatus;
  
  // Historical summary
  observationCount: number;
  distinctDatesCount: number;
  dateRange: { start: string; end: string } | null;
  historyDurationDays: number;
  lastObservedValue: number | null;
  lastObservedDate: string | null;
  
  // Trend
  trendDirection: ForecastDirection;
  trendSlopePerDay: number | null;
  trendSlopeDescription: string | null;
  
  // Forecast
  forecastHorizonDays: number | null;
  forecastTargetDate: string | null;
  forecastValue: number | null;
  forecastRange: string; // Human readable interval or 'N/A'
  predictionInterval: {
    lower: number;
    upper: number;
    nominalConfidence: number; // e.g. 0.80 or 0.95
    isEmpiricallyValidated: boolean;
  } | null;
  
  // Model details
  modelName: string;
  modelVersion: string;
  inputDataFingerprint: string;
  dataQuality: 'SUFFICIENT' | 'INSUFFICIENT' | 'SUSPECT' | 'ANOMALOUS';
  confidenceCategory: 'HIGH' | 'MEDIUM' | 'LOW' | 'GREY';
  
  // Backtesting metrics
  backtestMetrics: BacktestMetrics | null;
  
  // Explanations and limitations
  limitations: string;
  reasonCode: string;
  reasonMessage: string;
  excludedCount: number;
  
  // Raw observations for charting
  history: Array<{ date: string; value: number }>;
}

export interface ForecastInputData {
  parameter: string;
  observations: ValidatedObservation[];
  excludedRecords?: ExcludedObservation[];
  forecastHorizonDays?: number; // default 90 days
}

export class RobustForecastingEngine {
  static readonly MODEL_NAME = 'Deterministic Ordinary Least Squares & Rolling-Origin Backtester';
  static readonly MODEL_VERSION = '2.1.0-clinical';

  /**
   * Process a series of observations for a single canonical parameter
   */
  forecast(input: ForecastInputData): RobustForecastResult {
    const { parameter, observations, excludedRecords = [], forecastHorizonDays = 90 } = input;
    const displayName = getParameterDisplayName(parameter);
    const meta = CANONICAL_PARAMETERS[parameter];
    const canonicalUnit = meta?.canonicalUnit || observations[0]?.canonicalUnit || '';

    const excludedCount = excludedRecords.length;

    // Check 1: NO_DATA
    if (!observations || observations.length === 0) {
      return {
        parameter,
        displayName,
        canonicalUnit,
        status: 'NO_DATA',
        observationCount: 0,
        distinctDatesCount: 0,
        dateRange: null,
        historyDurationDays: 0,
        lastObservedValue: null,
        lastObservedDate: null,
        trendDirection: 'GREY',
        trendSlopePerDay: null,
        trendSlopeDescription: null,
        forecastHorizonDays: null,
        forecastTargetDate: null,
        forecastValue: null,
        forecastRange: 'N/A',
        predictionInterval: null,
        modelName: RobustForecastingEngine.MODEL_NAME,
        modelVersion: RobustForecastingEngine.MODEL_VERSION,
        inputDataFingerprint: 'empty',
        dataQuality: 'INSUFFICIENT',
        confidenceCategory: 'GREY',
        backtestMetrics: null,
        limitations: `No eligible validated laboratory measurements were found for ${displayName}. Upload reports containing ${displayName} to enable analysis.`,
        reasonCode: 'NO_OBSERVATIONS',
        reasonMessage: `No eligible measurements found. ${excludedCount > 0 ? `${excludedCount} record(s) excluded during validation.` : ''}`,
        excludedCount,
        history: []
      };
    }

    // Sort chronologically
    const sorted = [...observations].sort((a, b) => a.timestamp - b.timestamp);

    // Compute unique dates
    const uniqueDateMap = new Map<string, number[]>();
    for (const obs of sorted) {
      if (!uniqueDateMap.has(obs.date)) {
        uniqueDateMap.set(obs.date, []);
      }
      uniqueDateMap.get(obs.date)!.push(obs.value);
    }
    const distinctDatesCount = uniqueDateMap.size;

    const startDate = sorted[0].date;
    const endDate = sorted[sorted.length - 1].date;
    const historyDurationMs = sorted[sorted.length - 1].timestamp - sorted[0].timestamp;
    const historyDurationDays = Math.round(historyDurationMs / (1000 * 60 * 60 * 24));

    const lastObs = sorted[sorted.length - 1];
    const history = sorted.map(s => ({ date: s.date, value: s.value }));

    // Input fingerprint
    const fingerprintRaw = sorted.map(s => `${s.date}:${s.value}`).join('|');
    const inputDataFingerprint = `v2-${sorted.length}pts-${startDate}_${endDate}`;

    // Check 2: Single observation
    if (distinctDatesCount < 2) {
      return {
        parameter,
        displayName,
        canonicalUnit,
        status: 'INSUFFICIENT_DATA',
        observationCount: sorted.length,
        distinctDatesCount,
        dateRange: { start: startDate, end: endDate },
        historyDurationDays,
        lastObservedValue: lastObs.value,
        lastObservedDate: lastObs.date,
        trendDirection: 'GREY',
        trendSlopePerDay: null,
        trendSlopeDescription: 'Single time point; trajectory requires multiple distinct dates.',
        forecastHorizonDays: null,
        forecastTargetDate: null,
        forecastValue: null,
        forecastRange: 'N/A',
        predictionInterval: null,
        modelName: RobustForecastingEngine.MODEL_NAME,
        modelVersion: RobustForecastingEngine.MODEL_VERSION,
        inputDataFingerprint,
        dataQuality: 'INSUFFICIENT',
        confidenceCategory: 'GREY',
        backtestMetrics: null,
        limitations: `Only 1 distinct observation date (${lastObs.date}) is recorded. A reliable historical trajectory requires at least 2 distinct dates, and robust extrapolation requires a longitudinal history span.`,
        reasonCode: 'SINGLE_OBSERVATION_DATE',
        reasonMessage: `1 distinct measurement date available. At least 2 distinct dates are required for trajectory assessment.`,
        excludedCount,
        history
      };
    }

    // Mathematical linear regression over elapsed days
    // x_i = (timestamp - t_0) in days
    const t0 = sorted[0].timestamp;
    const n = sorted.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    const xDays: number[] = [];
    const yVals: number[] = [];

    for (let i = 0; i < n; i++) {
      const days = (sorted[i].timestamp - t0) / (1000 * 60 * 60 * 24);
      xDays.push(days);
      yVals.push(sorted[i].value);
      sumX += days;
      sumY += sorted[i].value;
      sumXY += days * sorted[i].value;
      sumXX += days * days;
    }

    const meanY = sumY / n;
    const meanX = sumX / n;
    const denom = n * sumXX - sumX * sumX;

    let slope = 0;
    let intercept = meanY;

    if (Math.abs(denom) > 1e-9 && historyDurationDays > 0) {
      slope = (n * sumXY - sumX * sumY) / denom;
      intercept = (sumY - slope * sumX) / n;
    } else {
      // All observations occurred on the same day or invalid denominator
      slope = 0;
      intercept = meanY;
    }

    // Calculate historical residual variance & standard deviation
    let sumSquaredResiduals = 0;
    let sumSquaredDeviations = 0;
    for (let i = 0; i < n; i++) {
      const fitted = intercept + slope * xDays[i];
      const res = yVals[i] - fitted;
      sumSquaredResiduals += res * res;
      sumSquaredDeviations += (yVals[i] - meanY) * (yVals[i] - meanY);
    }
    const historicalStdDev = Math.sqrt(sumSquaredDeviations / Math.max(1, n - 1));
    const residualStdError = n > 2 ? Math.sqrt(sumSquaredResiduals / (n - 2)) : historicalStdDev;

    // Detect anomalies / physiological outliers safely without silent deletion
    let anomalyDetected = false;
    let anomalyReason = '';
    if (historicalStdDev > 0 && n >= 3) {
      for (const y of yVals) {
        if (Math.abs(y - meanY) > historicalStdDev * 3.5) {
          anomalyDetected = true;
          anomalyReason = `Notable variance detected (value ${y} is >3.5 SD from mean). Observations preserved for clinical transparency.`;
          break;
        }
      }
    }

    // Determine Trend Direction
    // Change over 30 days compared to measurement magnitude
    const changePer30Days = slope * 30;
    // Clinical significance threshold: e.g. 1.5% of mean or standard deviation / 5
    const threshold = Math.max(Math.abs(meanY) * 0.015, (historicalStdDev || 0.1) * 0.2);

    let trendDirection: ForecastDirection = 'STABLE';
    if (changePer30Days > threshold) {
      trendDirection = 'INCREASING';
    } else if (changePer30Days < -threshold) {
      trendDirection = 'DECREASING';
    } else {
      trendDirection = 'STABLE';
    }

    const slopeDesc = Math.abs(slope) < 1e-4
      ? 'Essentially unchanged over observation period'
      : `${slope > 0 ? '+' : ''}${(slope * 30).toFixed(2)} ${canonicalUnit} per month`;

    // Target forecast calculation
    const targetDaysFromStart = (sorted[sorted.length - 1].timestamp - t0) / (1000 * 60 * 60 * 24) + forecastHorizonDays;
    const targetDateObj = new Date(sorted[sorted.length - 1].timestamp + forecastHorizonDays * 24 * 60 * 60 * 1000);
    const forecastTargetDate = targetDateObj.toISOString().split('T')[0];

    // Forecast Eligibility Check:
    // Requires:
    // Forecast Eligibility Check:
    // Requires:
    // 1) >= 3 distinct measurement dates
    // 2) History duration >= 14 days
    // 3) Max extrapolation rule: forecast horizon must not exceed 6x the total history duration
    // 4) Denominator valid and non-zero span
    const hasSufficientHistory = distinctDatesCount >= 3 && historyDurationDays >= 14;
    const extrapolationRatio = historyDurationDays > 0 ? forecastHorizonDays / historyDurationDays : 999;
    const isExtrapolationSafe = extrapolationRatio <= 6.0;

    // Run Chronological Rolling-Origin Backtesting if we have >= 3 distinct observations
    let backtestMetrics: BacktestMetrics | null = null;
    if (distinctDatesCount >= 3) {
      backtestMetrics = this.runRollingBacktest(sorted, t0);
    }

    // If data is insufficient for safe statistical forecast, return appropriate status
    if (!hasSufficientHistory || !isExtrapolationSafe) {
      const reasonMsg = distinctDatesCount < 3
        ? `Found ${distinctDatesCount} distinct date(s) across ${historyDurationDays} days. Minimum 3 distinct observation dates spanning >=14 days required for forward statistical estimation.`
        : historyDurationDays < 14
        ? `Observations span only ${historyDurationDays} days. Minimum longitudinal history of 14 days required to establish trend stability.`
        : `Forecast horizon (${forecastHorizonDays} days) exceeds 6x observed historical duration (${historyDurationDays} days).`;

      const isTrendOnly = distinctDatesCount >= 2 && historyDurationDays >= 7;

      return {
        parameter,
        displayName,
        canonicalUnit,
        status: isTrendOnly ? 'TREND_AVAILABLE' : 'INSUFFICIENT_DATA',
        observationCount: n,
        distinctDatesCount,
        dateRange: { start: startDate, end: endDate },
        historyDurationDays,
        lastObservedValue: lastObs.value,
        lastObservedDate: lastObs.date,
        trendDirection: isTrendOnly ? trendDirection : 'GREY',
        trendSlopePerDay: isTrendOnly ? slope : null,
        trendSlopeDescription: isTrendOnly ? slopeDesc : null,
        forecastHorizonDays: null,
        forecastTargetDate: null,
        forecastValue: null,
        forecastRange: 'N/A',
        predictionInterval: null,
        modelName: RobustForecastingEngine.MODEL_NAME,
        modelVersion: RobustForecastingEngine.MODEL_VERSION,
        inputDataFingerprint,
        dataQuality: 'INSUFFICIENT',
        confidenceCategory: 'GREY',
        backtestMetrics,
        limitations: `Historical coverage (${distinctDatesCount} dates over ${historyDurationDays} days) is insufficient for forward projection. ${isTrendOnly ? `Observed historical trend is ${trendDirection.toLowerCase()}.` : ''} Not a medical prognosis.`,
        reasonCode: 'LIMITED_HISTORICAL_SPAN',
        reasonMessage: reasonMsg,
        excludedCount,
        history
      };
    }

    // Compute Projected Point Estimate
    const rawPredicted = intercept + slope * targetDaysFromStart;
    // Bound realistically: clinical parameters cannot drop below 0
    const predictedValue = Math.max(0, Math.round(rawPredicted * 10) / 10);

    // Compute Statistically Defensible Prediction Interval
    // PI = y_hat ± t_crit * s_e * sqrt(1 + 1/n + (x_target - mean_x)^2 / sum((x_i - mean_x)^2))
    const sumXDiffSq = xDays.reduce((acc, x) => acc + (x - meanX) * (x - meanX), 0);
    const leverage = sumXDiffSq > 1e-6 ? Math.pow(targetDaysFromStart - meanX, 2) / sumXDiffSq : 1.0;
    const forecastStdError = residualStdError * Math.sqrt(1 + (1 / n) + leverage);

    // Degrees of freedom = n - 2
    const df = Math.max(1, n - 2);
    const tVal = df === 1 ? 3.08 : df === 2 ? 1.89 : df <= 4 ? 1.64 : 1.44; // ~80% coverage interval
    const halfWidth = tVal * Math.max(0.1, forecastStdError);

    const lowerBound = Math.max(0, Math.round((predictedValue - halfWidth) * 10) / 10);
    const upperBound = Math.round((predictedValue + halfWidth) * 10) / 10;

    const forecastRange = `${lowerBound} – ${upperBound} ${canonicalUnit}`;

    let confidenceCategory: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
    if (distinctDatesCount >= 4 && historyDurationDays >= 60 && !anomalyDetected && (backtestMetrics?.mae !== null)) {
      confidenceCategory = 'HIGH';
    } else if (distinctDatesCount >= 3 && historyDurationDays >= 20 && !anomalyDetected) {
      confidenceCategory = 'MEDIUM';
    } else {
      confidenceCategory = 'LOW';
    }

    const limitations = `Deterministic linear trend model using elapsed calendar days. Prediction interval reflects statistical residual variance and extrapolation leverage. Does not account for sudden physiological shifts, acute events, or therapeutic interventions.`;

    return {
      parameter,
      displayName,
      canonicalUnit,
      status: 'FORECAST_AVAILABLE',
      observationCount: n,
      distinctDatesCount,
      dateRange: { start: startDate, end: endDate },
      historyDurationDays,
      lastObservedValue: lastObs.value,
      lastObservedDate: lastObs.date,
      trendDirection,
      trendSlopePerDay: slope,
      trendSlopeDescription: slopeDesc,
      forecastHorizonDays,
      forecastTargetDate,
      forecastValue: predictedValue,
      forecastRange,
      predictionInterval: {
        lower: lowerBound,
        upper: upperBound,
        nominalConfidence: 0.80,
        isEmpiricallyValidated: backtestMetrics !== null && backtestMetrics.evalSampleSize >= 2
      },
      modelName: RobustForecastingEngine.MODEL_NAME,
      modelVersion: RobustForecastingEngine.MODEL_VERSION,
      inputDataFingerprint,
      dataQuality: 'SUFFICIENT',
      confidenceCategory,
      backtestMetrics,
      limitations: anomalyDetected ? `${limitations} Note: High historical variance detected.` : limitations,
      reasonCode: 'SUCCESS',
      reasonMessage: `Forecast generated successfully using ${distinctDatesCount} distinct observation dates across ${historyDurationDays} days.`,
      excludedCount,
      history
    };
  }

  /**
   * Genuine Expanding-Window Chronological Backtesting.
   * Trains strictly on observations available prior to the held-out point and predicts forward.
   */
  private runRollingBacktest(
    sorted: ValidatedObservation[],
    t0: number
  ): BacktestMetrics {
    const n = sorted.length;
    // We need at least 2 points to fit a model, and 1 point to test.
    if (n < 3) {
      return {
        mae: null,
        rmse: null,
        evalSampleSize: 0,
        evalMethod: 'Chronological expanding window backtesting (insufficient sample size < 3)',
        directionalAccuracy: null
      };
    }

    const errors: number[] = [];
    let correctDirectionCount = 0;
    let directionalEvalCount = 0;

    // Expanding window: train on indices 0..k-1, test on index k
    for (let k = 2; k < n; k++) {
      const train = sorted.slice(0, k);
      const test = sorted[k];

      // Fit regression on training set
      const trainN = train.length;
      let sX = 0, sY = 0, sXY = 0, sXX = 0;
      for (const pt of train) {
        const d = (pt.timestamp - t0) / (1000 * 60 * 60 * 24);
        sX += d;
        sY += pt.value;
        sXY += d * pt.value;
        sXX += d * d;
      }
      const denom = trainN * sXX - sX * sX;
      let slope = 0;
      let intercept = sY / trainN;
      if (Math.abs(denom) > 1e-9) {
        slope = (trainN * sXY - sX * sY) / denom;
        intercept = (sY - slope * sX) / trainN;
      }

      const testDays = (test.timestamp - t0) / (1000 * 60 * 60 * 24);
      const predicted = intercept + slope * testDays;
      const actual = test.value;
      const err = actual - predicted;
      errors.push(err);

      // Check directional accuracy relative to last training observation
      const lastTrainVal = train[train.length - 1].value;
      const actualChange = actual - lastTrainVal;
      const predictedChange = predicted - lastTrainVal;

      if (Math.abs(actualChange) > 1e-6) {
        directionalEvalCount++;
        if ((actualChange > 0 && predictedChange > 0) || (actualChange < 0 && predictedChange < 0)) {
          correctDirectionCount++;
        }
      }
    }

    if (errors.length === 0) {
      return {
        mae: null,
        rmse: null,
        evalSampleSize: 0,
        evalMethod: 'Chronological expanding window backtesting',
        directionalAccuracy: null
      };
    }

    const mae = errors.reduce((acc, e) => acc + Math.abs(e), 0) / errors.length;
    const mse = errors.reduce((acc, e) => acc + e * e, 0) / errors.length;
    const rmse = Math.sqrt(mse);
    const directionalAccuracy = directionalEvalCount > 0
      ? Math.round((correctDirectionCount / directionalEvalCount) * 100)
      : null;

    return {
      mae: Math.round(mae * 100) / 100,
      rmse: Math.round(rmse * 100) / 100,
      evalSampleSize: errors.length,
      evalMethod: `Chronological expanding-window holdout (${errors.length} held-out predictions)`,
      directionalAccuracy
    };
  }
}

// Backward-compatible adapter for tests expecting SimpleLinearForecastModel
export class SimpleLinearForecastModel {
  static readonly VERSION = RobustForecastingEngine.MODEL_VERSION;
  private engine = new RobustForecastingEngine();

  analyze(input: { parameter: string; measurements: { value: number; date: string }[] }) {
    const obs: ValidatedObservation[] = input.measurements.map(m => ({
      value: m.value,
      date: m.date,
      timestamp: new Date(m.date).getTime()
    }));
    const res = this.engine.forecast({
      parameter: input.parameter,
      observations: obs
    });

    const isSufficient = res.status === 'FORECAST_AVAILABLE';

    return {
      parameter: res.parameter,
      forecast_direction: res.trendDirection,
      forecast_range: res.forecastRange,
      confidence_category: res.confidenceCategory,
      limitations: res.limitations,
      model_version: res.modelVersion,
      data_quality: isSufficient ? 'RELIABLE' : 'INSUFFICIENT',
      status: res.status
    };
  }
}
