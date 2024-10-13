import type { IssueSummary, RelationSummary } from "@/core/_types";
import { issueSummarySchema } from "@/linear/issueSummarySchema";
import gql from "dedent";

export const runtime = "edge";

export const POST = async (request: Request) => {
  const body = await request.json();

  const summaries = await getIssueSummaries(body.teamId, body.apiKey);

  return Response.json(summaries);
};

const getIssueSummaries = async (
  teamId: string,
  apiKey: string,
  cursor?: string
): Promise<Array<IssueSummary>> => {
  const response = await fetch("https://api.linear.app/graphql", {
    method: "POST",
    headers: {
      Authorization: apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: gql`
        query IssueSummary($id: String!, $cursor: String) {
          team(id: $id) {
            key
            issues(
              first: 100
              after: $cursor
              filter: { parent: { null: true } }
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
                  relations(first: 10) {
                    nodes {
                      id
                      type
                      relatedIssue {
                        identifier
                        title
                      }
                    }
                  }
                  inverseRelations(first: 10) {
                    nodes {
                      id
                      type
                      issue {
                        identifier
                        title
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `,
      variables: {
        id: teamId,
        cursor,
      },
    }),
  });

  if (response.status !== 200) {
    throw Error(await response.text());
  }

  const { data } = await response.json();

  const { team } = issueSummarySchema.parse(data);

  const result = team.issues.edges.map((edge) => ({
    cycle: edge.node.cycle?.number,
    estimate: edge.node.estimate ?? undefined,
    id: edge.node.id,
    identifier: edge.node.identifier,
    projectName: edge.node.project?.name,
    projectId: edge.node.project?.id,
    projectIcon: edge.node.project?.icon ?? undefined,
    state: edge.node.state.type,
    title: edge.node.title,
    relations: (edge.node.relations?.nodes ?? [])
      .map((node) => ({
        id: node.id,
        type: node.type as RelationSummary["type"],
        identifier: node.relatedIssue.identifier,
        title: node.relatedIssue.title,
      }))
      .concat(
        (edge.node.inverseRelations?.nodes ?? []).map((node) => ({
          id: node.id,
          type: node.type === "blocks" ? "blocked-by" : node.type,
          identifier: node.issue.identifier,
          title: node.issue.title,
        }))
      ),
  }));

  return team.issues.pageInfo.hasNextPage === true
    ? result.concat(
        await getIssueSummaries(
          teamId,
          apiKey,
          team.issues.pageInfo.endCursor ?? undefined
        )
      )
    : result;
};
