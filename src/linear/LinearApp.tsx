"use client";

import gql from "dedent";
import { type ReactNode, useCallback } from "react";
import Core from "../core/Core";
import type {
  Comparison,
  IssueDetail,
  IssueSummary,
  RelationSummary,
} from "../core/_types";
import { useLocalStorage } from "../utils/useLocalStorage";
import CredentialsForm from "./CredentialsForm";
import { issueDetailSchema } from "./issueDetailSchema";
import { issueSummarySchema } from "./issueSummarySchema";

type Props = {
  children: ReactNode;
};

const LinearApp = ({ children }: Props) => {
  const [apiKey, setApiKey] = useLocalStorage("linear_api_key");
  const [teamId, setTeamId] = useLocalStorage("linear_team_id");

  const addComparisons = async (
    comparisons: Array<Pick<Comparison, "issueAId" | "issueBId" | "result">>,
    highWaterMark: string | undefined
  ) => {
    const response = await fetch(`/api/linear/${teamId}/effort/comparisons`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        apiKey: apiKey,
        comparisons,
        highWaterMark,
      }),
    });

    if (response.status !== 200) {
      throw Error(await response.text());
    }

    return response.json();
  };

  const getComparisons = useCallback(async (): Promise<Array<Comparison>> => {
    const response = await fetch(`/api/linear/${teamId}/effort/comparisons`);

    if (response.status !== 200) {
      throw Error(await response.text());
    }

    return response.json();
  }, [teamId]);

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
          query: gql`
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

  const getIssueSummaries = useCallback(async (): Promise<
    Array<IssueSummary>
  > => {
    if (apiKey === undefined) throw Error("No API key");
    if (teamId === undefined) throw Error("Team ID key");

    const response = await fetch("/api/issue-summaries", {
      method: "POST",
      body: JSON.stringify({
        apiKey,
        teamId,
      }),
    });

    if (!response.ok) {
      throw Error(response.statusText);
    }

    return response.json();
  }, [apiKey, teamId]);

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
          query: gql`
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
