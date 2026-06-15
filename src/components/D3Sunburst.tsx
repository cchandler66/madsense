import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { FlavorWheelNode, SECTOR_COLORS } from '../data/flavorWheelData';

interface D3SunburstProps {
  data: FlavorWheelNode;
  onSelectTerm?: (term: string) => void;
  onHoverTerm?: (term: string) => void;
}

export const D3Sunburst: React.FC<D3SunburstProps> = ({ data, onSelectTerm, onHoverTerm }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data) return;

    // Clear previous
    d3.select(svgRef.current).selectAll("*").remove();

    const width = 450;
    const height = 450;
    const radius = Math.min(width, height) / 2;

    const svg = d3.select(svgRef.current)
      .attr("viewBox", `-${width / 2} -${height / 2} ${width} ${height}`)
      .style("max-width", "100%")
      .style("height", "auto")
      .style("font", "10px sans-serif");

    // Compute hierarchy and partition
    const root = d3.hierarchy<FlavorWheelNode>(data)
      .sum(d => d.children ? 0 : 1)
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    const partition = d3.partition<FlavorWheelNode>()
      .size([2 * Math.PI, root.height + 1]);

    partition(root);

    const arc = d3.arc<d3.HierarchyRectangularNode<FlavorWheelNode>>()
      .startAngle(d => d.x0)
      .endAngle(d => d.x1)
      .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
      .padRadius(radius * 1.5)
      .innerRadius(d => d.y0 * radius / (root.height + 1))
      .outerRadius(d => Math.max(d.y0 * radius / (root.height + 1), d.y1 * radius / (root.height + 1) - 1));

    // Colors
    // Find highest level category for coloring
    const getColor = (d: d3.HierarchyRectangularNode<FlavorWheelNode>): string => {
      let current = d;
      while (current.depth > 1) {
        current = current.parent!;
      }
      return current.depth === 1 ? SECTOR_COLORS[current.data.name] || "#475569" : "#0f172a";
    };

    const formatLabel = (name: string) => {
      // return small label, remove long parts
      if (name.length > 15) {
        return name.substring(0, 12) + "...";
      }
      return name;
    }

    // Add path elements
    const path = svg.append("g")
      .selectAll("path")
      .data((root.descendants() as d3.HierarchyRectangularNode<FlavorWheelNode>[]).filter(d => d.depth > 0)) // Exclude root (Beer)
      .join("path")
      .attr("fill", d => getColor(d))
      .attr("fill-opacity", d => d.children ? 0.6 : 0.8)
      .attr("d", arc)
      .style("cursor", "pointer")
      .style("transition", "fill-opacity 0.2s")
      .on("mouseover", function(event, d) {
        d3.select(this).attr("fill-opacity", 1);
        if (onHoverTerm) onHoverTerm(d.data.name);
      })
      .on("mouseout", function(event, d) {
        d3.select(this).attr("fill-opacity", d.children ? 0.6 : 0.8);
      })
      .on("click", (event, d) => {
        if (onSelectTerm) onSelectTerm(d.data.name);
      });

    path.append("title")
      .text(d => `${d.ancestors().map(d => d.data.name).reverse().join(" > ")}${d.data.chem ? `\nChem: ${d.data.chem}` : ""}`);

    // Add text labels
    svg.append("g")
      .attr("pointer-events", "none")
      .attr("text-anchor", "middle")
      .style("user-select", "none")
      .selectAll("text")
      .data((root.descendants() as d3.HierarchyRectangularNode<FlavorWheelNode>[]).filter(d => d.depth > 0 && (d.y0 + d.y1) / 2 * (d.x1 - d.x0) > 10))
      .join("text")
      .attr("transform", function(d) {
        const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
        const y = (d.y0 + d.y1) / 2 * radius / (root.height + 1);
        return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
      })
      .attr("dy", "0.35em")
      .attr("fill", d => d.depth === 1 ? "#fff" : "#e2e8f0")
      .style("font-weight", d => d.depth === 1 ? "bold" : "normal")
      .style("font-size", d => d.depth === 1 ? "12px" : "8px")
      .text(d => formatLabel(d.data.name));

  }, [data, onSelectTerm, onHoverTerm]);

  return <svg ref={svgRef} className="w-full h-full min-h-[300px]"></svg>;
};
