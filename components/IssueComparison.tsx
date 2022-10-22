import { ReactNode, useEffect, useState } from "react";
import { Context } from "../utils/AppContext";
import { IssueDetail } from "../utils/linear";
import useIssues from "../utils/useIssues";
import IssueCard from "./IssueCard";
import { buttons, footer, header, main, submit } from "./IssueComparison.css";

type Props = {
  context: Context;
  localStorageKey: string;
  title: ReactNode;
  firstButtonLabel: (issue: IssueDetail) => string;
  successiveButtonLabel: (issue: IssueDetail) => string;
};

const IssueComparison = ({
  context,
  localStorageKey,
  title,
  firstButtonLabel,
  successiveButtonLabel,
}: Props) => {
  const { issueList, addComparison, loadIssues } = useIssues(
    context.credentials,
    context.data.issues,
    localStorageKey
  );

  useEffect(() => {
    loadIssues();
  }, [loadIssues]);

  const [order, setOrder] = useState<Array<string>>([]);

  return issueList.length > 0 ? (
    <>
      <div className={header}>
        <h1>{title}</h1>
      </div>
      <div className={main}>
        {issueList.map((issue) => (
          <IssueCard key={issue.id} issue={issue} />
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
            onClick={() => {
              for (let i = 0; i < order.length; i++) {
                for (let j = i + 1; j < order.length; j++) {
                  addComparison([order[i], order[j]], 1);
                }
              }
              loadIssues();
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
