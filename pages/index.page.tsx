import type { NextPage } from "next";
import { useContext } from "react";
import ComparisonValue from "../components/ComparisonValue";
import Layout from "../components/Layout";
import RelationshipGraph from "../components/RelationshipGraph";
import CoreContext from "../core/CoreContext";

const IndexPage: NextPage = () => {
  const { state, updateIssueEstimate } = useContext(CoreContext);

  const { issueSummaries, scales, stats } = state;

  const minRating = Object.keys(stats.effort).reduce(
    (current, id) => Math.min(stats.effort[id].rating, current),
    Number.MAX_VALUE
  );

  const maxRating = Object.keys(stats.effort).reduce(
    (current, id) => Math.max(stats.effort[id].rating, current),
    Number.MIN_VALUE
  );

  const priority = (id: string) =>
    scales.value(stats.value[id].rating) -
    scales.effort(stats.effort[id].rating);

  const recommendedEstimate = (id: string) => {
    const step = (maxRating - minRating) / [1, 2, 3, 5, 8, 13].length;
    let index = [1, 2, 3, 5, 8, 13].length - 1;
    while (index > 0 && stats.effort[id].rating > maxRating - step * index) {
      index -= 1;
    }
    return [1, 2, 3, 5, 8, 13][index];
  };

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
          {issueSummaries
            .filter(
              (issue) =>
                issue.state === "triage" ||
                issue.state === "backlog" ||
                issue.state === "unstarted"
            )
            .map(({ id }) => id)
            .sort((a, b) => priority(b) - priority(a))
            .map((id) => {
              const issue = issueSummaries.find((i) => i.id === id);
              return issue ? (
                <tr key={issue.id}>
                  <td>
                    <span style={{ whiteSpace: "nowrap" }}>
                      {issue.identifier}
                    </span>
                  </td>
                  <td>{issue.projectName}</td>
                  <td>{issue.cycle}</td>
                  <td>{issue.title}</td>
                  <td>{priority(id).toFixed(2)}</td>
                  <td>
                    <ComparisonValue>
                      {stats.effort[id].comparisons}
                    </ComparisonValue>
                  </td>
                  <td>
                    <ComparisonValue>
                      {stats.value[id].comparisons}
                    </ComparisonValue>
                  </td>
                  <td>{scales.effort(stats.value[id].rating).toFixed(2)}</td>
                  <td>{scales.value(stats.value[id].rating).toFixed(2)}</td>
                  <td>
                    <RelationshipGraph
                      context={state}
                      issueIdentifier={issue.identifier}
                    />
                    {null}
                  </td>
                  <td>
                    {stats.effort[id].comparisons >= 4
                      ? recommendedEstimate(id)
                      : "-"}{" "}
                    {stats.effort[id].comparisons >= 4 &&
                    issue.estimate !== recommendedEstimate(id) ? (
                      <button
                        onClick={async () => {
                          updateIssueEstimate(
                            issue.id,
                            recommendedEstimate(id)
                          );
                        }}
                      >
                        Update ({issue.estimate ?? "-"})
                      </button>
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
