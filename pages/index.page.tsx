import type { NextPage } from "next";
import { useContext } from "react";
import ComparisonValue from "../components/ComparisonValue";
import Layout from "../components/Layout";
import OneTimeButton from "../components/OneTimeButton";
import AppContext from "../utils/AppContext";
import getCombinedStats from "../utils/getCombinedStats";
import { updateIssue } from "../utils/linear";
import ratingToEstimate from "../utils/ratingToEstimate";

const IndexPage: NextPage = () => {
  const { credentials, data } = useContext(AppContext);
  const stats = getCombinedStats(data.issues);

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
            <th>
              Linear
              <br />
              Estimate
            </th>
          </tr>
        </thead>
        <tbody>
          {data.issues
            .filter(
              (issue) =>
                issue.state === "triage" ||
                issue.state === "backlog" ||
                issue.state === "unstarted"
            )
            .map(({ id }) => id)
            .sort((a, b) => stats[b].priority - stats[a].priority)
            .map((id) => {
              const issue = data.issues.find((i) => i.id === id);
              const recommendedEstimate = ratingToEstimate(
                stats[id].effort.rating,
                minRating,
                maxRating,
                [1, 2, 3, 5, 8, 13]
              );
              return issue ? (
                <tr key={issue.id}>
                  <td>{issue.identifier}</td>
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
                    {stats[id].effort.comparisons >= 4
                      ? recommendedEstimate
                      : "-"}{" "}
                    {stats[id].effort.comparisons >= 4 &&
                    issue.estimate !== recommendedEstimate ? (
                      <OneTimeButton
                        onClick={async () => {
                          const success = await updateIssue(
                            credentials,
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
