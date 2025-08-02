/**
 * Evaluation metrics utilities for comparing predictions against ground truth
 */

import { Selection } from '../model/types';

/**
 * Evaluation results interface
 */
export interface EvaluationMetrics {
  /** True positives count */
  truePositives: number;
  /** False positives count */
  falsePositives: number;
  /** False negatives count */
  falseNegatives: number;
  /** True negatives count (not applicable for click detection) */
  trueNegatives: number;
  /** Precision (TP / (TP + FP)) */
  precision: number;
  /** Recall (TP / (TP + FN)) */
  recall: number;
  /** F1 score (2 * precision * recall / (precision + recall)) */
  f1Score: number;
  /** Tolerance used for matching (in seconds) */
  tolerance: number;
  /** Total ground truth clicks */
  totalGroundTruth: number;
  /** Total predictions */
  totalPredictions: number;
}

/**
 * Calculate evaluation metrics comparing predictions against ground truth
 * 
 * @param groundTruth - Array of ground truth selections (true clicks)
 * @param predictions - Array of prediction selections (LSTM predictions)
 * @param toleranceMs - Tolerance for matching in milliseconds (default: 0.5ms)
 * @param audioId - Audio ID to filter selections for
 * @returns EvaluationMetrics object
 */
export function calculateEvaluationMetrics(
  groundTruth: Selection[],
  predictions: Selection[],
  toleranceMs: number = 0.5,
  audioId?: string
): EvaluationMetrics {
  // Filter selections by audio ID if specified
  const filteredGroundTruth = audioId
    ? groundTruth.filter(sel => sel.audioId === audioId)
    : groundTruth;

  const filteredPredictions = audioId
    ? predictions.filter(sel => sel.audioId === audioId)
    : predictions;

  const toleranceSeconds = toleranceMs / 1000; // Convert ms to seconds

  // Extract timestamps for easier comparison
  const truthTimestamps = filteredGroundTruth.map(sel => sel.beginTime).sort((a, b) => a - b);
  const predictionTimestamps = filteredPredictions.map(sel => sel.beginTime).sort((a, b) => a - b);

  let truePositives = 0;
  let falsePositives = 0;
  const matchedTruthIndices = new Set<number>();

  // For each prediction, check if it matches any ground truth within tolerance
  for (const predTime of predictionTimestamps) {
    let isMatched = false;

    for (let i = 0; i < truthTimestamps.length; i++) {
      const truthTime = truthTimestamps[i];

      // Check if prediction is within tolerance of this ground truth
      if (Math.abs(predTime - truthTime) <= toleranceSeconds) {
        // Only count as TP if this ground truth hasn't been matched yet
        if (!matchedTruthIndices.has(i)) {
          truePositives++;
          matchedTruthIndices.add(i);
          isMatched = true;
          break;
        }
      }
    }

    if (!isMatched) {
      falsePositives++;
    }
  }

  // False negatives are ground truth clicks that weren't matched by any prediction
  const falseNegatives = truthTimestamps.length - matchedTruthIndices.size;

  // True negatives are not meaningful in click detection (infinite non-click regions)
  const trueNegatives = 0;

  // Calculate metrics
  const precision = truePositives + falsePositives > 0
    ? truePositives / (truePositives + falsePositives)
    : 0;

  const recall = truePositives + falseNegatives > 0
    ? truePositives / (truePositives + falseNegatives)
    : 0;

  const f1Score = precision + recall > 0
    ? 2 * (precision * recall) / (precision + recall)
    : 0;

  return {
    truePositives,
    falsePositives,
    falseNegatives,
    trueNegatives,
    precision,
    recall,
    f1Score,
    tolerance: toleranceMs,
    totalGroundTruth: filteredGroundTruth.length,
    totalPredictions: filteredPredictions.length
  };
}

/**
 * Format evaluation metrics for display
 */
export function formatEvaluationMetrics(metrics: EvaluationMetrics): string {
  const precision = (metrics.precision * 100).toFixed(1);
  const recall = (metrics.recall * 100).toFixed(1);
  const f1 = (metrics.f1Score * 100).toFixed(1);

  return `F1: ${f1}% | Precision: ${precision}% | Recall: ${recall}% | ` +
    `TP: ${metrics.truePositives} | FP: ${metrics.falsePositives} | FN: ${metrics.falseNegatives} | ` +
    `Tolerance: ${metrics.tolerance}ms`;
}