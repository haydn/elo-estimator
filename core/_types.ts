import { scaleLinear } from "@visx/scale";
import getStats from "./getStats";

export type State = {
  comparisons: Record<ComparisonProperty, Array<Comparison>>;
  issueDetails: Record<string, IssueDetail | undefined>;
  issueSummaries: Array<IssueSummary>;
  pendingRequests: number;
  scales: Record<ComparisonProperty, ReturnType<typeof scaleLinear<number>>>;
  stats: Record<ComparisonProperty, ReturnType<typeof getStats>>;
  tournaments: Record<string, Array<string> | undefined>;
};

export type Comparison = {
  date: string;
  id: string;
  issueAId: string;
  issueBId: string;
  result: 0 | 1;
  userId: string;
};

export type ComparisonProperty = "effort" | "value";

export type IssueDetail = IssueSummary & {
  comments: Array<{
    author: string;
    body: string;
    id: string;
  }>;
  description: string;
  labels: Array<string>;
  parentIdentifier: string | undefined;
  parentTitle: string | undefined;
};

export type IssueSummary = {
  cycle: number | undefined;
  estimate: number | undefined;
  id: string;
  identifier: string;
  projectIcon: string | undefined;
  projectId: string | undefined;
  projectName: string | undefined;
  state: string;
  title: string;
  relations: Array<{
    id: string;
    identifier: string;
    title: string;
    type: "blocks" | "related" | "duplicate" | "blocked-by";
  }>;
};

export type RelationSummary = {
  id: string;
  issueIdentifier: string;
  relatedIssueIdentifier: string;
  type: "blocks" | "related" | "duplicate" | "blocked-by";
};
