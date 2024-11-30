import styles from "./IssueCard.module.css";

import { issueDetailSchema } from "@/linear/issueDetailSchema";
import gql from "dedent";
import { marked } from "marked";
import React, { useContext } from "react";
import useSWR from "swr";
import type { IssueDetail } from "../core/_types";
import CoreContext from "../core/CoreContext";
import ProjectName from "./ProjectName";
import RelationshipGraph from "./RelationshipGraph";

type Props = { id: string };

const IssueCard = ({ id }: Props) => {
  const { state } = useContext(CoreContext);

  const { data: issue } = useSWR<IssueDetail>(
    id,
    async (id): Promise<IssueDetail> => {
      const apiKey = window
        ? window.localStorage.getItem("linear_api_key")
        : null;

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
    { revalidateOnMount: true }
  );

  if (issue === undefined) return "Loading...";

  return (
    <div className={styles.container}>
      <small>
        {issue.identifier}
        {issue.labels.length > 0 ? " — " + issue.labels.join(", ") : null}
        {issue.projectName ? (
          <>
            {" — "}
            <ProjectName name={issue.projectName} icon={issue.projectIcon} />
          </>
        ) : null}
      </small>
      <h2>{issue.title}</h2>
      <div
        dangerouslySetInnerHTML={{
          __html: marked.parse(issue.description ?? "<em>No description</em>"),
        }}
      />
      {issue.relations.length > 0 ? (
        <>
          <hr />
          <ul>
            {issue.relations.map((relation) => {
              const issueSummary = state.issueSummaries.find(
                ({ identifier }) => identifier === relation.identifier
              );
              return (
                <li
                  key={relation.id}
                  style={
                    issueSummary?.state === "completed" ||
                    issueSummary?.state === "canceled"
                      ? {
                          color: "#999",
                          textDecoration: "line-through",
                        }
                      : undefined
                  }
                >
                  {relation.type} — {relation.identifier} — {relation.title}
                </li>
              );
            })}
          </ul>
        </>
      ) : null}
      <RelationshipGraph context={state} issueIdentifier={issue.identifier} />
      {issue.comments.length > 0 ? (
        <>
          <hr />
          <dl>
            {issue.comments.map((comment) => (
              <React.Fragment key={comment.id}>
                <dt>{comment.author}:</dt>
                <dd
                  dangerouslySetInnerHTML={{
                    __html: marked.parse(comment.body),
                  }}
                />
              </React.Fragment>
            ))}
          </dl>
        </>
      ) : null}
    </div>
  );
};

export default IssueCard;
