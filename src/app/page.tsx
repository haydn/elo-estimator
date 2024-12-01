"use client";

import useDataThing from "@/hooks/useDataThing";
import type { NextPage } from "next";
import Link from "next/link";
import { useState } from "react";
import ComparisonValue from "../components/ComparisonValue";
import ProjectName from "../components/ProjectName";
import RelationshipGraph from "../components/RelationshipGraph";

const IndexPage: NextPage = () => {
  const [sortColumn, setSortColumn] = useState<{
    column: "key" | "effort";
    direction: "asc" | "desc";
  }>({ column: "effort", direction: "desc" });

  const data = useDataThing();

  if (!data) {
    return <div>Loading…</div>;
  }

  const {
    issuesWithOutOfDateEstimates,
    recommendedEstimates,
    relevantIssues,
    scales,
    stats,
    updateIssueEstimate,
  } = data;

  return (
    <>
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
          <b>Total</b>: {relevantIssues.length}
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
                recommendedEstimates[issue.id]
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
                { key: "key", label: "Key", sortColumn: "key" },
                { key: "project", label: "Project" },
                { key: "cycle", label: "Cycle" },
                { key: "title", label: "Title" },
                { key: "effort", label: "Effort", sortColumn: "effort" },
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
          {relevantIssues
            .sort((a, b) => {
              switch (sortColumn.column) {
                case "key":
                  const aNum = parseInt(a.identifier.replaceAll(/[^\d]/g, ""));
                  const bNum = parseInt(b.identifier.replaceAll(/[^\d]/g, ""));
                  return sortColumn.direction === "desc"
                    ? aNum - bNum
                    : bNum - aNum;
                case "effort":
                  return sortColumn.direction === "desc"
                    ? stats[b.id].rating - stats[a.id].rating
                    : stats[a.id].rating - stats[b.id].rating;
              }
            })
            .map((issue) => {
              const id = issue.id;
              return (
                <tr key={issue.id}>
                  <td>
                    <Link href={`/effort/${issue.id}`}>
                      <span style={{ whiteSpace: "nowrap" }}>
                        {issue.identifier}
                      </span>
                    </Link>
                  </td>
                  <td>
                    {issue.projectName ? (
                      <ProjectName
                        name={issue.projectName}
                        icon={issue.projectIcon}
                      />
                    ) : null}
                  </td>
                  <td>{issue.cycle}</td>
                  <td>{issue.title}</td>
                  <td>
                    {scales(stats[id].rating).toFixed(2)}&nbsp;(
                    <ComparisonValue>{stats[id].comparisons}</ComparisonValue>)
                  </td>
                  <td>
                    <RelationshipGraph issueIdentifier={issue.identifier} />
                  </td>
                  <td>
                    {stats[id].comparisons >= 4
                      ? recommendedEstimates[id]
                      : "-"}{" "}
                    {stats[id].comparisons >= 4 &&
                    issue.estimate !== recommendedEstimates[id] ? (
                      <button
                        onClick={async () => {
                          updateIssueEstimate(
                            issue.id,
                            recommendedEstimates[id]
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
    </>
  );
};

export default IndexPage;
