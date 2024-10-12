import { container, content, nav } from "./Layout.css";

import Link from "next/link";
import { ReactNode, useContext } from "react";
import CoreContext from "../core/CoreContext";

type Props = {
  children: ReactNode;
};

const Layout = ({ children }: Props) => {
  const {
    state: { pendingRequests, stats, issueSummaries },
  } = useContext(CoreContext);
  const minRating = Object.keys(stats.effort).reduce(
    (current, id) => Math.min(stats.effort[id].rating, current),
    Number.MAX_VALUE
  );

  const maxRating = Object.keys(stats.effort).reduce(
    (current, id) => Math.max(stats.effort[id].rating, current),
    Number.MIN_VALUE
  );
  const recommendedEstimate = (id: string) => {
    const step = (maxRating - minRating) / [1, 2, 3, 5, 8, 13].length;
    let index = [1, 2, 3, 5, 8, 13].length - 1;
    while (index > 0 && stats.effort[id].rating > maxRating - step * index) {
      index -= 1;
    }
    return [1, 2, 3, 5, 8, 13][index];
  };
  const issues = issueSummaries.filter(
    (issue) =>
      issue.state === "triage" ||
      issue.state === "backlog" ||
      issue.state === "unstarted"
  );
  const issuesWithOutOfDateEstimates = issues.filter(
    (issue) =>
      stats.effort[issue.id].comparisons >= 4 &&
      issue.estimate !== recommendedEstimate(issue.id)
  ).length;
  const issuesMissingEffortComparisons = issues.filter(
    (issue) => stats.effort[issue.id].comparisons === 0
  ).length;
  return (
    <div className={container}>
      <nav className={nav}>
        <span>
          <Link href="/">Issues</Link>
          {issuesWithOutOfDateEstimates > 0
            ? ` (${issuesWithOutOfDateEstimates})`
            : null}
        </span>
        <span>
          <Link href="/effort">Estimate</Link>
          {issuesMissingEffortComparisons > 0
            ? ` (${issuesMissingEffortComparisons})`
            : null}
        </span>
        <Link href="/settings">Settings</Link>
      </nav>
      <div className={content}>
        {pendingRequests > 0 ? (
          <div>{pendingRequests} pending request(s)…</div>
        ) : (
          children
        )}
      </div>
    </div>
  );
};

export default Layout;
