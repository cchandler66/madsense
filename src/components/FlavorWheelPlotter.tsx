import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface RadarData {
  axis: string;
  value: number; // 0 to 1 scale based on frequency in evaluations
}

interface Props {
  targetProfile: RadarData[];
  batchProfile: RadarData[];
}

export const FlavorWheelPlotter: React.FC<Props> = ({ targetProfile, batchProfile }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !targetProfile.length) return;

    const width = 400;
    const height = 400;
    const margin = 40;
    const radius = Math.min(width, height) / 2 - margin;
    
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width/2},${height/2})`);

    const rScale = d3.scaleLinear().range([0, radius]).domain([0, 1]);
    const angleSlice = (Math.PI * 2) / targetProfile.length;

    // Background webbing
    const ticks = [0.2, 0.4, 0.6, 0.8, 1];
    ticks.forEach(t => {
      svg.append("circle")
         .attr("r", rScale(t))
         .style("fill", "none")
         .style("stroke", "rgba(255,255,255,0.05)")
         .style("stroke-dasharray", "4,4");
    });
    
    targetProfile.forEach((_, i) => {
      svg.append("line")
         .attr("x1", 0)
         .attr("y1", 0)
         .attr("x2", rScale(1) * Math.cos(angleSlice * i - Math.PI / 2))
         .attr("y2", rScale(1) * Math.sin(angleSlice * i - Math.PI / 2))
         .style("stroke", "rgba(255,255,255,0.05)")
         .style("stroke-width", "1px");
    });

    // Draw Radar Generator
    const radarLine = d3.lineRadial<RadarData>()
      .angle((d, i) => i * angleSlice)
      .radius(d => rScale(d.value))
      .curve(d3.curveLinearClosed);

    // Render Target Baseline (Muted)
    svg.append("path")
      .datum(targetProfile)
      .attr("d", radarLine)
      .style("fill", "rgba(148, 163, 184, 0.1)") // slate-400
      .style("fill-opacity", 0.3)
      .style("stroke", "#64748b") // slate-500
      .style("stroke-width", 1.5)
      .style("stroke-dasharray", "4,4");

    // Render Batch Foreground (Sharp Animated)
    const batchPath = svg.append("path")
      .datum(batchProfile)
      .attr("d", radarLine)
      .style("fill", "rgba(244, 63, 94, 0.2)") // rose-500
      .style("stroke", "#f43f5e") // rose-500
      .style("stroke-width", 2.5)
      .style("opacity", 0);
      
    batchPath.transition().duration(800).style("opacity", 1);

    // Add overlay nodes for the batch
    svg.selectAll(".batch-node")
       .data(batchProfile)
       .enter()
       .append("circle")
       .attr("class", "batch-node")
       .attr("cx", (d, i) => rScale(d.value) * Math.cos(angleSlice * i - Math.PI / 2))
       .attr("cy", (d, i) => rScale(d.value) * Math.sin(angleSlice * i - Math.PI / 2))
       .attr("r", 4)
       .style("fill", "#f43f5e")
       .style("stroke", "#020617")
       .style("stroke-width", 2)
       .style("opacity", 0)
       .transition()
       .delay(600)
       .duration(400)
       .style("opacity", 1);

    // Add Axes Labels
    targetProfile.forEach((d, i) => {
      svg.append("text")
        .attr("x", rScale(1.2) * Math.cos(angleSlice * i - Math.PI / 2))
        .attr("y", rScale(1.2) * Math.sin(angleSlice * i - Math.PI / 2))
        .text(d.axis)
        .style("text-anchor", "middle")
        .style("dominant-baseline", "middle")
        .style("font-size", "10px")
        .style("fill", "#94a3b8")
        .style("font-family", "monospace")
        .style("text-transform", "uppercase");
    });

  }, [targetProfile, batchProfile]);

  return (
    <div className="flex flex-col items-center">
      <div className="flex w-full justify-between items-center px-4 py-2 border-b border-slate-800/50">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-slate-500 border border-slate-400"></div>
          <span className="text-xs text-slate-400 font-mono">Target Baseline</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-rose-500 border border-rose-400"></div>
          <span className="text-xs text-slate-400 font-mono">Current Batch</span>
        </div>
      </div>
      <div className="relative pt-6">
        <svg ref={svgRef}></svg>
      </div>
    </div>
  );
};
