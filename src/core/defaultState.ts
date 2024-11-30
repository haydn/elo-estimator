import { scaleLinear } from "@visx/scale";
import type { State } from "./_types";

const defaultState: State = {
  comparisons: [],
  issueDetails: {},
  issueSummaries: [],
  pendingRequests: 0,
  scales: scaleLinear(),
  stats: {},
  tournaments: {},
};

export default defaultState;
