import type { IssueSummary } from "@/core/_types";
import CoreContext from "@/core/CoreContext";
import { useContext } from "react";
import useSWR from "swr";

const useIssueSummaries = () => {
  const { apiKey, teamId } = useContext(CoreContext);

  return useSWR<Array<IssueSummary>>(
    "/api/issue-summaries",
    async (): Promise<Array<IssueSummary>> => {
      const response = await fetch("/api/issue-summaries", {
        method: "POST",
        body: JSON.stringify({
          apiKey,
          teamId,
        }),
      });

      if (!response.ok) {
        throw Error(response.statusText);
      }

      return response.json();
    },
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );
};

export default useIssueSummaries;
