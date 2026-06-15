/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  ChevronRight, 
  ChevronDown, 
  Copy, 
  Check, 
  HelpCircle, 
  Layers, 
  Flame, 
  Sparkles, 
  FlaskConical, 
  Cpu
} from 'lucide-react';
import { FLAVOR_WHEEL_DATA, FlavorWheelNode, SECTOR_COLORS } from '../data/flavorWheelData';

interface FlavorWheelReferenceProps {
  onSelectTerm?: (term: string) => void;
  compact?: boolean;
}

export const FlavorWheelReference: React.FC<FlavorWheelReferenceProps> = ({ 
  onSelectTerm,
  compact = false 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    'Beer': true,
    'Beer > Aroma': true,
    'Beer > Basic Taste': true,
    'Beer > Mouthfeel': true
  });
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const handleToggle = (path: string) => {
    setExpandedNodes(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 1550);
  };

  // Plain catalog flatten recursive tracker to list and search all descriptors
  const allDescriptors = useMemo(() => {
    const list: {
      path: string[];
      name: string;
      terms: string;
      chem: string;
      sources: string;
    }[] = [];

    const recurse = (node: FlavorWheelNode, currentPath: string[]) => {
      const path = [...currentPath, node.name];
      if (!node.children || node.children.length === 0) {
        list.push({
          path,
          name: node.name,
          terms: node.terms || '',
          chem: node.chem || '',
          sources: node.sources || ''
        });
      } else {
        node.children.forEach(c => recurse(c, path));
      }
    };

    if (FLAVOR_WHEEL_DATA.children) {
      FLAVOR_WHEEL_DATA.children.forEach(c => recurse(c, [FLAVOR_WHEEL_DATA.name]));
    }
    return list;
  }, []);

  // Filter descriptors by search query
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return allDescriptors.filter(d => 
      d.name.toLowerCase().includes(q) ||
      d.terms.toLowerCase().includes(q) ||
      d.chem.toLowerCase().includes(q) ||
      d.sources.toLowerCase().includes(q) ||
      d.path.some(p => p.toLowerCase().includes(q))
    );
  }, [allDescriptors, searchQuery]);

  return (
    <div className={`p-6 rounded-3xl border border-slate-900 bg-slate-950 flex flex-col h-full ${
      compact ? 'max-h-[500px]' : 'min-h-[600px]'
    }`} id="asbc_flavor_wheel_card">
      
      {/* Header and description kicker */}
      <div className="mb-5">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-amber-500" />
          <h3 className="text-md font-bold text-slate-100 font-sans">ASBC Beer Flavor Wheel Explorer</h3>
          <span className="text-[9px] font-mono font-bold bg-amber-500/15 text-amber-500 px-2 py-0.5 rounded border border-amber-500/20 uppercase tracking-wider ml-auto">
            Second Edition
          </span>
        </div>
        <p className="text-slate-400 text-xs mt-1.5 leading-relaxed font-sans">
          Click descriptors to inspect chemistry, potential brewing sources, and associated descriptors. Use to write technical tasting comments.
        </p>
      </div>

      {/* Unified Lookup Search Box */}
      <div className="relative mb-5">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <input
          type="text"
          placeholder="Look up chemistry, terms, or sources (e.g., DMS, Diacetyl, Linalool)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-10 py-2.5 bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 outline-none text-xs focus:border-amber-500/50 text-ellipsis transition-all"
        />
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold"
          >
            Clear
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto pr-1 space-y-4 custom-scrollbar max-h-[650px]">
        {searchQuery.trim() !== '' ? (
          /* Search Results output layout */
          <div className="space-y-3">
            <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 border-b border-slate-900 pb-2">
              <span>SEARCH RESULTS</span>
              <span>{searchResults.length} Match(es)</span>
            </div>

            {searchResults.length === 0 ? (
              <div className="text-center py-10 font-mono text-slate-500 text-xs italic">
                No matching ASBC terms or chemical compounds found. Try searching ingredients like 'hops' or 'bacteria'.
              </div>
            ) : (
              <div className="space-y-3">
                {searchResults.map((d, idx) => {
                  const parentBranch = d.path.slice(1, -1).join(' › ');
                  const sectorColor = SECTOR_COLORS[d.path[1]] || SECTOR_COLORS[d.path[2]] || '#475569';

                  return (
                    <div 
                      key={idx} 
                      className="p-4 bg-slate-900/30 rounded-2xl border border-slate-900/60 hover:border-slate-800 transition-all space-y-2.5"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[9px] font-mono text-slate-500 block uppercase font-bold tracking-wider leading-none mb-1">
                            {parentBranch}
                          </span>
                          <h4 className="text-sm font-bold text-slate-100 leading-none">{d.name}</h4>
                        </div>
                        
                        <div className="flex gap-1">
                          {onSelectTerm && (
                            <button
                              onClick={() => onSelectTerm(d.name)}
                              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-[10px] font-bold tracking-tight uppercase"
                            >
                              Apply
                            </button>
                          )}
                          <button
                            onClick={() => handleCopy(`${d.name} (${d.chem ? `Chemistry: ${d.chem}` : `Synonyms: ${d.terms}`})`)}
                            className="p-1 text-slate-400 hover:text-slate-200 border border-slate-800 rounded-lg hover:bg-slate-900"
                            title="Copy details to clipboard"
                          >
                            {copiedText === `${d.name} (${d.chem ? `Chemistry: ${d.chem}` : `Synonyms: ${d.terms}`})` ? (
                              <Check className="h-3 w-3 text-emerald-400" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Details specs */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-2 border-t border-slate-900/60 text-xs leading-normal">
                        {d.terms && (
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-slate-500 font-mono block">Associated Terms</span>
                            <p className="text-slate-300 font-medium">{d.terms}</p>
                          </div>
                        )}
                        {d.chem && (
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-slate-500 font-mono block flex items-center gap-1">
                              <FlaskConical className="h-3 w-3 text-cyan-400" /> Chemistry
                            </span>
                            <p className="text-cyan-400 font-mono font-bold leading-tight">{d.chem}</p>
                          </div>
                        )}
                        {d.sources && (
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-slate-500 font-mono block">Potential Brewing Sources</span>
                            <p className="text-slate-400 text-xs italic">{d.sources}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Tree hierarchy layout structure */
          <div className="space-y-2">
            <div className="text-[10px] font-mono text-slate-500 pb-2 border-b border-slate-900 mb-3 block">
              ASBC DESCRIPTOR TAXONOMY HIERARCHY
            </div>
            
            {FLAVOR_WHEEL_DATA.children?.map((ring1) => {
              const r1Path = `${FLAVOR_WHEEL_DATA.name} > ${ring1.name}`;
              const isR1Expanded = expandedNodes[r1Path];
              const r1Color = SECTOR_COLORS[ring1.name] || '#ffffff';

              return (
                <div key={ring1.name} className="border border-slate-900/50 rounded-2xl bg-slate-950 overflow-hidden shadow-inner">
                  {/* Tier 1 Row (Basic Taste, Mouthfeel, Aroma) */}
                  <button
                    onClick={() => handleToggle(r1Path)}
                    className="w-full px-4 py-3 bg-slate-900/20 hover:bg-slate-900/50 flex items-center gap-2.5 text-left transition-colors font-bold text-xs"
                  >
                    {isR1Expanded ? <ChevronDown className="h-4 w-4 text-slate-500" /> : <ChevronRight className="h-4 w-4 text-slate-500" />}
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: r1Color }}></span>
                    <span className="text-slate-100 font-sans tracking-wide uppercase">{ring1.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono ml-auto">
                      {ring1.children?.length || 0} branches
                    </span>
                  </button>

                  {isR1Expanded && ring1.children && (
                    <div className="p-3 pl-6 bg-slate-905 space-y-2 border-t border-slate-900/80">
                      {ring1.children.map((ring2) => {
                        const r2Path = `${r1Path} > ${ring2.name}`;
                        const isR2Expanded = expandedNodes[r2Path];
                        const r2Color = SECTOR_COLORS[ring2.name] || r1Color;

                        return (
                          <div key={ring2.name} className="border border-slate-900/40 rounded-xl bg-slate-900/10 overflow-hidden">
                            {/* Tier 2 Row (Sour, Fruity, Floral, Earthy, Sulfur Compounds, etc.) */}
                            <button
                              onClick={() => handleToggle(r2Path)}
                              className="w-full px-3.5 py-2 hover:bg-slate-900/60 flex items-center gap-2 text-left transition-colors text-slate-200 text-xs font-semibold"
                            >
                              {isR2Expanded ? <ChevronDown className="h-3.5 w-3.5 text-slate-500" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-500" />}
                              <span className="w-1.5 h-1.5 rounded-sm" style={{ backgroundColor: r2Color }}></span>
                              <span className="font-sans text-slate-200">{ring2.name}</span>
                              <span className="text-[9px] text-slate-500 font-mono ml-auto bg-slate-900 px-1.5 py-0.5 rounded-full">
                                {ring2.children ? ring2.children.length : 0} items
                              </span>
                            </button>

                            {isR2Expanded && ring2.children && (
                              <div className="p-2.5 pl-4 space-y-1.5 divide-y divide-slate-900/40 border-t border-slate-900/50 bg-slate-950/40">
                                {ring2.children.map((ring3) => {
                                  // Check if this is a leafy structure (depth-3 leaf) or has a depth-4 sub-family
                                  const r3Path = `${r2Path} > ${ring3.name}`;
                                  const isR3Expanded = expandedNodes[r3Path];
                                  const hasSubItems = ring3.children && ring3.children.length > 0;

                                  if (hasSubItems) {
                                    return (
                                      <div key={ring3.name} className="pt-2 bg-slate-900/5 rounded-lg overflow-hidden space-y-1">
                                        {/* Tier 3 Row (Citrus, Tropical, Grassy, Bready, Cereal) */}
                                        <button
                                          onClick={() => handleToggle(r3Path)}
                                          className="w-full px-2 py-1.5 hover:bg-slate-900/30 flex items-center gap-1.5 text-left transition-colors text-[11px] font-bold text-slate-350 text-slate-300"
                                        >
                                          {isR3Expanded ? <ChevronDown className="h-3 w-3 text-slate-500" /> : <ChevronRight className="h-3 w-3 text-slate-500" />}
                                          <span className="font-sans italic">{ring3.name} Sub-group</span>
                                        </button>

                                        {isR3Expanded && ring3.children && (
                                          <div className="pl-3 py-1 space-y-1.5">
                                            {ring3.children.map((ring4) => (
                                              <div 
                                                key={ring4.name}
                                                className="p-3 bg-slate-900/50 hover:bg-slate-900/80 rounded-xl border border-slate-900 flex flex-col md:flex-row justify-between gap-3 text-xs"
                                              >
                                                <div className="space-y-1 flex-1">
                                                  <div className="flex justify-between items-center">
                                                    <span className="font-bold text-slate-200">{ring4.name}</span>
                                                    {ring4.chem && (
                                                      <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/20 px-1.5 py-0.5 rounded border border-cyan-950/40 font-bold flex items-center gap-1">
                                                        <FlaskConical className="h-3 w-3" /> {ring4.chem}
                                                      </span>
                                                    )}
                                                  </div>
                                                  <p className="text-slate-300 text-[11px] leading-relaxed"><span className="text-slate-500 font-mono text-[10px]">ASSOCIATED:</span> {ring4.terms || '—'}</p>
                                                  {ring4.sources && <p className="text-slate-400 text-[11px] italic leading-normal"><span className="text-slate-600 font-sans font-bold text-[9px] not-italic mr-0.5">SOURCE:</span> {ring4.sources}</p>}
                                                </div>
                                                <div className="flex md:flex-col justify-end gap-1.5 md:justify-start shrink-0">
                                                  {onSelectTerm && (
                                                    <button
                                                      onClick={() => onSelectTerm(ring4.name)}
                                                      className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-[10px] font-bold tracking-tight uppercase"
                                                    >
                                                      Apply descriptor
                                                    </button>
                                                  )}
                                                  <button
                                                    onClick={() => handleCopy(`${ring4.name} (Chemistry: ${ring4.chem || 'N/A'}, Terms: ${ring4.terms || 'N/A'})`)}
                                                    className="p-1 px-2.5 text-slate-400 hover:text-slate-200 border border-slate-800 rounded-lg bg-slate-950 text-[10px] font-mono flex items-center gap-1 justify-center"
                                                  >
                                                    {copiedText === `${ring4.name} (Chemistry: ${ring4.chem || 'N/A'}, Terms: ${ring4.terms || 'N/A'})` ? (
                                                      <>Copied <Check className="h-3 w-3 text-emerald-400" /></>
                                                    ) : (
                                                      <>Copy <Copy className="h-3 w-3" /></>
                                                    )}
                                                  </button>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  } else {
                                    // Depth 3 Leaf: Render descriptor immediately
                                    return (
                                      <div 
                                        key={ring3.name}
                                        className="p-3 bg-slate-900/40 hover:bg-slate-904 hover:bg-slate-900/60 rounded-xl border border-slate-900/50 flex flex-col md:flex-row justify-between gap-3 text-xs pt-3"
                                      >
                                        <div className="space-y-1 flex-1">
                                          <div className="flex justify-between items-center">
                                            <span className="font-bold text-slate-200">{ring3.name}</span>
                                            {ring3.chem && (
                                              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/20 px-1.5 py-0.5 rounded border border-cyan-950/40 font-bold flex items-center gap-1">
                                                <FlaskConical className="h-3 w-3" /> {ring3.chem}
                                              </span>
                                            )}
                                          </div>
                                          <p className="text-slate-300 text-[11px] leading-relaxed"><span className="text-slate-500 font-mono text-[10px]">ASSOCIATED:</span> {ring3.terms || '—'}</p>
                                          {ring3.sources && <p className="text-slate-400 text-[11px] italic leading-normal"><span className="text-slate-500 font-sans font-bold text-[9px] not-italic mr-0.5">SOURCE:</span> {ring3.sources}</p>}
                                        </div>
                                        <div className="flex md:flex-col justify-end gap-1.5 md:justify-start shrink-0">
                                          {onSelectTerm && (
                                            <button
                                              onClick={() => onSelectTerm(ring3.name)}
                                              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-[10px] font-bold tracking-tight uppercase"
                                            >
                                              Apply descriptor
                                            </button>
                                          )}
                                          <button
                                            onClick={() => handleCopy(`${ring3.name} (Chemistry: ${ring3.chem || 'N/A'}, Terms: ${ring3.terms || 'N/A'})`)}
                                            className="p-1 px-2.5 text-slate-400 hover:text-slate-200 border border-slate-800 rounded-lg bg-slate-950 text-[10px] font-mono flex items-center gap-1 justify-center"
                                          >
                                            {copiedText === `${ring3.name} (Chemistry: ${ring3.chem || 'N/A'}, Terms: ${ring3.terms || 'N/A'})` ? (
                                              <>Copied <Check className="h-3 w-3 text-emerald-400" /></>
                                            ) : (
                                              <>Copy <Copy className="h-3 w-3" /></>
                                            )}
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  }
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
