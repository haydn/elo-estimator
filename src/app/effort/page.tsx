"use client";

import useDataThing from "@/hooks/useDataThing";
import weightedRandomPick from "@/utils/weightedRandomPick";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const EffortIndexPage = () => {
  const data = useDataThing();
  const router = useRouter();

  useEffect(() => {
    if (data) {
      const { relevantIssues, stats } = data;
      if (relevantIssues.length > 0) {
        const id = weightedRandomPick(
          [...relevantIssues.map(({ id }) => id)].sort(
            (a, b) => stats[a].comparisons - stats[b].comparisons
          ),
          8
        );

        router.push(`/effort/${id}`);
      }
    }
  }, [data, router]);

  return <div>Loading…</div>;
};

export default EffortIndexPage;
