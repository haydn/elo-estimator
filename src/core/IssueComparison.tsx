import styles from "./IssueComparison.module.css";

import { useRouter } from "next/navigation";
import { type ReactNode, useContext, useEffect, useState } from "react";
import IssueCard from "../components/IssueCard";
import CoreContext from "./CoreContext";
import type { Comparison } from "./_types";
import weightedRandomPick from "@/utils/weightedRandomPick";

type Props = {
  firstButtonLabel: string;
  successiveButtonLabel: string;
  title: ReactNode;
  issueId: string;
};

const IssueComparison = ({
  firstButtonLabel,
  successiveButtonLabel,
  title,
  issueId,
}: Props) => {
  const {
    addComparisons,
    state: { issueSummaries, pendingRequests, stats },
  } = useContext(CoreContext);

  const router = useRouter();

  const [issueIds, setIssueIds] = useState<Array<string>>([issueId]);
  const [order, setOrder] = useState<Array<string>>([]);

  useEffect(() => {
    if (issueIds.length < 5) {
      setIssueIds((current) => {
        const relevantIssues = issueSummaries.filter(
          (issue) =>
            issue.state === "triage" ||
            issue.state === "backlog" ||
            issue.state === "unstarted"
        );
        const newIds: Array<string> = [...current];

        newIds.push(
          weightedRandomPick(
            [...relevantIssues.map(({ id }) => id)]
              .filter((x) => !newIds.includes(x))
              .sort(
                (a, b) =>
                  Math.abs(stats[issueId].rating - stats[a].rating) -
                  Math.abs(stats[issueId].rating - stats[b].rating)
              ),
            2
          )
        );

        return newIds;
      });
    }
  }, [issueId, issueIds, issueSummaries, stats]);

  return (
    <>
      <div className={styles.header}>
        <h1>{title}</h1>
      </div>
      <div className={styles.main}>
        {pendingRequests > 0 ? (
          <div>{pendingRequests} pending request(s)…</div>
        ) : (
          issueIds.map((id) => (
            <div key={id}>
              <IssueCard id={id} />
            </div>
          ))
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

              await addComparisons(comparisons);

              router.push(`/effort`);
            }}
            disabled={order.length !== issueIds.length || pendingRequests > 0}
          >
            Submit
          </button>
        </div>
      </div>
    </>
  );
};

export default IssueComparison;
