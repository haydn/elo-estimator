import { ParentSize } from "@visx/responsive";
import { addEdge, create, Graph, isCyclic } from "graph-fns";
import { useEffect, useState } from "react";
import NetworkGraph from "../components/NetworkGraph";
import { Data } from "../utils/AppContext";
import { RelationSummary } from "../utils/linear";
import Layer from "./Layer";
import { card } from "./RelationshipGraph.css";

const getAncestors = (
  relations: Array<RelationSummary>,
  identifier: string
): Array<string> => {
  const ancestors = relations
    .filter((relation) => relation.relatedIssueIdentifier === identifier)
    .map((relation) => relation.issueIdentifier);
  return ancestors.length > 0
    ? ancestors.concat(
        ancestors.flatMap((ancestor) => getAncestors(relations, ancestor))
      )
    : [];
};

const getDescendants = (
  relations: Array<RelationSummary>,
  identifier: string
): Array<string> => {
  const descendants = relations
    .filter((relation) => relation.issueIdentifier === identifier)
    .map((relation) => relation.relatedIssueIdentifier);
  return descendants.length > 0
    ? descendants.concat(
        descendants.flatMap((descendant) =>
          getDescendants(relations, descendant)
        )
      )
    : [];
};

const RelationshipGraph = ({
  data,
  issueIdentifier,
}: {
  data: Data;
  issueIdentifier: string;
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

  const blockingRelations = data.relations.filter(
    (relation) => relation.type === "blocks"
  );

  const ancestors = getAncestors(blockingRelations, issueIdentifier);
  const descendants = getDescendants(blockingRelations, issueIdentifier);

  if (ancestors.length === 0 && descendants.length === 0) {
    return <p>No dependencies or dependants.</p>;
  }

  const all = [...ancestors, issueIdentifier, ...descendants];

  let graph = create(all.length, (index) => all[index]);

  for (let relation of blockingRelations) {
    if (
      graph[relation.issueIdentifier] &&
      graph[relation.relatedIssueIdentifier]
    ) {
      graph = addEdge(graph, [
        relation.issueIdentifier,
        relation.relatedIssueIdentifier,
      ]);
    }
  }

  return isCyclic(graph) ? (
    <p>Dependency graph is cyclic.</p>
  ) : showing ? (
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
                  label={(identifier) =>
                    data.issues.find((issue) => issue.identifier === identifier)
                      ?.title ?? identifier
                  }
                  color={(identifier) => {
                    const issue = data.issues.find(
                      (issue) => issue.identifier === identifier
                    );
                    return issue?.state === "completed" ||
                      issue?.state === "canceled"
                      ? "#999"
                      : identifier === issueIdentifier
                      ? "#000"
                      : ancestors.includes(identifier)
                      ? "#900"
                      : "#090";
                  }}
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

export default RelationshipGraph;
