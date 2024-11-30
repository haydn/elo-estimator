"use client";

import weightedRandomPick from "@/utils/weightedRandomPick";
import { useRouter } from "next/navigation";
import { useContext, useEffect } from "react";
import CoreContext from "../../core/CoreContext";

const EffortIndexPage = () => {
  const {
    state: { issueSummaries, stats },
  } = useContext(CoreContext);
  const router = useRouter();

  useEffect(() => {
    if (issueSummaries.length > 0) {
      const relevantIssues = issueSummaries.filter(
        (issue) =>
          issue.state === "triage" ||
          issue.state === "backlog" ||
          issue.state === "unstarted"
      );

      const id = weightedRandomPick(
        [...relevantIssues.map(({ id }) => id)].sort(
          (a, b) => stats[a].comparisons - stats[b].comparisons
        ),
        8
      );

      router.push(`/effort/${id}`);
    }
  }, [issueSummaries, issueSummaries.length, router, stats]);

  return <>Generating tournament...</>;
};

export default EffortIndexPage;
