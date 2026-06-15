import React from 'react';
import { Sankey, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
  // Nodes: [{ name: 'Lot 101 (Malt)' }, { name: 'Batch 400' }, { name: 'Score: 8.5' }]
  nodes: { name: string }[];
  // Links: [{ source: 0, target: 1, value: 100 }] -> Malt flows to Batch
  links: { source: number; target: number; value: number }[];
}

export const IngredientSankey: React.FC<Props> = ({ nodes, links }) => {
  if (!nodes.length || !links.length) {
    return (
      <div className="w-full h-[400px] bg-slate-950 border border-slate-900 rounded-3xl flex items-center justify-center text-slate-500 font-mono text-sm">
        Awaiting traceability data...
      </div>
    );
  }

  const data = { nodes, links };

  return (
    <div className="w-full bg-slate-950 p-6 rounded-3xl border border-slate-900 shadow-xl">
      <h3 className="text-xl font-extrabold text-slate-100 mb-1">Supply Chain to Hedonic Traceability</h3>
      <p className="text-slate-400 text-xs mb-8">Raw material lots to finished batch sensory performance</p>
      
      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <Sankey
            data={data}
            node={{ stroke: '#0f172a', strokeWidth: 2 }}
            nodePadding={50}
            margin={{ left: 20, right: 20, top: 20, bottom: 20 }}
            link={{ stroke: '#334155' }}
          >
            <Tooltip 
              content={({ payload }) => {
                if (payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-slate-800 text-slate-200 p-3 rounded-lg border border-slate-700 shadow-xl text-sm font-mono tracking-tight">
                      <span className="text-cyan-400">{data.source?.name}</span> → <span className="text-emerald-400">{data.target?.name}</span>
                      <div className="mt-1 text-slate-500 text-xs">Weight: {data.value}</div>
                    </div>
                  );
                }
                return null;
              }} 
            />
          </Sankey>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
