import { calculateStats } from "../utils/elo";
import type { Comparison, IssueSummary } from "./_types";

const getStats = (
  issues: Array<IssueSummary>,
  comparisons: Array<Comparison>
) =>
  calculateStats({
    config: {
      initialRating: 1200,
      denominator: 400,
      thresholds: [4, 8],
      kFactors: [80, 40, 20],
    },
    entities: new Set(
      issues
        .map(({ id }) => id)
        .concat(
          comparisons.reduce<Array<string>>(
            (result, comparison) =>
              result.concat([comparison.issueAId, comparison.issueBId]),
            []
          )
        )
    ),
    comparisons: comparisons.map(
      ({ date, id, issueAId, issueBId, result }) => ({
        date,
        id,
        entities: [issueAId, issueBId],
        result,
      })
    ),
  });

export default getStats;
