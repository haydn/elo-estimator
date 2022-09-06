import { ReactNode } from "react";
import { Context } from "../utils/AppContext";
import { IssueDetail } from "../utils/linear";
import useIssues from "../utils/useIssues";
import IssueCard from "./IssueCard";
import { footer, header, main } from "./IssueComparison.css";

type Props = {
  context: Context;
  localStorageKey: string;
  title: ReactNode;
  buttonLabel: (issue: IssueDetail) => string;
};

const IssueComparison = ({
  context,
  localStorageKey,
  title,
  buttonLabel,
}: Props) => {
  const { issueA, issueB, addComparison, loadIssues } = useIssues(
    context.credentials,
    context.data.issues,
    localStorageKey
  );

  return issueA && issueB ? (
    <>
      <div className={header}>
        <h1>{title}</h1>
      </div>
      <div className={main}>
        <IssueCard issue={issueA} />
        <IssueCard issue={issueB} />
      </div>
      <div className={footer}>
        <div>
          <button
            onClick={() => {
              addComparison([issueA.id, issueB.id], 1);
              loadIssues();
            }}
          >
            {buttonLabel(issueA)}
          </button>
        </div>
        <div>
          <button
            onClick={() => {
              addComparison([issueA.id, issueB.id], 0.5);
              loadIssues();
            }}
          >
            Draw
          </button>
        </div>
        <div>
          <button
            onClick={() => {
              addComparison([issueA.id, issueB.id], 0);
              loadIssues();
            }}
          >
            {buttonLabel(issueB)}
          </button>
        </div>
      </div>
    </>
  ) : (
    <p>Loading…</p>
  );
};

export default IssueComparison;
