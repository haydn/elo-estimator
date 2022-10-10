import { calculateStats, EloTournament } from "./elo";
import { IssueSummary } from "./linear";

const getStats = (issues: Array<IssueSummary>, localStorageKey: string) => {
  const comparisons: EloTournament["comparisons"] = JSON.parse(
    window.localStorage.getItem(localStorageKey) ?? "[]"
  );

  return calculateStats({
    config: {
      initialRating: 1200,
      denominator: 400,
      thresholds: [4, 8],
      kFactors: [80, 40, 20]
    },
    entities: new Set(
      issues
        .map(({ id }) => id)
        .concat(
          comparisons.reduce<Array<string>>(
            (result, comparison) => result.concat(comparison.entities),
            []
          )
        )
    ),
    comparisons
  });
};

export default getStats;
