import { scaleLinear } from "@visx/scale";
import { State } from "./_types";

const defaultState: State = {
  comparisons: { effort: [], value: [] },
  issueDetails: {},
  issueSummaries: [],
  pendingRequests: 0,
  scales: { effort: scaleLinear(), value: scaleLinear() },
  stats: { effort: {}, value: {} },
  tournaments: {},
};

export default defaultState;
