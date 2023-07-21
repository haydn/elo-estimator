import type { NextPage } from "next";
import ComparisonValue from "../components/ComparisonValue";
import Layout from "../components/Layout";
import OneTimeButton from "../components/OneTimeButton";
import RelationshipGraph from "../components/RelationshipGraph";
import getCombinedStats from "../utils/getCombinedStats";
import { Context } from "../utils/linear";
import ratingToEstimate from "../utils/ratingToEstimate";

type Props = {
  context: Context;
};

const IndexPage: NextPage<Props> = ({ context }) => {
  const credentials = context;
  const data = context;
  const updateIssue = context.updateIssue;

  const stats = getCombinedStats(
    data.issueSummaries,
    data.effortComparisons.map((x) => ({
      id: x.id,
      entities: [x.issueAId, x.issueBId],
      result: x.result,
      date: x.id,
    })),
    data.valueComparisons.map((x) => ({
      id: x.id,
      entities: [x.issueAId, x.issueBId],
      result: x.result,
      date: x.id,
    }))
  );

  const minRating = Object.keys(stats).reduce(
    (current, id) => Math.min(stats[id].effort.rating, current),
    Number.MAX_VALUE
  );

  const maxRating = Object.keys(stats).reduce(
    (current, id) => Math.max(stats[id].effort.rating, current),
    Number.MIN_VALUE
  );

  return (
    <Layout>
      <table>
        <thead>
          <tr>
            <th>Key</th>
            <th>Project</th>
            <th>Cycle</th>
            <th>Title</th>
            <th>Rank</th>
            <th>
              Effort
              <br />
              Count
            </th>
            <th>
              Value
              <br />
              Count
            </th>
            <th>
              Effort
              <br />
              Rating
            </th>
            <th>
              Value
              <br />
              Rating
            </th>
            <th>Dependencies</th>
            <th>
              Linear
              <br />
              Estimate
            </th>
          </tr>
        </thead>
        <tbody>
          {data.issueSummaries
            .filter(
              (issue) =>
                issue.state === "triage" ||
                issue.state === "backlog" ||
                issue.state === "unstarted"
            )
            .map(({ id }) => id)
            .sort((a, b) => stats[b].priority - stats[a].priority)
            .map((id) => {
              const issue = data.issueSummaries.find((i) => i.id === id);
              const recommendedEstimate = ratingToEstimate(
                stats[id].effort.rating,
                minRating,
                maxRating,
                [1, 2, 3, 5, 8, 13]
              );
              return issue ? (
                <tr key={issue.id}>
                  <td>
                    <span style={{ whiteSpace: "nowrap" }}>
                      {issue.identifier}
                    </span>
                  </td>
                  <td>{issue.projectName}</td>
                  <td>{issue.cycleNumber}</td>
                  <td>{issue.title}</td>
                  <td>{stats[id].priority.toFixed(2)}</td>
                  <td>
                    <ComparisonValue>
                      {stats[id].effort.comparisons}
                    </ComparisonValue>
                  </td>
                  <td>
                    <ComparisonValue>
                      {stats[id].value.comparisons}
                    </ComparisonValue>
                  </td>
                  <td>{stats[id].effort.scaled.toFixed(2)}</td>
                  <td>{stats[id].value.scaled.toFixed(2)}</td>
                  <td>
                    <RelationshipGraph
                      context={context}
                      issueIdentifier={issue.identifier}
                    />
                  </td>
                  <td>
                    {stats[id].effort.comparisons >= 4
                      ? recommendedEstimate
                      : "-"}{" "}
                    {stats[id].effort.comparisons >= 4 &&
                    issue.estimate !== recommendedEstimate ? (
                      <OneTimeButton
                        onClick={async () => {
                          const success = await updateIssue(
                            credentials.linearApiKey,
                            issue.id,
                            {
                              estimate: recommendedEstimate,
                            }
                          );
                          if (!success) {
                            window.alert(
                              `Problem updating ${issue.identifier}.`
                            );
                          }
                        }}
                      >
                        Update ({issue.estimate ?? "-"})
                      </OneTimeButton>
                    ) : null}
                  </td>
                </tr>
              ) : null;
            })}
        </tbody>
      </table>
    </Layout>
  );
};

export default IndexPage;
