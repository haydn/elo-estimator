import type { Comparison } from "@/core/_types";
import CoreContext from "@/core/CoreContext";
import { calculateStats } from "@/utils/elo";
import { scaleLinear } from "@visx/scale";
import gql from "dedent";
import { useCallback, useContext } from "react";
import useEffortComparisons from "./useEffortComparisons";
import useIssueSummaries from "./useIssueSummaries";

const ESTIMATES = [1, 2, 3, 5, 8, 13] as const;

const useDataThing = () => {
  const { apiKey, teamId } = useContext(CoreContext);

  const { data: issueSummaries, mutate: mutateIssueSummaries } =
    useIssueSummaries();

  const { data: effortComparisons, mutate: mutateEffortComparisons } =
    useEffortComparisons();

  // const addComparisons = useCallback(
  //   async (
  //     comparisons: Array<Pick<Comparison, "issueAId" | "issueBId" | "result">>
  //   ) => {
  //     const latestComparison = [...(effortComparisons ?? [])]
  //       .sort((a, b) => b.id.localeCompare(a.id))
  //       .find(() => true);

  //     const response = await fetch(`/api/linear/${teamId}/effort/comparisons`, {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify({
  //         apiKey: apiKey,
  //         comparisons,
  //         highWaterMark: latestComparison?.id,
  //       }),
  //     });

  //     if (response.status !== 200) {
  //       throw Error(await response.text());
  //     }

  //     const newComparisons = await response.json();

  //     await mutateEffortComparisons(
  //       (current) => [...(current ?? []), ...newComparisons],
  //       { revalidate: false }
  //     );
  //   },
  //   [apiKey, effortComparisons, mutateEffortComparisons, teamId]
  // );

  const updateIssueEstimate = useCallback(
    async (id: string, estimate: number) => {
      const response = await fetch("https://api.linear.app/graphql", {
        method: "POST",
        headers: {
          Authorization: apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: gql`
            mutation ($id: String!, $input: IssueUpdateInput!) {
              issueUpdate(id: $id, input: $input) {
                success
              }
            }
          `,
          variables: {
            id,
            input: {
              estimate,
            },
          },
        }),
      });

      const { data } = await response.json();

      if (data?.issueUpdate?.success !== true) {
        throw Error("Unable to update issue estimate");
      }

      await mutateIssueSummaries(
        (current) =>
          (current ?? []).map((issue) =>
            issue.id === id ? { ...issue, estimate } : issue
          ),
        { revalidate: false }
      );
    },
    [apiKey, mutateIssueSummaries]
  );

  if (issueSummaries === undefined || effortComparisons === undefined) {
    return null;
  }

  const stats = calculateStats({
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
  });

  const scales = scaleLinear({
    domain: [
      Math.max(...issueSummaries.map(({ id }) => stats[id].rating)),
      Math.min(...issueSummaries.map(({ id }) => stats[id].rating)),
    ],
    range: [0, 1],
  });

  const minRating = Object.keys(stats).reduce(
    (current, id) => Math.min(stats[id].rating, current),
    Number.MAX_VALUE
  );

  const maxRating = Object.keys(stats).reduce(
    (current, id) => Math.max(stats[id].rating, current),
    Number.MIN_VALUE
  );

  const step = (maxRating - minRating) / ESTIMATES.length;

  const recommendedEstimates = Object.fromEntries(
    issueSummaries.map(({ id }) => {
      let index = ESTIMATES.length - 1;
      while (index > 0 && stats[id].rating > maxRating - step * index) {
        index -= 1;
      }
      return [id, ESTIMATES[index]];
    })
  );

  const relevantIssues = issueSummaries.filter(
    (issue) =>
      issue.state === "triage" ||
      issue.state === "backlog" ||
      issue.state === "unstarted"
  );

  const issuesWithOutOfDateEstimates = relevantIssues.filter(
    (issue) =>
      stats[issue.id].comparisons >= 4 &&
      issue.estimate !== recommendedEstimates[issue.id]
  );

  const issuesMissingEffortComparisons = relevantIssues.filter(
    (issue) => stats[issue.id].comparisons === 0
  );

  return {
    // addComparisons,
    effortComparisons,
    issuesMissingEffortComparisons,
    issueSummaries,
    issuesWithOutOfDateEstimates,
    maxRating,
    minRating,
    recommendedEstimates,
    relevantIssues,
    scales,
    stats,
    updateIssueEstimate,
  };
};

export default useDataThing;
