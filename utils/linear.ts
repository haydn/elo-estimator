import { useState } from "react";
import { useAsync } from "react-use";
import getStats from "./getStats";
import weightedRandomPick from "./weightedRandomPick";

type Context = {
  addComparisons: (
    property: "effort" | "value",
    comparisons: Array<{
      issueAId: string;
      issueBId: string;
      result: 0 | 1;
    }>
  ) => Promise<void>;
  effortComparisons: Array<Comparison>;
  valueComparisons: Array<Comparison>;
  issueDetails: Array<IssueDetail>;
  issueSummaries: Array<IssueSummary>;
  linearApiKey: string;
  linearTeamId: string;
  loadIssueDetails: (
    rankingMethod: "effort" | "value",
    numberOfIssues: number
  ) => Promise<void>;
  relations: Array<RelationSummary>;
  status: "uninitialized" | "loading" | "ready";
  updateIssue: (
    linearApiKey: string,
    id: string,
    { estimate }: { estimate: number }
  ) => Promise<boolean>;
};

type IssueSummary = {
  estimate: number | null;
  id: string;
  identifier: string;
  title: string;
  state:
    | "triage"
    | "backlog"
    | "unstarted"
    | "started"
    | "completed"
    | "canceled";
  projectId: string | undefined;
  projectName: string | undefined;
  projectIcon: string | undefined;
  cycleNumber: number | undefined;
};

type IssueDetail = {
  id: string;
  identifier: string;
  title: string;
  description: string;
  projectId: string | undefined;
  projectName: string | undefined;
  projectIcon: string | undefined;
  labels: Array<string>;
  parentIdentifier: string | undefined;
  parentTitle: string | undefined;
  relations: Array<{
    type: string;
    id: string;
    identifier: string;
    title: string;
  }>;
  comments: Array<{
    id: string;
    author: string;
    body: string;
  }>;
};

type RelationSummary = {
  id: string;
  issueIdentifier: string;
  relatedIssueIdentifier: string;
  type: "blocks" | "related" | "duplicate";
};

type Comparison = {
  id: string;
  userId: string;
  issueAId: string;
  issueBId: string;
  result: 0 | 1;
};

const getIssues = async (
  context: Context,
  cursor?: string
): Promise<Array<IssueSummary>> => {
  const response = await fetch("https://api.linear.app/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${context.linearApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: `
        query GetIssues($id: String!, $cursor: String) {
          team(id: $id) {
            key
            issues(
              first: 250
              after: $cursor
              filter: {
                # state: {
                #   type: {
                #     nin: ["completed", "canceled"]
                #   }
                # }
                parent: {
                  null: true
                }
                # cycle: {
                #   null: true
                #   or: [
                #     { startsAt: { gt: "P0D" } }
                #     { endsAt: { lt: "P0D" } }
                #   ]
                # }
              }
            ) {
              pageInfo {
                hasNextPage
                endCursor
              }
              edges {
                node {
                  estimate
                  id
                  identifier
                  state {
                    type
                  }
                  title
                  project {
                    id
                    name
                    icon
                  }
                  cycle {
                    number
                  }
                }
              }
            }
          }
        }
      `,
      variables: {
        id: context.linearTeamId,
        cursor,
      },
    }),
  });

  const { data } = await response.json();

  const result = (data?.team?.issues?.edges ?? []).map((edge: any) => ({
    ...edge?.node,
    state: edge?.node.state.type,
    projectId: edge?.node.project?.id,
    projectName: edge?.node.project?.name,
    projectIcon: edge?.node.project?.icon,
    cycleNumber: edge?.node.cycle?.number,
  }));

  return data?.team?.issues?.pageInfo?.hasNextPage === true
    ? result.concat(
        await getIssues(context, data?.team?.issues?.pageInfo?.endCursor)
      )
    : result;
};

const getIssue = async (context: Context, id: string): Promise<IssueDetail> => {
  const response = await fetch("https://api.linear.app/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${context.linearApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: `
        {
          issue(id: "${id}") {
            id
            identifier
            title
            description
            project {
              id
              name
              icon
            }
            labels {
              edges {
                node {
                  name
                }
              }
            }
            parent {
              identifier
              title
            }
            relations {
              nodes {
                id
                type
                relatedIssue {
                  identifier
                  title
                }
              }
            }
            inverseRelations {
              nodes {
                id
                type
                issue {
                  identifier
                  title
                }
              }
            }
            comments {
              nodes {
                id
                body
                user {
                  name
                }
              }
            }
          }
        }
      `,
    }),
  });

  const { data } = await response.json();

  return {
    id: data.issue.id,
    identifier: data.issue.identifier,
    title: data.issue.title,
    description: data.issue.description,
    projectId: data.issue.project?.id,
    projectName: data.issue.project?.name,
    projectIcon: data.issue.project?.icon,
    labels: data.issue.labels.edges.map((edge: any) => edge.node.name),
    parentIdentifier: data.issue.parent?.identifier,
    parentTitle: data.issue.parent?.title,
    relations: (data.issue.relations?.nodes ?? [])
      .map((node: any) => ({
        id: node.id,
        type: node.type,
        identifier: node.relatedIssue.identifier,
        title: node.relatedIssue.title,
      }))
      .concat(
        (data.issue.inverseRelations?.nodes ?? []).map((node: any) => ({
          id: node.id,
          type: node.type === "blocks" ? "blocked-by" : node.type,
          identifier: node.issue.identifier,
          title: node.issue.title,
        }))
      ),
    comments: (data.issue.comments?.nodes ?? [])
      .reverse()
      .map((comment: any) => ({
        id: comment.id,
        body: comment.body,
        author: comment.user.name,
      })),
  };
};

const getRelations = async (
  context: Context,
  cursor?: string
): Promise<Array<RelationSummary>> => {
  const response = await fetch("https://api.linear.app/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${context.linearApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: `
        query GetRelations($cursor: String) {
          issueRelations(first: 250, after: $cursor) {
            pageInfo {
              hasNextPage
              endCursor
            }
            edges {
              node {
                id
                type
                issue {
                  identifier
                }
                relatedIssue {
                  identifier
                }
              }
            }
          }
        }
      `,
      variables: {
        cursor,
      },
    }),
  });

  const { data } = await response.json();

  const result = (data?.issueRelations?.edges ?? []).map((edge: any) => ({
    id: edge?.node?.id,
    issueIdentifier: edge?.node?.issue?.identifier,
    relatedIssueIdentifier: edge?.node?.relatedIssue?.identifier,
    type: edge?.node?.type,
  }));

  return data?.issueRelations?.pageInfo?.hasNextPage === true
    ? result.concat(
        await getRelations(context, data?.issueRelations?.pageInfo?.endCursor)
      )
    : result;
};

const updateIssue = async (
  linearApiKey: string,
  id: string,
  { estimate }: { estimate: number }
) => {
  const response = await fetch("https://api.linear.app/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${linearApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: `
        mutation ($id: String!, $input: IssueUpdateInput!) {
          issueUpdate(id: $id, input: $input) {
            success
          }
        }
      `,
      variables: {
        id,
        input: {
          estimate,
        },
      },
    }),
  });

  const { data } = await response.json();

  return Boolean(data?.issueUpdate?.success);
};

const getComparisons = async (
  linearTeamId: string,
  property: "effort" | "value"
): Promise<Array<Comparison>> => {
  const response = await fetch(
    `/api/linear/${linearTeamId}/${property}/comparisons`
  );

  if (response.status !== 200) {
    throw Error(await response.text());
  }

  return response.json();
};

const addComparisons = async (
  linearApiKey: string,
  linearTeamId: string,
  property: "effort" | "value",
  comparisons: Array<{
    issueAId: string;
    issueBId: string;
    result: 0 | 1;
  }>
) => {
  const response = await fetch(
    `/api/linear/${linearTeamId}/${property}/comparisons`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        apiKey: linearApiKey,
        comparisons,
      }),
    }
  );

  if (response.status !== 200) {
    throw Error(await response.text());
  }

  return response.json();
};

const useLinear = () => {
  const [context, setContext] = useState<Context>({
    addComparisons: async () => {},
    effortComparisons: [],
    issueDetails: [],
    issueSummaries: [],
    linearApiKey:
      typeof window !== "undefined"
        ? window.localStorage.getItem("linear_api_key") ?? ""
        : "",
    linearTeamId:
      typeof window !== "undefined"
        ? window.localStorage.getItem("linear_team_id") ?? ""
        : "",
    loadIssueDetails: async () => {},
    relations: [],
    valueComparisons: [],
    status: "loading",
    updateIssue,
  });

  useAsync(async () => {
    if (!context.linearApiKey || !context.linearTeamId) {
      setContext((current) => ({ ...current, status: "uninitialized" }));
    } else {
      const credentials = context;

      const issueSummaries = await getIssues(context);
      const relations = await getRelations(context);
      const effortComparisons = await getComparisons(
        credentials.linearTeamId,
        "effort"
      );
      const valueComparisons = await getComparisons(
        credentials.linearTeamId,
        "value"
      );

      const loadIssueDetails = async (
        rankingMethod: "effort" | "value",
        numberOfIssues: number = 4
      ) => {
        setContext((current) =>
          current
            ? {
                ...current,
                issueDetails: [],
              }
            : current
        );

        const relevantIssues = issueSummaries.filter(
          (issue) =>
            issue.state === "triage" ||
            issue.state === "backlog" ||
            issue.state === "unstarted"
        );

        const stats = getStats(
          issueSummaries,
          rankingMethod === "effort"
            ? effortComparisons.map((x) => ({
                id: x.id,
                entities: [x.issueAId, x.issueBId],
                result: x.result,
                date: x.id,
              }))
            : valueComparisons.map((x) => ({
                id: x.id,
                entities: [x.issueAId, x.issueBId],
                result: x.result,
                date: x.id,
              }))
        );

        if (relevantIssues.length > 1) {
          const ids: Array<string> = [];

          ids.push(
            weightedRandomPick(
              [...relevantIssues.map(({ id }) => id)].sort(
                (a, b) => stats[a].comparisons - stats[b].comparisons
              ),
              8
            )
          );

          for (let i = 0; i < numberOfIssues - 1; i++) {
            ids.push(
              weightedRandomPick(
                [...relevantIssues.map(({ id }) => id)]
                  .filter((x) => !ids.includes(x))
                  .sort(
                    (a, b) =>
                      Math.abs(stats[ids[0]].rating - stats[a].rating) -
                      Math.abs(stats[ids[0]].rating - stats[b].rating)
                  ),
                2
              )
            );
          }

          const newIssues = await Promise.all(
            ids.map((id) => getIssue(context, id))
          );

          setContext((current) =>
            current
              ? {
                  ...current,
                  issueDetails: newIssues,
                }
              : current
          );
        }
      };

      setContext({
        ...credentials,
        addComparisons: async (
          property: "effort" | "value",
          comparisons: Array<{
            issueAId: string;
            issueBId: string;
            result: 0 | 1;
          }>
        ) =>
          addComparisons(
            credentials.linearApiKey,
            credentials.linearTeamId,
            property,
            comparisons
          ),
        effortComparisons,
        valueComparisons,
        issueDetails: [],
        issueSummaries,
        loadIssueDetails,
        relations,
        status: "ready",
      });
    }
  }, []);

  return context;
};

export { useLinear };
export type { Comparison, Context, IssueDetail, IssueSummary, RelationSummary };
