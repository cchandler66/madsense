import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

export interface SpiderData {
  attribute: string;
  targetValue: number;
  actualValue: number;
}

interface Props {
  data: SpiderData[];
  size?: number;
}

export const SensorySpiderWeb: React.FC<Props> = ({ data, size = 400 }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    const margin = 50;
    const radius = size / 2 - margin;
    const angleSlice = (Math.PI * 2) / data.length;
    
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("width", size)
      .attr("height", size)
      .append("g")
      .attr("transform", `translate(${size / 2},${size / 2})`);

    const rScale = d3.scaleLinear().range([0, radius]).domain([0, 9]); // 9-point scale

    // Draw grid circles
    const ticks = [2, 4, 6, 8];
    svg.selectAll(".grid-circle")
      .data(ticks)
      .enter()
      .append("circle")
      .attr("class", "grid-circle")
      .attr("r", d => rScale(d))
      .style("fill", "none")
      .style("stroke", "rgba(255,255,255,0.1)")
      .style("stroke-dasharray", "3,3");

    // Draw axes
    svg.selectAll(".axis")
      .data(data)
      .enter()
      .append("line")
      .attr("class", "axis")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", (d, i) => rScale(9) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr("y2", (d, i) => rScale(9) * Math.sin(angleSlice * i - Math.PI / 2))
      .style("stroke", "rgba(255,255,255,0.1)")
      .style("stroke-width", "1px");

    // Axis labels
    svg.selectAll(".axis-label")
      .data(data)
      .enter()
      .append("text")
      .attr("class", "axis-label")
      .attr("x", (d, i) => rScale(10.5) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr("y", (d, i) => rScale(10.5) * Math.sin(angleSlice * i - Math.PI / 2))
      .text(d => d.attribute)
      .style("text-anchor", "middle")
      .style("alignment-baseline", "middle")
      .style("fill", "#94a3b8")
      .style("font-size", "11px")
      .style("font-family", "monospace");

    const radarLine = d3.lineRadial<SpiderData>()
      .angle((d, i) => i * angleSlice)
      .radius(d => rScale(d.value))
      .curve(d3.curveLinearClosed);

    // Target (Gold Standard) - Static Muted Polygon
    const targetData = data.map(d => ({ ...d, value: d.targetValue }));
    svg.append("path")
      .datum(targetData)
      .attr("d", radarLine)
      .style("fill", "rgba(148, 163, 184, 0.1)")
      .style("stroke", "#64748b")
      .style("stroke-width", 2)
      .style("stroke-dasharray", "4,4");

    // Actual Batch - Animated Overlay
    const actualData = data.map(d => ({ ...d, value: d.actualValue }));
    const actualPath = svg.append("path")
      .datum(actualData)
      .attr("d", radarLine)
      .style("fill", "rgba(6, 182, 212, 0.2)") // cyan-500
      .style("stroke", "#06b6d4")
      .style("stroke-width", 2)
      .style("opacity", 0);

    // Transition animation
    actualPath.transition().duration(1000).style("opacity", 1);

    // Highlighting the Delta Nodes
    svg.selectAll(".delta-circle")
      .data(data)
      .enter().append("circle")
      .attr("class", "delta-circle")
      .attr("cx", (d, i) => rScale(d.actualValue) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr("cy", (d, i) => rScale(d.actualValue) * Math.sin(angleSlice * i - Math.PI / 2))
      .attr("r", 4)
      .style("fill", d => Math.abs(d.actualValue - d.targetValue) > 1.5 ? "#f43f5e" : "#06b6d4")
      .style("stroke", "#0f172a")
      .style("stroke-width", 2)
      .style("opacity", 0)
      .transition()
      .delay(1000)
      .duration(500)
      .style("opacity", 1);

  }, [data, size]);

  return (
    <div className="flex justify-center items-center w-full relative">
      <svg ref={svgRef}></svg>
      {data.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-slate-500 font-mono text-xs">
          Awaiting profile data...
        </div>
      )}
    </div>
  );
};
