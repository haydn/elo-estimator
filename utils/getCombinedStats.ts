import { calculateStats, EloTournament } from "./elo";
import { IssueSummary } from "./linear";
import { scaleLinear } from "@visx/scale";

const EFFORT_LOCAL_STORAGE_KEY = "effort_comparisons";
const VALUE_LOCAL_STORAGE_KEY = "value_comparisons";
const ELO_CONFIG = {
  initialRating: 1000,
  denominator: 400,
  thresholds: [5, 10],
  kFactors: [80, 40, 20],
};

const getCombinedStats = (issues: Array<IssueSummary>) => {
  const effortComparisons: EloTournament["comparisons"] = JSON.parse(
    window.localStorage.getItem(EFFORT_LOCAL_STORAGE_KEY) ?? "[]"
  );

  const valueComparisons: EloTournament["comparisons"] = JSON.parse(
    window.localStorage.getItem(VALUE_LOCAL_STORAGE_KEY) ?? "[]"
  );

  const entities = new Set(
    issues
      .map(({ id }) => id)
      .concat(
        effortComparisons.reduce<Array<string>>(
          (result, comparison) => result.concat(comparison.entities),
          []
        )
      )
      .concat(
        valueComparisons.reduce<Array<string>>(
          (result, comparison) => result.concat(comparison.entities),
          []
        )
      )
  );

  const effortStats = calculateStats({
    config: ELO_CONFIG,
    entities,
    comparisons: effortComparisons,
  });

  const valueStats = calculateStats({
    config: ELO_CONFIG,
    entities,
    comparisons: valueComparisons,
  });

  const effortScale = scaleLinear({
    domain: [
      Math.max(...issues.map(({ id }) => effortStats[id].rating)),
      Math.min(...issues.map(({ id }) => effortStats[id].rating)),
    ],
    range: [0, 1],
  });

  const valueScale = scaleLinear({
    domain: [
      Math.max(...issues.map(({ id }) => valueStats[id].rating)),
      Math.min(...issues.map(({ id }) => valueStats[id].rating)),
    ],
    range: [1, 0],
  });

  return Object.fromEntries(
    issues.map(({ id }) => [
      id,
      {
        priority:
          valueScale(valueStats[id].rating) -
          effortScale(effortStats[id].rating),
        effort: {
          ...effortStats[id],
          scaled: effortScale(effortStats[id].rating),
        },
        value: {
          ...valueStats[id],
          scaled: valueScale(valueStats[id].rating),
        },
      },
    ])
  );
};

export default getCombinedStats;
