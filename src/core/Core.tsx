import { scaleLinear } from "@visx/scale";
import { type ReactNode, useCallback, useEffect, useState } from "react";
import weightedRandomPick from "../utils/weightedRandomPick";
import CoreContext from "./CoreContext";
import type { Comparison, IssueDetail, IssueSummary, State } from "./_types";
import defaultState from "./defaultState";
import getStats from "./getStats";

type Props = {
  addComparisons: (
    comparisons: Array<Pick<Comparison, "issueAId" | "issueBId" | "result">>,
    highWaterMark: string | undefined
  ) => Array<Comparison> | Promise<Array<Comparison>>;
  children: ReactNode;
  getComparisons: () => Array<Comparison> | Promise<Array<Comparison>>;
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

    Promise.all([getIssueSummaries(), getComparisons()])
      .then(([issueSummaries, effortComparisons]) => {
        const stats = getStats(issueSummaries, effortComparisons);

        setState((current) => ({
          ...current,
          issueSummaries,
          comparisons: effortComparisons,
          stats,
          scales: scaleLinear({
            domain: [
              Math.max(...issueSummaries.map(({ id }) => stats[id].rating)),
              Math.min(...issueSummaries.map(({ id }) => stats[id].rating)),
            ],
            range: [0, 1],
          }),
        }));
      })
      .finally(() => {
        setState(decrementPendingRequest);
      });
  }, [getComparisons, getIssueSummaries]);

  const createTournament = useCallback(
    (id: string) => {
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
            (a, b) => state.stats[a].comparisons - state.stats[b].comparisons
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
                  Math.abs(state.stats[ids[0]].rating - state.stats[a].rating) -
                  Math.abs(state.stats[ids[0]].rating - state.stats[b].rating)
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
      comparisons: Array<Pick<Comparison, "issueAId" | "issueBId" | "result">>
    ) => {
      setState(incrementPendingRequest);
      try {
        const latestComparison = [...state.comparisons]
          .sort((a, b) => b.id.localeCompare(a.id))
          .find(() => true);

        const newComparisons = await props.addComparisons(
          comparisons,
          latestComparison?.id
        );

        setState((current) => {
          const updatedComparisons = [
            ...current.comparisons,
            ...newComparisons,
          ];

          const stats = getStats(current.issueSummaries, updatedComparisons);

          return {
            ...current,
            comparisons: updatedComparisons,
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
