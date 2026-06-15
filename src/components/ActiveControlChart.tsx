import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface DataPoint {
  date: string;
  avg: number;
  batchCode: string;
  percentDefect: number;
}

interface Props {
  data: DataPoint[];
  ucl: number;
  lcl: number;
  mean: number;
}

export const ActiveControlChart: React.FC<Props> = ({ data, ucl, lcl, mean }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;
    
    const margin = { top: 20, right: 30, bottom: 30, left: 40 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Clear previous renders
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scalePoint().domain(data.map(d => d.date)).range([0, width]);
    const y = d3.scaleLinear().domain([0, 10]).range([height, 0]);

    // Axes
    svg.append("g")
       .attr("transform", `translate(0,${height})`)
       .call(d3.axisBottom(x))
       .attr("color", "#475569")
       .attr("font-family", "monospace");
       
    svg.append("g")
       .call(d3.axisLeft(y))
       .attr("color", "#475569")
       .attr("font-family", "monospace");

    // Control Lines
    const drawLine = (val: number, color: string, label: string) => {
      svg.append("line")
         .attr("x1", 0)
         .attr("x2", width)
         .attr("y1", y(val))
         .attr("y2", y(val))
         .attr("stroke", color)
         .attr("stroke-dasharray", "4")
         .attr("stroke-width", 2);
         
      svg.append("text")
         .attr("x", width - 30)
         .attr("y", y(val) - 5)
         .text(label)
         .style("fill", color)
         .style("font-size", "10px")
         .style("font-family", "monospace")
         .style("font-weight", "bold");
    };

    drawLine(ucl, "#10b981", "UCL"); // emerald-500
    drawLine(mean, "#3b82f6", "MEAN"); // blue-500
    drawLine(lcl, "#f43f5e", "LCL"); // rose-500

    // Line Path
    const line = d3.line<DataPoint>().x(d => x(d.date)!).y(d => y(d.avg));
    svg.append("path")
       .datum(data)
       .attr("fill", "none")
       .attr("stroke", "#0ea5e9") // sky-500
       .attr("stroke-width", 2)
       .attr("d", line);

    // Nodes & Tooltips
    const tooltip = d3.select("body").append("div")
      .attr("class", "tooltip bg-slate-800 text-slate-100 p-2 rounded border border-slate-700 shadow-xl font-mono text-xs absolute pointer-events-none")
      .style("opacity", 0);

    svg.selectAll("circle")
       .data(data)
       .enter()
       .append("circle")
       .attr("cx", d => x(d.date)!)
       .attr("cy", d => y(d.avg))
       .attr("r", 5)
       .attr("fill", d => d.avg < lcl ? "#f43f5e" : "#0ea5e9")
       .attr("stroke", "#0f172a")
       .attr("stroke-width", 2)
       .on("mouseover", (event, d) => {
          tooltip.transition().duration(200).style("opacity", 1);
          tooltip.html(`Batch: <span class="text-cyan-400">${d.batchCode}</span><br/>Score: ${d.avg}<br/>Defect: ${d.percentDefect}%`)
                 .style("left", (event.pageX + 10) + "px")
                 .style("top", (event.pageY - 30) + "px");
       })
       .on("mouseout", () => tooltip.transition().duration(500).style("opacity", 0));

    return () => { tooltip.remove(); };
  }, [data, ucl, lcl, mean]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 overflow-x-auto custom-scrollbar w-full relative">
      <h3 className="text-sm font-bold text-slate-100 mb-4 font-mono uppercase tracking-widest text-center">Hedonic Process Control</h3>
      <div className="flex justify-center w-full">
        <svg ref={svgRef}></svg>
      </div>
    </div>
  );
};
