import { IssueDetail } from "../utils/linear";
import { marked } from "marked";
import React from "react";
import theme from "../utils/theme.css";
import { container } from "./IssueCard.css";
import RelationshipGraph from "./RelationshipGraph";
import { Context } from "../utils/AppContext";

type Props = { context: Context; issue: IssueDetail };

const IssueCard = ({ context, issue }: Props) => (
  <div className={container}>
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
    <RelationshipGraph data={context.data} issueIdentifier={issue.identifier} />
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

export default IssueCard;
