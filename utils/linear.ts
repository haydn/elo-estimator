import { Credentials } from "./AppContext";

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
};

type IssueDetail = {
  id: string;
  identifier: string;
  title: string;
  description: string;
  projectName: string | undefined;
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

const getIssues = async (
  credentials: Credentials,
  cursor?: string
): Promise<Array<IssueSummary>> => {
  const response = await fetch("https://api.linear.app/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${credentials.linearApiKey}`,
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
                }
              }
            }
          }
        }
      `,
      variables: {
        id: credentials.linearTeamId,
        cursor,
      },
    }),
  });

  const { data } = await response.json();

  const result = (data?.team?.issues?.edges ?? []).map((edge: any) => ({
    ...edge?.node,
    state: edge?.node.state.type,
  }));

  return data?.team?.issues?.pageInfo?.hasNextPage === true
    ? result.concat(
        await getIssues(credentials, data?.team?.issues?.pageInfo?.endCursor)
      )
    : result;
};

const getIssue = async (
  credentials: Credentials,
  id: string
): Promise<IssueDetail> => {
  const response = await fetch("https://api.linear.app/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${credentials.linearApiKey}`,
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
              name
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
    projectName: data.issue.project?.name,
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
  credentials: Credentials,
  cursor?: string
): Promise<Array<RelationSummary>> => {
  const response = await fetch("https://api.linear.app/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${credentials.linearApiKey}`,
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
        await getRelations(
          credentials,
          data?.issueRelations?.pageInfo?.endCursor
        )
      )
    : result;
};

const updateIssue = async (
  credentials: Credentials,
  id: string,
  { estimate }: { estimate: number }
) => {
  const response = await fetch("https://api.linear.app/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${credentials.linearApiKey}`,
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

export { getIssues, getIssue, getRelations, updateIssue };
export type { IssueSummary, IssueDetail, RelationSummary };
