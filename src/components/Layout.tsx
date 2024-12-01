"use client";

import styles from "./Layout.module.css";

import useDataThing from "@/hooks/useDataThing";
import Link from "next/link";
import { type ReactNode } from "react";

type Props = {
  children: ReactNode;
};

const Layout = ({ children }: Props) => {
  const data = useDataThing();

  if (!data) {
    return <div>Loading…</div>;
  }

  const { issuesWithOutOfDateEstimates, issuesMissingEffortComparisons } = data;

  return (
    <div className={styles.container}>
      <nav className={styles.nav}>
        <span>
          <Link href="/">Issues</Link>
          {issuesWithOutOfDateEstimates.length > 0
            ? ` (${issuesWithOutOfDateEstimates.length})`
            : null}
        </span>
        <span>
          <Link href="/effort">Estimate</Link>
          {issuesMissingEffortComparisons.length > 0
            ? ` (${issuesMissingEffortComparisons.length})`
            : null}
        </span>
        <Link href="/settings">Settings</Link>
      </nav>
      <div className={styles.content}>{children}</div>
    </div>
  );
};

export default Layout;
