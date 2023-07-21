import { ReactNode, useEffect, useState } from "react";
import { Context } from "../utils/linear";
import { Comparison, IssueDetail } from "../utils/linear";
import IssueCard from "./IssueCard";
import { buttons, footer, header, main, submit } from "./IssueComparison.css";

type Props = {
  context: Context;
  property: "effort" | "value";
  title: ReactNode;
  firstButtonLabel: (issue: IssueDetail) => string;
  successiveButtonLabel: (issue: IssueDetail) => string;
};

const IssueComparison = ({
  context,
  property,
  title,
  firstButtonLabel,
  successiveButtonLabel,
}: Props) => {
  const {
    issueDetails: issueList,
    addComparisons,
    loadIssueDetails: loadIssues,
  } = context;

  useEffect(() => {
    loadIssues(property, 5);
  }, [loadIssues, property]);

  const [order, setOrder] = useState<Array<string>>([]);

  return issueList.length > 0 ? (
    <>
      <div className={header}>
        <h1>{title}</h1>
      </div>
      <div className={main}>
        {issueList.map((issue) => (
          <div key={issue.id}>
            <IssueCard context={context} issue={issue} />
          </div>
        ))}
      </div>
      <div className={footer}>
        <div className={buttons}>
          {issueList.map((issue) =>
            order.includes(issue.id) ? (
              <span key={issue.id}>{order.indexOf(issue.id) + 1}</span>
            ) : (
              <button
                key={issue.id}
                onClick={() => {
                  setOrder((current) => current.concat([issue.id]));
                }}
              >
                {order.length === 0
                  ? firstButtonLabel(issue)
                  : successiveButtonLabel(issue)}
              </button>
            )
          )}
        </div>
        <div className={submit}>
          <button
            onClick={() => {
              setOrder([]);
            }}
            disabled={order.length === 0}
          >
            Reset
          </button>
          <button
            onClick={async () => {
              const comparisons: Array<
                Pick<Comparison, "issueAId" | "issueBId" | "result">
              > = [];
              for (let i = 0; i < order.length; i++) {
                for (let j = i + 1; j < order.length; j++) {
                  comparisons.push({
                    issueAId: order[i],
                    issueBId: order[j],
                    result: 1,
                  });
                }
              }
              await addComparisons(property, comparisons);
              loadIssues(property, 5);
              setOrder([]);
            }}
            disabled={order.length !== issueList.length}
          >
            Submit
          </button>
        </div>
      </div>
    </>
  ) : (
    <p>Loading…</p>
  );
};

export default IssueComparison;
