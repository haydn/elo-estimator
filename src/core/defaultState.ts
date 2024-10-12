import { scaleLinear } from "@visx/scale";
import type { State } from "./_types";

const defaultState: State = {
  comparisons: { effort: [] },
  issueDetails: {},
  issueSummaries: [],
  pendingRequests: 0,
  scales: { effort: scaleLinear() },
  stats: { effort: {} },
  tournaments: {},
};

export default defaultState;
