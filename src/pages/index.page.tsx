import type { NextPage } from "next";
import { useContext, useState } from "react";
import ComparisonValue from "../components/ComparisonValue";
import Layout from "../components/Layout";
import RelationshipGraph from "../components/RelationshipGraph";
import CoreContext from "../core/CoreContext";

const IndexPage: NextPage = () => {
  const [sortColumn, setSortColumn] = useState<{
    column: "priority" | "effort" | "value";
    direction: "asc" | "desc";
  }>({ column: "priority", direction: "desc" });

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

  const issuesToList = issueSummaries.filter(
    (issue) =>
      issue.state === "triage" ||
      issue.state === "backlog" ||
      issue.state === "unstarted"
  );

  const issuesWithOutOfDateEstimates = issuesToList.filter(
    (issue) =>
      stats.effort[issue.id].comparisons >= 4 &&
      issue.estimate !== recommendedEstimate(issue.id)
  );

  return (
    <Layout>
      <div
        style={{
          alignItems: "center",
          borderBottom: "1px solid #eee",
          display: "grid",
          gap: 10,
          gridAutoFlow: "column",
          justifyContent: "end",
          paddingBottom: 3,
        }}
      >
        <span>
          <b>Total</b>: {issuesToList.length}
        </span>
        <span>
          <b>Pending</b>: {issuesWithOutOfDateEstimates.length}
        </span>
        <button
          disabled={issuesWithOutOfDateEstimates.length === 0}
          onClick={async () => {
            for (const issue of issuesWithOutOfDateEstimates) {
              await updateIssueEstimate(
                issue.id,
                recommendedEstimate(issue.id)
              );
            }
          }}
        >
          Sync Now
        </button>
      </div>
      <table>
        <thead>
          <tr>
            {(
              [
                { key: "key", label: "Key" },
                { key: "project", label: "Project" },
                { key: "cycle", label: "Cycle" },
                { key: "title", label: "Title" },
                { key: "priority", label: "Priority", sortColumn: "priority" },
                { key: "effort", label: "Effort", sortColumn: "effort" },
                { key: "value", label: "Value", sortColumn: "value" },
                { key: "dependencies", label: "Dependencies" },
                {
                  key: "linear-estimate",
                  label: (
                    <>
                      Linear
                      <br />
                      Estimate
                    </>
                  ),
                },
              ] as const
            ).map((col) => (
              <th
                key={col.key}
                onClick={
                  "sortColumn" in col
                    ? () => {
                        setSortColumn((current) => ({
                          column: col.sortColumn,
                          direction:
                            current.column !== col.sortColumn ||
                            current.direction === "asc"
                              ? "desc"
                              : "asc",
                        }));
                      }
                    : undefined
                }
              >
                {col.label}
                {"sortColumn" in col ? (
                  <>
                    &nbsp;
                    {sortColumn.column === col.sortColumn
                      ? sortColumn.direction === "desc"
                        ? "↓"
                        : "↑"
                      : "↕"}
                  </>
                ) : null}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {issuesToList
            .sort((a, b) => {
              switch (sortColumn.column) {
                case "priority":
                  return sortColumn.direction === "desc"
                    ? priority(b.id) - priority(a.id)
                    : priority(a.id) - priority(b.id);
                case "effort":
                  return sortColumn.direction === "desc"
                    ? stats.effort[b.id].rating - stats.effort[a.id].rating
                    : stats.effort[a.id].rating - stats.effort[b.id].rating;
                case "value":
                  return sortColumn.direction === "desc"
                    ? stats.value[b.id].rating - stats.value[a.id].rating
                    : stats.value[a.id].rating - stats.value[b.id].rating;
              }
            })
            .map((issue) => {
              const id = issue.id;
              return (
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
                    {scales.effort(stats.effort[id].rating).toFixed(2)}&nbsp;(
                    <ComparisonValue>
                      {stats.effort[id].comparisons}
                    </ComparisonValue>
                    )
                  </td>
                  <td>
                    {scales.value(stats.value[id].rating).toFixed(2)}&nbsp;(
                    <ComparisonValue>
                      {stats.value[id].comparisons}
                    </ComparisonValue>
                    )
                  </td>
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
              );
            })}
        </tbody>
      </table>
    </Layout>
  );
};

export default IndexPage;
