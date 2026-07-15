import type { Node } from "../network.js";
import {
  buildSchematic,
  RESISTOR_HEIGHT,
  TERMINAL_LABEL_HEIGHT,
  TERMINAL_RADIUS,
  type SchematicShape,
} from "../schematicLayout.js";
import "./NetworkSchematic.scss";

interface Props {
  node: Node;
  description: string;
}

function renderShape(shape: SchematicShape, index: number) {
  switch (shape.kind) {
    case "wire":
      return (
        <line
          key={index}
          className="network-schematic__wire"
          x1={shape.x1}
          y1={shape.y1}
          x2={shape.x2}
          y2={shape.y2}
        />
      );
    case "resistor":
      return (
        <g key={index} className="network-schematic__resistor">
          <rect x={shape.x} y={shape.y} width={shape.width} height={shape.height} rx={2} />
          <text
            className="network-schematic__resistor-label"
            x={shape.x + shape.width / 2}
            y={shape.y - RESISTOR_HEIGHT / 2 + 1}
            textAnchor="middle"
          >
            {shape.label}
          </text>
        </g>
      );
    case "terminal":
      return (
        <g key={index} className="network-schematic__terminal">
          <circle cx={shape.x} cy={shape.y} r={TERMINAL_RADIUS} />
          <text
            className="network-schematic__terminal-label"
            x={shape.x}
            y={shape.y - TERMINAL_RADIUS - TERMINAL_LABEL_HEIGHT / 2}
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {shape.label}
          </text>
        </g>
      );
    case "junction":
      return <circle key={index} className="network-schematic__junction" cx={shape.x} cy={shape.y} r={3} />;
    default:
      return null;
  }
}

function NetworkSchematic({ node, description }: Props) {
  const schematic = buildSchematic(node);
  const title = `Schematic of ${description}`;

  return (
    <figure className="network-schematic" data-testid="network-schematic">
      <figcaption className="network-schematic__caption">Schematic</figcaption>
      <svg
        className="network-schematic__svg"
        viewBox={`0 0 ${schematic.width} ${schematic.height}`}
        role="img"
        aria-label={title}
        preserveAspectRatio="xMidYMid meet"
      >
        {schematic.shapes.map((shape, index) => renderShape(shape, index))}
      </svg>
    </figure>
  );
}

export default NetworkSchematic;
