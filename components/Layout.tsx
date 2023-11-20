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
  const issues = issueSummaries.filter(
    (issue) =>
      issue.state === "triage" ||
      issue.state === "backlog" ||
      issue.state === "unstarted"
  );
  const issuesMissingEffortComparisons = issues.filter(
    (issue) => stats.effort[issue.id].comparisons === 0
  ).length;
  const issuesMissingValueComparisons = issues.filter(
    (issue) => stats.value[issue.id].comparisons === 0
  ).length;
  return (
    <div className={container}>
      <nav className={nav}>
        <Link href="/">Issues</Link>
        <span>
          <Link href="/effort">Effort</Link>
          {issuesMissingEffortComparisons > 0
            ? ` (${issuesMissingEffortComparisons})`
            : null}
        </span>
        <span>
          <Link href="/value">Value</Link>
          {issuesMissingValueComparisons > 0
            ? ` (${issuesMissingValueComparisons})`
            : null}
        </span>
        <Link href="/projects">Projects</Link>
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
