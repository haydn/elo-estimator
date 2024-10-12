import { createContext } from "react";
import { Comparison, ComparisonProperty, State } from "./_types";
import defaultState from "./defaultState";

const CoreContext = createContext<{
  addComparisons: (
    property: ComparisonProperty,
    comparisons: Array<Pick<Comparison, "issueAId" | "issueBId" | "result">>
  ) => void | Promise<void>;
  createTournament: (id: string, property: ComparisonProperty) => void;
  state: State;
  updateIssueEstimate: (id: string, estimate: number) => void | Promise<void>;
}>({
  addComparisons: () => {},
  createTournament: () => {},
  state: defaultState,
  updateIssueEstimate: () => {},
});

export default CoreContext;
