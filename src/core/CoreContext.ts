import { createContext } from "react";
import type { Comparison, State } from "./_types";
import defaultState from "./defaultState";

const CoreContext = createContext<{
  addComparisons: (
    comparisons: Array<Pick<Comparison, "issueAId" | "issueBId" | "result">>
  ) => void | Promise<void>;
  createTournament: (id: string) => void;
  state: State;
  updateIssueEstimate: (id: string, estimate: number) => void | Promise<void>;
}>({
  addComparisons: () => {},
  createTournament: () => {},
  state: defaultState,
  updateIssueEstimate: () => {},
});

export default CoreContext;
