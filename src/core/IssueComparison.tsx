import styles from "./IssueComparison.module.css";

import useDataThing from "@/hooks/useDataThing";
import weightedRandomPick from "@/utils/weightedRandomPick";
import { useRouter } from "next/navigation";
import {
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import IssueCard from "../components/IssueCard";
import type { Comparison } from "./_types";
import CoreContext from "./CoreContext";
import useEffortComparisons from "@/hooks/useEffortComparisons";
import useRelevantIssues from "@/hooks/useRelevantIssues";
import useStats from "@/hooks/useStats";

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
  const router = useRouter();

  const { apiKey, teamId } = useContext(CoreContext);

  const stats = useStats();
  const relevantIssues = useRelevantIssues();

  const [issueIds, setIssueIds] = useState<Array<string>>([issueId]);
  const [order, setOrder] = useState<Array<string>>([]);

  useEffect(() => {
    if (relevantIssues && stats && issueIds.length < 5) {
      setIssueIds((current) => {
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
  }, [issueId, issueIds, relevantIssues, stats]);

  const { data: effortComparisons, mutate: mutateEffortComparisons } =
    useEffortComparisons();

  const addComparisons = useCallback(
    async (
      comparisons: Array<Pick<Comparison, "issueAId" | "issueBId" | "result">>
    ) => {
      const latestComparison = [...(effortComparisons ?? [])]
        .sort((a, b) => b.id.localeCompare(a.id))
        .find(() => true);

      const response = await fetch(`/api/linear/${teamId}/effort/comparisons`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          apiKey: apiKey,
          comparisons,
          highWaterMark: latestComparison?.id,
        }),
      });

      if (response.status !== 200) {
        throw Error(await response.text());
      }

      const newComparisons = await response.json();

      await mutateEffortComparisons(
        (current) => [...(current ?? []), ...newComparisons],
        {
          revalidate: false,
        }
      );
    },
    [apiKey, effortComparisons, mutateEffortComparisons, teamId]
  );

  return (
    <>
      <div className={styles.header}>
        <h1>{title}</h1>
      </div>
      <div className={styles.main}>
        {issueIds.map((id) => (
          <div key={id}>
            <IssueCard id={id} />
          </div>
        ))}
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

              await addComparisons(comparisons);

              router.push(`/effort`);
            }}
            disabled={order.length !== issueIds.length}
          >
            Submit
          </button>
        </div>
      </div>
    </>
  );
};

export default IssueComparison;
