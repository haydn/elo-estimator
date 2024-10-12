import styles from "./IssueCard.module.css";

import { marked } from "marked";
import React, { useContext } from "react";
import type { IssueDetail } from "../core/_types";
import RelationshipGraph from "./RelationshipGraph";
import CoreContext from "../core/CoreContext";
import ProjectName from "./ProjectName";

type Props = { issue: IssueDetail };

const IssueCard = ({ issue }: Props) => {
  const { state } = useContext(CoreContext);
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
