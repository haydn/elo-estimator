import { calculateStats } from "@/utils/elo";
import { useMemo } from "react";
import useEffortComparisons from "./useEffortComparisons";
import useIssueSummaries from "./useIssueSummaries";

const useStats = () => {
  const { data: issueSummaries } = useIssueSummaries();
  const { data: effortComparisons } = useEffortComparisons();
  return useMemo(() => {
    return issueSummaries !== undefined && effortComparisons !== undefined
      ? calculateStats({
          config: {
            initialRating: 1200,
            denominator: 400,
            thresholds: [4, 8],
            kFactors: [80, 40, 20],
          },
          entities: new Set(
            issueSummaries
              .map(({ id }) => id)
              .concat(
                effortComparisons.reduce<Array<string>>(
                  (result, comparison) =>
                    result.concat([comparison.issueAId, comparison.issueBId]),
                  []
                )
              )
          ),
          comparisons: effortComparisons.map(
            ({ date, id, issueAId, issueBId, result }) => ({
              date,
              id,
              entities: [issueAId, issueBId],
              result,
            })
          ),
        })
      : null;
  }, [effortComparisons, issueSummaries]);
};

export default useStats;
