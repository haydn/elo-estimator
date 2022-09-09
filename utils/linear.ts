import { Credentials } from "./AppContext";

type IssueSummary = {
  id: string;
  key: string;
  title: string;
  estimate: number | null;
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

const getIssues = async (
  credentials: Credentials
): Promise<Array<IssueSummary>> => {
  const response = await fetch("https://api.linear.app/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${credentials.linearApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: `
        {
          team(id: "${credentials.linearTeamId}") {
            key
            issues(
              first: 250
              filter: {
                state: {
                  type: {
                    nin: ["completed", "canceled"]
                  }
                }
                cycle: {
                  null: true
                  or: [
                    { startsAt: { gt: "P0D" } }
                    { endsAt: { lt: "P0D" } }
                  ]
                }
              }
            ) {
              pageInfo {
                hasNextPage
                endCursor
              }
              edges {
                node {
                  id
                  number
                  title
                  parent {
                    id
                  }
                  estimate
                }
              }
            }
          }
        }
      `,
    }),
  });

  const { data } = await response.json();

  return (data?.team?.issues?.edges ?? [])
    .filter((edge: any) => edge?.node?.parent?.id === undefined)
    .map((edge: any) => ({
      id: edge?.node?.id,
      key: `${data?.team?.key}-${edge?.node?.number}`,
      title: edge?.node?.title,
      estimate: edge?.node?.estimate,
    }));
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

export { getIssues, getIssue, updateIssue };
export type { IssueSummary, IssueDetail };
