import styles from "./LinearApp.module.css";

import { ReactNode, useCallback } from "react";
import Core from "../core/Core";
import { Comparison, IssueDetail, IssueSummary } from "../core/_types";
import { issueSummarySchema } from "./issueSummarySchema";
import { useLocalStorage } from "../utils/useLocalStorage";
import { issueDetailSchema } from "./issueDetailSchema";
import { RelationSummary } from "../core/_types";
import CredentialsForm from "./CredentialsForm";

type Props = {
  children: ReactNode;
};

const LinearApp = ({ children }: Props) => {
  const [apiKey, setApiKey] = useLocalStorage("linear_api_key");
  const [teamId, setTeamId] = useLocalStorage("linear_team_id");

  const addComparisons = async (
    property: "effort",
    comparisons: Array<Pick<Comparison, "issueAId" | "issueBId" | "result">>,
    highWaterMark: string | undefined
  ) => {
    const response = await fetch(
      `/api/linear/${teamId}/${property}/comparisons`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          apiKey: apiKey,
          comparisons,
          highWaterMark,
        }),
      }
    );

    if (response.status !== 200) {
      throw Error(await response.text());
    }

    return response.json();
  };

  const getComparisons = useCallback(
    async (property: "effort"): Promise<Array<Comparison>> => {
      const response = await fetch(
        `/api/linear/${teamId}/${property}/comparisons`
      );

      if (response.status !== 200) {
        throw Error(await response.text());
      }

      return response.json();
    },
    [teamId]
  );

  const getIssueDetail = useCallback(
    async (id: string): Promise<IssueDetail> => {
      if (!apiKey) throw Error("No API key");

      const response = await fetch("https://api.linear.app/graphql", {
        method: "POST",
        headers: {
          Authorization: apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `
            query IssueDetail($id: String!) {
              issue(id: $id) {
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
                cycle {
                  number
                }
                estimate
                state {
                  type
                }
              }
            }
          `,
          variables: {
            id,
          },
        }),
      });

      if (response.status !== 200) {
        throw Error(await response.text());
      }

      const { errors, data } = await response.json();

      if (Array.isArray(errors) && errors.length > 0) {
        throw Error(errors.map((error) => error.message).join("\n\n"));
      }

      const { issue } = issueDetailSchema.parse(data);

      return {
        id: issue.id,
        identifier: issue.identifier,
        title: issue.title,
        description: issue.description ?? "",
        projectId: issue.project?.id,
        projectName: issue.project?.name,
        projectIcon: issue.project?.icon ?? undefined,
        labels: issue.labels.edges.map((edge) => edge.node.name),
        parentIdentifier: issue.parent?.identifier,
        parentTitle: issue.parent?.title,
        relations: (issue.relations?.nodes ?? [])
          .map((node: any) => ({
            id: node.id,
            type: node.type,
            identifier: node.relatedIssue.identifier,
            title: node.relatedIssue.title,
          }))
          .concat(
            (issue.inverseRelations?.nodes ?? []).map((node: any) => ({
              id: node.id,
              type: node.type === "blocks" ? "blocked-by" : node.type,
              identifier: node.issue.identifier,
              title: node.issue.title,
            }))
          ),
        comments: (issue.comments?.nodes ?? []).reverse().map((comment) => ({
          id: comment.id,
          body: comment.body,
          author: comment.user?.name ?? "unknown",
        })),
        cycle: issue.cycle?.number,
        estimate: issue.estimate ?? undefined,
        state: issue.state.type,
      };
    },
    [apiKey]
  );

  const getIssueSummaries = useCallback(
    async (cursor?: string): Promise<Array<IssueSummary>> => {
      if (apiKey === undefined) throw Error("No API key");
      if (teamId === undefined) throw Error("Team ID key");

      const response = await fetch("https://api.linear.app/graphql", {
        method: "POST",
        headers: {
          Authorization: apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `
            query IssueSummary($id: String!, $cursor: String) {
              team(id: $id) {
                key
                issues(
                  first: 100
                  after: $cursor
                  filter: {
                    parent: {
                      null: true
                    }
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
            await getIssueSummaries(team.issues.pageInfo.endCursor ?? undefined)
          )
        : result;
    },
    [apiKey, teamId]
  );

  const updateIssueEstimate = useCallback(
    async (id: string, estimate: number) => {
      if (apiKey === undefined) throw Error("No API key");

      const response = await fetch("https://api.linear.app/graphql", {
        method: "POST",
        headers: {
          Authorization: apiKey,
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

      if (data?.issueUpdate?.success !== true) {
        throw Error("Unable to update issue estimate");
      }
    },
    [apiKey]
  );

  return apiKey === undefined || teamId === undefined ? (
    <div style={{ padding: 10 }}>
      <CredentialsForm
        value={{ apiKey: apiKey ?? "", teamId: teamId ?? "" }}
        onSubmit={({ apiKey, teamId }) => {
          setApiKey(apiKey);
          setTeamId(teamId);
        }}
      />
    </div>
  ) : (
    <Core
      addComparisons={addComparisons}
      getComparisons={getComparisons}
      getIssueDetail={getIssueDetail}
      updateIssueEstimate={updateIssueEstimate}
      getIssueSummaries={getIssueSummaries}
    >
      {children}
    </Core>
  );
};

export default LinearApp;
