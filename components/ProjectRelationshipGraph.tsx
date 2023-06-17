import { ParentSize } from "@visx/responsive";
import { addEdge, addVertex, create, isCyclic } from "graph-fns";
import { useEffect, useState } from "react";
import NetworkGraph from "../components/NetworkGraph";
import { Data } from "../utils/AppContext";
import { RelationSummary } from "../utils/linear";
import Layer from "./Layer";
import { card } from "./ProjectRelationshipGraph.css";
import emoji from "node-emoji";

type Item =
  | { type: "project"; id: string; label: string }
  | { type: "issue"; id: string; label: string };

const getAncestors = (
  relations: Array<RelationSummary>,
  identifiers: Array<string>
): Array<string> => {
  const ancestors = relations
    .filter((relation) => identifiers.includes(relation.relatedIssueIdentifier))
    .map((relation) => relation.issueIdentifier);
  return ancestors.length > 0
    ? ancestors.concat(
        ancestors.flatMap((ancestor) => getAncestors(relations, [ancestor]))
      )
    : [];
};

const getDescendants = (
  relations: Array<RelationSummary>,
  identifiers: Array<string>
): Array<string> => {
  const descendants = relations
    .filter((relation) => identifiers.includes(relation.issueIdentifier))
    .map((relation) => relation.relatedIssueIdentifier);
  return descendants.length > 0
    ? descendants.concat(
        descendants.flatMap((descendant) =>
          getDescendants(relations, [descendant])
        )
      )
    : [];
};

const ProjectRelationshipGraph = ({
  data,
  projectId,
}: {
  data: Data;
  projectId: string;
}) => {
  const [showing, setShowing] = useState(false);
  const [forceStrength, setForceStrength] = useState(1500);

  useEffect(() => {
    const escapeListener = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowing(false);
      }
    };

    document.addEventListener("keydown", escapeListener);

    return () => {
      document.removeEventListener("keydown", escapeListener);
    };
  });

  const projectIssueIdentifiers = data.issues
    .filter(
      (issue) =>
        issue.state === "triage" ||
        issue.state === "backlog" ||
        issue.state === "unstarted"
    )
    .filter((issue) => issue.projectId === projectId)
    .map((issue) => issue.identifier);

  const blockingRelations = data.relations.filter(
    (relation) => relation.type === "blocks"
  );

  const ancestors = getAncestors(blockingRelations, projectIssueIdentifiers);
  const descendants = getDescendants(
    blockingRelations,
    projectIssueIdentifiers
  );

  if (ancestors.length === 0 && descendants.length === 0) {
    return <p>-</p>;
  }

  const ancestorItems: Array<Item> = [];

  for (let ancestor of ancestors) {
    const issue = data.issues.find((issue) => issue.identifier === ancestor);
    if (!issue) continue;
    if (issue.projectId !== undefined && issue.projectName !== undefined) {
      ancestorItems.push({
        type: "project",
        id: issue.projectId,
        label: `${
          issue.projectIcon && emoji.hasEmoji(issue.projectIcon)
            ? emoji.get(issue.projectIcon) + " "
            : ""
        }${issue.projectName}`,
      });
    } else {
      ancestorItems.push({
        type: "issue",
        id: issue.identifier,
        label: issue.title,
      });
    }
  }

  const descendantItems: Array<Item> = [];

  for (let descendant of descendants) {
    const issue = data.issues.find((issue) => issue.identifier === descendant);
    if (!issue) continue;
    if (issue.projectId !== undefined && issue.projectName !== undefined) {
      descendantItems.push({
        type: "project",
        id: issue.projectId,
        label: `${
          issue.projectIcon && emoji.hasEmoji(issue.projectIcon)
            ? emoji.get(issue.projectIcon) + " "
            : ""
        }${issue.projectName}`,
      });
    } else {
      descendantItems.push({
        type: "issue",
        id: issue.identifier,
        label: issue.title,
      });
    }
  }

  const all = [...ancestors, ...projectIssueIdentifiers, ...descendants];

  let graph = create();

  const items: Array<Item> = [];

  for (let relation of blockingRelations) {
    if (
      !all.includes(relation.issueIdentifier) ||
      !all.includes(relation.relatedIssueIdentifier)
    ) {
      continue;
    }

    const issue = data.issues.find(
      (issue) => issue.identifier === relation.issueIdentifier
    );
    const relatedIssue = data.issues.find(
      (issue) => issue.identifier === relation.relatedIssueIdentifier
    );

    if (!issue || !relatedIssue) continue;
    if (issue.state === "completed" || relatedIssue.state === "completed")
      continue;
    if (issue.state === "canceled" || relatedIssue.state === "canceled")
      continue;

    const issueItem: Item =
      issue.projectId && issue.projectName
        ? {
            type: "project",
            id: issue.projectId,
            label: `${
              issue.projectIcon && emoji.hasEmoji(issue.projectIcon)
                ? emoji.get(issue.projectIcon) + " "
                : ""
            }${issue.projectName}`,
          }
        : {
            type: "issue",
            id: issue.identifier,
            label: issue.title
              ? `[${issue.identifier}] ${issue.title}`
              : issue.identifier,
          };

    const relatedIssueItem: Item =
      relatedIssue.projectId && relatedIssue.projectName
        ? {
            type: "project",
            id: relatedIssue.projectId,
            label: `${
              relatedIssue.projectIcon &&
              emoji.hasEmoji(relatedIssue.projectIcon)
                ? emoji.get(relatedIssue.projectIcon) + " "
                : ""
            }${relatedIssue.projectName}`,
          }
        : {
            type: "issue",
            id: relatedIssue.identifier,
            label: relatedIssue.title
              ? `[${relatedIssue.identifier}] ${relatedIssue.title}`
              : relatedIssue.identifier,
          };

    if (issueItem.id === relatedIssueItem.id) continue;

    if (!items.some((item) => item.id === issueItem.id)) {
      items.push(issueItem);
      graph = addVertex(graph, issueItem.id);
    }

    if (!items.some((item) => item.id === relatedIssueItem.id)) {
      items.push(relatedIssueItem);
      graph = addVertex(graph, relatedIssueItem.id);
    }

    graph = addEdge(graph, [issueItem.id, relatedIssueItem.id]);
  }

  if (items.length === 0) {
    return <p>-</p>;
  }

  return showing ? (
    <Layer>
      <div
        style={{
          inset: 20,
          position: "absolute",
        }}
      >
        <div style={{ width: "100%", height: "100%" }}>
          <ParentSize>
            {({ width, height }) => (
              <div className={card}>
                <NetworkGraph
                  width={width}
                  height={height}
                  graph={graph}
                  forceStrength={forceStrength}
                  label={(id) => {
                    const item = items.find((item) => item.id === id);
                    return item?.label ?? "Unknown";
                  }}
                  color={(id) => {
                    // const item = items.find((item) => item.id === id);
                    return id === projectId
                      ? "#000"
                      : ancestorItems.some((item) => item.id === id)
                      ? "#900"
                      : "#090";
                  }}
                  // label={(identifier) => {
                  //   const issue = data.issues.find(
                  //     (issue) => issue.identifier === identifier
                  //   );
                  //   return issue?.title
                  //     ? `[${identifier}] ${issue?.title} (${issue.projectName})`
                  //     : identifier;
                  // }}
                  // color={(identifier) => {
                  //   const issue = data.issues.find(
                  //     (issue) => issue.identifier === identifier
                  //   );
                  //   return issue?.state === "completed" ||
                  //     issue?.state === "canceled"
                  //     ? "#999"
                  //     : projectIssueIdentifiers.includes(identifier)
                  //     ? "#000"
                  //     : ancestors.includes(identifier)
                  //     ? "#900"
                  //     : "#090";
                  // }}
                  // textDecoration={(identifier) => {
                  //   const issue = data.issues.find(
                  //     (issue) => issue.identifier === identifier
                  //   );
                  //   return issue?.state === "completed" ||
                  //     issue?.state === "canceled"
                  //     ? "line-through"
                  //     : "none";
                  // }}
                />
              </div>
            )}
          </ParentSize>
        </div>
        <button
          onClick={() => {
            setShowing(false);
          }}
          style={{ position: "absolute", right: 20, top: 20 }}
        >
          Close
        </button>
        <input
          type="range"
          min={0}
          max={5000}
          value={forceStrength}
          onChange={({ target: { value } }) => {
            setForceStrength(parseInt(value, 10));
          }}
          style={{ position: "absolute", left: 20, top: 20 }}
        />
      </div>
    </Layer>
  ) : (
    <button
      onClick={() => {
        setShowing(true);
      }}
    >
      Dependency Graph
    </button>
  );
};

export default ProjectRelationshipGraph;
