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
      updateIssueEstimate={updateIssueEstimate}
      getIssueSummaries={getIssueSummaries}
    >
      {children}
    </Core>
  );
};

export default LinearApp;
