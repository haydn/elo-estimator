import compareDesc from "date-fns/compareDesc";
import formatDistance from "date-fns/formatDistance";
import parseISO from "date-fns/parseISO";
import type { NextPage } from "next";
import { Fragment } from "react";
import Layout from "../components/Layout";
import SettingsForm from "../components/SettingsForm";
import { EloTournament } from "../utils/elo";
import { Context } from "../utils/linear";

const EFFORT_LOCAL_STORAGE_KEY = "effort_comparisons";
const VALUE_LOCAL_STORAGE_KEY = "value_comparisons";

enum ComparisonType {
  Effort = "Effort",
  Value = "Value",
}

type Props = {
  context: Context;
};

const SettingsPage: NextPage<Props> = ({ context }) => {
  const effortComparisons: EloTournament["comparisons"] = JSON.parse(
    window.localStorage.getItem(EFFORT_LOCAL_STORAGE_KEY) ?? "[]"
  );
  const valueComparisons: EloTournament["comparisons"] = JSON.parse(
    window.localStorage.getItem(VALUE_LOCAL_STORAGE_KEY) ?? "[]"
  );

  const comparisons = effortComparisons
    .map((c) => ({ ...c, type: ComparisonType.Effort }))
    .concat(valueComparisons.map((c) => ({ ...c, type: ComparisonType.Value })))
    .sort((a, b) => compareDesc(parseISO(a.date), parseISO(b.date)))
    .slice(0, 200);

  return (
    <Layout>
      <h1>Config</h1>
      <SettingsForm />
      <h1>History</h1>
      <dl>
        {comparisons.map((comparison) => {
          return (
            <Fragment key={comparison.id}>
              <dt>
                {formatDistance(parseISO(comparison.date), new Date(), {
                  addSuffix: true,
                  includeSeconds: true,
                })}
              </dt>
              <dd>
                <Label comparison={comparison} context={context} />
              </dd>
            </Fragment>
          );
        })}
      </dl>
    </Layout>
  );
};

const Label = ({
  comparison,
  context,
}: {
  comparison: EloTournament["comparisons"][number] & { type: ComparisonType };
  context: Context;
}) => {
  // const { removeComparison: removeEffortComparison } = useIssues(
  //   context.credentials,
  //   context.data.issues,
  //   EFFORT_LOCAL_STORAGE_KEY
  // );
  // const { removeComparison: removeValueComparison } = useIssues(
  //   context.credentials,
  //   context.data.issues,
  //   VALUE_LOCAL_STORAGE_KEY
  // );

  const issueA = context.issueSummaries.find(
    ({ id }) => id === comparison.entities[0]
  );

  const issueB = context.issueSummaries.find(
    ({ id }) => id === comparison.entities[1]
  );

  switch (comparison.type) {
    case ComparisonType.Effort:
      return (
        <span>
          <abbr title={issueA?.title}>{issueA?.identifier ?? "UNKNOWN"}</abbr>{" "}
          is quicker to resolve than{" "}
          <abbr title={issueB?.title}>{issueB?.identifier ?? "UNKNOWN"}</abbr>{" "}
          {/* <button
            onClick={() => {
              removeEffortComparison(comparison.id);
            }}
          >
            Delete
          </button> */}
        </span>
      );
    case ComparisonType.Value:
      return (
        <span>
          <abbr title={issueA?.title}>{issueA?.identifier ?? "UNKNOWN"}</abbr>{" "}
          should be resolved before{" "}
          <abbr title={issueB?.title}>{issueB?.identifier ?? "UNKNOWN"}</abbr>{" "}
          {/* <button
            onClick={() => {
              removeValueComparison(comparison.id);
            }}
          >
            Delete
          </button> */}
        </span>
      );
  }
};

export default SettingsPage;
