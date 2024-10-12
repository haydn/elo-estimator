import styles from "./IssueComparison.module.css";

import { useRouter } from "next/router";
import { ReactNode, useContext, useState } from "react";
import IssueCard from "../components/IssueCard";
import CoreContext from "./CoreContext";
import { Comparison } from "./_types";

type Props = {
  firstButtonLabel: string;
  property: "effort";
  successiveButtonLabel: string;
  title: ReactNode;
  tournamentId: string;
};

const IssueComparison = ({
  firstButtonLabel,
  property,
  successiveButtonLabel,
  title,
  tournamentId,
}: Props) => {
  const {
    addComparisons,
    state: { issueDetails, tournaments, pendingRequests },
  } = useContext(CoreContext);

  const router = useRouter();

  const [order, setOrder] = useState<Array<string>>([]);

  const issueIds = tournaments[tournamentId] ?? [];
  const issues = issueIds.map((id) => issueDetails[id]);

  return (
    <>
      <div className={styles.header}>
        <h1>{title}</h1>
      </div>
      <div className={styles.main}>
        {pendingRequests > 0 ? (
          <div>{pendingRequests} pending request(s)…</div>
        ) : (
          issues.map((issue) =>
            issue ? (
              <div key={issue.id}>
                <IssueCard issue={issue} />
              </div>
            ) : null
          )
        )}
      </div>
      <div className={styles.footer}>
        <div className={styles.buttons}>
          {issueIds.map((id) =>
            order.includes(id) ? (
              <span key={id}>{order.indexOf(id) + 1}</span>
            ) : (
              <button
                key={id}
                onClick={() => {
                  setOrder((current) => current.concat([id]));
                }}
              >
                {order.length === 0 ? firstButtonLabel : successiveButtonLabel}
              </button>
            )
          )}
        </div>
        <div className={styles.submit}>
          <button
            onClick={() => {
              setOrder([]);
            }}
            disabled={order.length === 0 || pendingRequests > 0}
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

              router.push(`/${property}`);
            }}
            disabled={order.length !== issues.length || pendingRequests > 0}
          >
            Submit
          </button>
        </div>
      </div>
    </>
  );
};

export default IssueComparison;
