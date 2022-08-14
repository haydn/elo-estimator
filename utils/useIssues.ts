import { useCallback, useEffect, useRef, useState } from "react";
import { Credentials } from "./AppContext";
import { EloTournament } from "./elo";
import getStats from "./getStats";
import { getIssue, IssueDetail, IssueSummary } from "./linear";
import weightedRandomPick from "./weightedRandomPick";

const useIssues = (
  credentials: Credentials,
  issues: Array<IssueSummary>,
  localStorageKey: string
) => {
  const alive = useRef<boolean>(false);

  const [issueA, setIssueA] = useState<IssueDetail | null>(null);
  const [issueB, setIssueB] = useState<IssueDetail | null>(null);

  const loadIssues = useCallback(async () => {
    setIssueA(null);
    setIssueB(null);

    const stats = getStats(issues, localStorageKey);

    if (issues.length > 1) {
      const idA = weightedRandomPick(
        [...issues.map(({ id }) => id)].sort(
          (a, b) => stats[a].comparisons - stats[b].comparisons
        ),
        8
      );

      const idB = weightedRandomPick(
        [...issues.map(({ id }) => id)]
          .filter((x) => x !== idA)
          .sort(
            (a, b) =>
              Math.abs(stats[idA].rating - stats[a].rating) -
              Math.abs(stats[idA].rating - stats[b].rating)
          ),
        2
      );

      const a = await getIssue(credentials, idA);
      const b = await getIssue(credentials, idB);

      if (alive.current) {
        setIssueA(a);
        setIssueB(b);
      }
    }
  }, [credentials, issues, setIssueA, setIssueB, localStorageKey]);

  const addComparison = (entities: [string, string], result: number) => {
    const comparisons: EloTournament["comparisons"] = JSON.parse(
      window.localStorage.getItem(localStorageKey) ?? "[]"
    );
    comparisons.push({ entities, result });
    window.localStorage.setItem(localStorageKey, JSON.stringify(comparisons));
  };

  useEffect(() => {
    alive.current = true;
    if (issues) loadIssues();
    return () => {
      alive.current = false;
    };
  }, [alive, issues, loadIssues]);

  return {
    issueA,
    issueB,
    addComparison,
    loadIssues,
  };
};

export default useIssues;
