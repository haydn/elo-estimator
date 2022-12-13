import { useCallback, useEffect, useRef, useState } from "react";
import { Credentials } from "./AppContext";
import { EloTournament } from "./elo";
import getStats from "./getStats";
import { getIssue, IssueDetail, IssueSummary } from "./linear";
import weightedRandomPick from "./weightedRandomPick";
import formatISO from "date-fns/formatISO";
import { v4 as uuid } from "uuid";

const useIssues = (
  credentials: Credentials,
  issues: Array<IssueSummary>,
  localStorageKey: string
) => {
  const alive = useRef<boolean>(false);

  const [issueList, setIssueList] = useState<Array<IssueDetail>>([]);

  const loadIssues = useCallback(
    async (numberOfIssues: number = 4) => {
      setIssueList([]);

      const relevantIssues = issues.filter(
        (issue) =>
          issue.state === "triage" ||
          issue.state === "backlog" ||
          issue.state === "unstarted"
      );

      const stats = getStats(issues, localStorageKey);

      if (relevantIssues.length > 1) {
        const ids: Array<string> = [];

        ids.push(
          weightedRandomPick(
            [...relevantIssues.map(({ id }) => id)].sort(
              (a, b) => stats[a].comparisons - stats[b].comparisons
            ),
            8
          )
        );

        for (let i = 0; i < numberOfIssues - 1; i++) {
          ids.push(
            weightedRandomPick(
              [...relevantIssues.map(({ id }) => id)]
                .filter((x) => !ids.includes(x))
                .sort(
                  (a, b) =>
                    Math.abs(stats[ids[0]].rating - stats[a].rating) -
                    Math.abs(stats[ids[0]].rating - stats[b].rating)
                ),
              2
            )
          );
        }

        const newIssues: Array<IssueDetail> = await Promise.all(
          ids.map((id) => getIssue(credentials, id))
        );

        if (alive.current) {
          setIssueList(newIssues);
        }
      }
    },
    [credentials, issues, localStorageKey]
  );

  const addComparison = useCallback(
    (entities: [string, string], result: number) => {
      const comparisons: EloTournament["comparisons"] = JSON.parse(
        window.localStorage.getItem(localStorageKey) ?? "[]"
      );
      comparisons.push({
        id: uuid(),
        entities,
        result,
        date: formatISO(new Date()),
      });
      window.localStorage.setItem(localStorageKey, JSON.stringify(comparisons));
    },
    [localStorageKey]
  );

  const removeComparison = useCallback(
    (id: string) => {
      const comparisons: EloTournament["comparisons"] = JSON.parse(
        window.localStorage.getItem(localStorageKey) ?? "[]"
      );
      window.localStorage.setItem(
        localStorageKey,
        JSON.stringify(comparisons.filter((issue) => issue.id !== id))
      );
    },
    [localStorageKey]
  );

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, [alive, issues, loadIssues]);

  return {
    addComparison,
    issueList,
    loadIssues,
    removeComparison,
  };
};

export default useIssues;
