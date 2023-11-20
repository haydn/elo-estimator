import { scaleLinear } from "@visx/scale";
import { ReactNode, useCallback, useEffect, useState } from "react";
import weightedRandomPick from "../utils/weightedRandomPick";
import CoreContext from "./CoreContext";
import {
  Comparison,
  ComparisonProperty,
  IssueDetail,
  IssueSummary,
  State,
} from "./_types";
import defaultState from "./defaultState";
import getStats from "./getStats";

type Props = {
  addComparisons: (
    property: ComparisonProperty,
    comparisons: Array<Pick<Comparison, "issueAId" | "issueBId" | "result">>,
    highWaterMark: string | undefined
  ) => Array<Comparison> | Promise<Array<Comparison>>;
  children: ReactNode;
  getComparisons: (
    property: ComparisonProperty
  ) => Array<Comparison> | Promise<Array<Comparison>>;
  getIssueDetail: (id: string) => IssueDetail | Promise<IssueDetail>;
  getIssueSummaries: () => Array<IssueSummary> | Promise<Array<IssueSummary>>;
  updateIssueEstimate: (id: string, estimate: number) => void | Promise<void>;
};

const incrementPendingRequest = (state: State) => ({
  ...state,
  pendingRequests: state.pendingRequests + 1,
});

const decrementPendingRequest = (state: State) => ({
  ...state,
  pendingRequests: state.pendingRequests - 1,
});

const Core = ({
  children,
  getIssueDetail,
  getIssueSummaries,
  getComparisons,
  ...props
}: Props) => {
  const [state, setState] = useState(defaultState);

  useEffect(() => {
    setState(incrementPendingRequest);

    Promise.all([
      getIssueSummaries(),
      getComparisons("effort"),
      getComparisons("value"),
    ])
      .then(([issueSummaries, effortComparisons, valueComparisons]) => {
        const stats: Record<ComparisonProperty, ReturnType<typeof getStats>> = {
          effort: getStats(issueSummaries, effortComparisons),
          value: getStats(issueSummaries, valueComparisons),
        };

        setState((current) => ({
          ...current,
          issueSummaries,
          comparisons: {
            effort: effortComparisons,
            value: valueComparisons,
          },
          stats,
          scales: {
            effort: scaleLinear({
              domain: [
                Math.max(
                  ...issueSummaries.map(({ id }) => stats.effort[id].rating)
                ),
                Math.min(
                  ...issueSummaries.map(({ id }) => stats.effort[id].rating)
                ),
              ],
              range: [0, 1],
            }),
            value: scaleLinear({
              domain: [
                Math.max(
                  ...issueSummaries.map(({ id }) => stats.value[id].rating)
                ),
                Math.min(
                  ...issueSummaries.map(({ id }) => stats.value[id].rating)
                ),
              ],
              range: [1, 0],
            }),
          },
        }));
      })
      .finally(() => {
        setState(decrementPendingRequest);
      });
  }, [getComparisons, getIssueSummaries]);

  const createTournament = useCallback(
    (id: string, property: ComparisonProperty) => {
      const relevantIssues = state.issueSummaries.filter(
        (issue) =>
          issue.state === "triage" ||
          issue.state === "backlog" ||
          issue.state === "unstarted"
      );
      const ids: Array<string> = [];

      ids.push(
        weightedRandomPick(
          [...relevantIssues.map(({ id }) => id)].sort(
            (a, b) =>
              state.stats[property][a].comparisons -
              state.stats[property][b].comparisons
          ),
          8
        )
      );

      for (let i = 0; i < 5 - 1; i++) {
        ids.push(
          weightedRandomPick(
            [...relevantIssues.map(({ id }) => id)]
              .filter((x) => !ids.includes(x))
              .sort(
                (a, b) =>
                  Math.abs(
                    state.stats[property][ids[0]].rating -
                      state.stats[property][a].rating
                  ) -
                  Math.abs(
                    state.stats[property][ids[0]].rating -
                      state.stats[property][b].rating
                  )
              ),
            2
          )
        );
      }

      for (const id of ids) {
        setState(incrementPendingRequest);
        Promise.resolve(getIssueDetail(id))
          .then((issueDetail) => {
            setState((current) => ({
              ...current,
              issueDetails: {
                ...current.issueDetails,
                [id]: issueDetail,
              },
            }));
          })
          .finally(() => {
            setState(decrementPendingRequest);
          });
      }

      setState((current) => {
        return {
          ...current,
          tournaments: {
            ...current.tournaments,
            [id]: ids,
          },
        };
      });
    },
    [getIssueDetail, state.issueSummaries, state.stats]
  );

  const addComparisons = useCallback(
    async (
      property: ComparisonProperty,
      comparisons: Array<Pick<Comparison, "issueAId" | "issueBId" | "result">>
    ) => {
      setState(incrementPendingRequest);
      try {
        const latestComparison = [...state.comparisons[property]]
          .sort((a, b) => b.id.localeCompare(a.id))
          .find(() => true);

        const newComparisons = await props.addComparisons(
          property,
          comparisons,
          latestComparison?.id
        );

        setState((current) => {
          const updatedComparisons = {
            ...current.comparisons,
            [property]: [...current.comparisons[property], ...newComparisons],
          };

          const stats: Record<
            ComparisonProperty,
            ReturnType<typeof getStats>
          > = {
            effort: getStats(current.issueSummaries, updatedComparisons.effort),
            value: getStats(current.issueSummaries, updatedComparisons.value),
          };

          return {
            ...current,
            comparisons: {
              ...current.comparisons,
              [property]: [...current.comparisons[property], ...newComparisons],
            },
            stats,
          };
        });
      } finally {
        setState(decrementPendingRequest);
      }
    },
    [props, state.comparisons]
  );

  const updateIssueEstimate = useCallback(
    async (id: string, estimate: number) => {
      setState(incrementPendingRequest);

      try {
        await props.updateIssueEstimate(id, estimate);

        setState((current) => ({
          ...current,
          issueSummaries: current.issueSummaries.map((issue) =>
            issue.id === id ? { ...issue, estimate } : issue
          ),
        }));
      } finally {
        setState(decrementPendingRequest);
      }
    },
    [props]
  );

  return (
    <CoreContext.Provider
      value={{ addComparisons, createTournament, state, updateIssueEstimate }}
    >
      {children}
    </CoreContext.Provider>
  );
};

export default Core;
