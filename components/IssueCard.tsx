import styles from "./IssueCard.module.css";

import { marked } from "marked";
import React, { useContext } from "react";
import { IssueDetail } from "../core/_types";
import RelationshipGraph from "./RelationshipGraph";
import CoreContext from "../core/CoreContext";

type Props = { issue: IssueDetail };

const IssueCard = ({ issue }: Props) => {
  const { state } = useContext(CoreContext);
  return (
    <div className={styles.container}>
      <small>
        {issue.identifier}
        {issue.labels.length > 0 ? " — " + issue.labels.join(", ") : null}
        {issue.projectName ? " — " + issue.projectName : null}
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
            {issue.relations.map((relation) => (
              <li key={relation.id}>
                {relation.type} — {relation.identifier} — {relation.title}
              </li>
            ))}
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
