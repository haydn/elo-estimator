import { scaleLinear } from "@visx/scale";
import type { State } from "./_types";

const defaultState: State = {
  comparisons: [],
  issueSummaries: [],
  pendingRequests: 0,
  scales: scaleLinear(),
  stats: {},
};

export default defaultState;
