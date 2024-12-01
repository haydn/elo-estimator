import type { Comparison, IssueSummary } from "@/core/_types";
import CoreContext from "@/core/CoreContext";
import { useContext } from "react";
import useSWR from "swr";

const useEffortComparisons = () => {
  const { teamId } = useContext(CoreContext);

  return useSWR<Array<Comparison>>(
    "/api/linear/:teamId/effort/comparisons",
    async (): Promise<Array<Comparison>> => {
      const response = await fetch(`/api/linear/${teamId}/effort/comparisons`);

      if (response.status !== 200) {
        throw Error(await response.text());
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

export default useEffortComparisons;
