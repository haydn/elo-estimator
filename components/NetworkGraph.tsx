import { Graph as G, toD3 } from "graph-fns";
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  SimulationNodeDatum,
  SimulationLinkDatum,
} from "d3-force";
import { Graph } from "@visx/network";
import { Link } from "@visx/network/lib/types";

type Props = {
  width: number;
  height: number;
  graph: G;
  forceStrength?: number;
  undirected?: boolean;
  label?: (id: string) => string;
  color?: (id: string) => string;
  textDecoration?: (id: string) => string;
};

const NetworkGraph = ({
  width,
  height,
  graph,
  forceStrength = 1500,
  undirected = false,
  label = (id) => id,
  color = () => "#000",
  textDecoration = () => "none",
}: Props) => {
  const d3Graph = toD3(graph);

  forceSimulation<SimulationNodeDatum & { id: string }>(d3Graph.nodes)
    .force(
      "link",
      forceLink<
        SimulationNodeDatum & { id: string },
        SimulationLinkDatum<SimulationNodeDatum & { id: string }>
      >(d3Graph.links).id((d) => d.id)
    )
    .force("charge", forceManyBody().strength(-forceStrength))
    .force("center", forceCenter(width / 2, height / 2))
    .stop()
    .tick(50);

  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      <defs>
        <marker
          id="arrow"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="4"
          markerHeight="4"
          orient="auto-start-reverse"
        >
          <path fill="#000" d="M 0 0 L 10 5 L 0 10 z" />
        </marker>
      </defs>
      <rect width={width} height={height} fill={"#fff"} />
      <Graph<any, any>
        graph={d3Graph}
        linkComponent={({ link }) => {
          const dx = link.target.x - link.source.x;
          const dy = link.target.y - link.source.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const gx = Math.cos(Math.atan2(dy, dx)) * (distance < 64 ? 18 : 24);
          const gy = Math.cos(Math.atan2(dx, dy)) * (distance < 64 ? 18 : 24);
          const sx = link.source.x + gx;
          const sy = link.source.y + gy;
          const tx = link.target.x - gx;
          const ty = link.target.y - gy;
          return (
            <path
              d={`M ${sx} ${sy} L ${tx} ${ty}`}
              strokeWidth={distance < 64 ? 1 : 2}
              stroke="#000"
              fill="none"
              markerEnd={
                undirected || distance < 32 + 8 ? undefined : "url(#arrow)"
              }
            />
          );
        }}
        nodeComponent={({ node }) => (
          <text
            fill={color(node.id)}
            textAnchor="middle"
            dy={6}
            fontFamily="sans-serif"
            textDecoration={textDecoration(node.id)}
          >
            {label(node.id)}
          </text>
        )}
      />
    </svg>
  );
};

export default NetworkGraph;
