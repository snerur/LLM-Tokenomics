import React, { useState } from 'react';
import { LLMModel, WorkloadProfile, HardwareProfile } from '../types/tokenomics';
import { HARDWARE_BENCHMARKS } from '../data/governanceAndRisks';
import { calculateSelfHostedBreakeven } from '../utils/calculator';
import { Cpu, Server, AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';

interface SelfHostedTCOProps {
  workload: WorkloadProfile;
  primaryModel: LLMModel;
}

export const SelfHostedTCO: React.FC<SelfHostedTCOProps> = ({
  workload,
  primaryModel,
}) => {
  const [selectedHardware, setSelectedHardware] = useState<HardwareProfile>(HARDWARE_BENCHMARKS[0]);
  const [nodeCount, setNodeCount] = useState<number>(2);
  const [utilizationPercent, setUtilizationPercent] = useState<number>(65);

  const breakeven = calculateSelfHostedBreakeven(
    selectedHardware,
    workload,
    primaryModel,
    nodeCount,
    utilizationPercent
  );

  const formatUSD = (val: number): string => {
    if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
    if (val >= 10_000) return `$${Math.round(val).toLocaleString()}`;
    return `$${val.toFixed(0)}`;
  };

  const formatNumber = (num: number): string => {
    if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(0)}k`;
    return num.toLocaleString();
  };

  // Generate data points for the SVG breakeven curve chart
  // Points from 10k queries to 1M queries
  const queryPoints = [10000, 50000, 100000, 250000, 500000, 750000, 1000000];
  const avgTokensPerQuery = workload.avgInputTokens + workload.avgOutputTokens;
  const blendedPricePerMillion = primaryModel.inputPricePerMillion * 0.75 + primaryModel.outputPricePerMillion * 0.25;

  const chartPoints = queryPoints.map((q) => {
    const monthlyTokens = q * avgTokensPerQuery * 30.416;
    const apiCost = (monthlyTokens / 1_000_000) * blendedPricePerMillion;
    const dedicatedCost = breakeven.monthlyDedicatedCostUSD;
    return {
      queries: q,
      apiCost,
      dedicatedCost,
    };
  });

  const maxCost = Math.max(...chartPoints.map((p) => Math.max(p.apiCost, p.dedicatedCost))) * 1.15;
  const chartHeight = 200;
  const chartWidth = 580;

  // Generate SVG path for API line
  const apiPath = chartPoints
    .map((p, idx) => {
      const x = (idx / (chartPoints.length - 1)) * (chartWidth - 60) + 40;
      const y = chartHeight - (p.apiCost / maxCost) * (chartHeight - 40) - 20;
      return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  // Generate SVG path for Dedicated GPU line (flat line since it's fixed hardware cost)
  const dedicatedY = chartHeight - (breakeven.monthlyDedicatedCostUSD / maxCost) * (chartHeight - 40) - 20;
  const dedicatedPath = `M 40 ${dedicatedY} L ${chartWidth - 20} ${dedicatedY}`;

  return (
    <div className="space-y-8">
      {/* Editorial Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-cyan-400 font-mono">
          <span>Infrastructure Economics</span>
          <span aria-hidden="true">·</span>
          <span>Hardware TCO</span>
          <span aria-hidden="true">·</span>
          <span>Breakeven Thresholds</span>
        </div>
        <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-white">
          SaaS Token API vs. Self-Hosted Dedicated GPU TCO
        </h1>
        <p className="mt-2 text-sm text-slate-400 max-w-3xl">
          Evaluate the total cost of ownership (TCO) between serverless pay-per-token APIs and self-hosted open-weight clusters (vLLM / TensorRT-LLM on dedicated H100 / L40S nodes).
        </p>
      </div>

      {/* Strategic Recommendation Banner */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-950 border border-cyan-800/80 text-cyan-400">
              <Server className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Breakeven Verdict for Current Workload
              </span>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>Recommended Path:</span>
                <span className="text-cyan-400 font-mono">{breakeven.recommendedDeployment}</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="bg-slate-950 px-3 py-2 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Crossover Volume</span>
              <span className="text-white font-semibold">
                {formatNumber(breakeven.crossoverDailyQueries)} Q/day
              </span>
            </div>
            <div className="bg-slate-950 px-3 py-2 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Crossover Tokens</span>
              <span className="text-cyan-400 font-semibold">
                {breakeven.crossoverDailyTokensMillion.toFixed(1)}M tokens/day
              </span>
            </div>
          </div>
        </div>

        <p className="mt-4 text-xs text-slate-300 leading-relaxed max-w-4xl">
          {breakeven.summaryRationale}
        </p>
      </div>

      {/* Hardware Configuration & Cost Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Hardware Cluster Configuration (5 cols) */}
        <div className="lg:col-span-5 space-y-5 rounded-xl border border-slate-800 bg-slate-900/50 p-5">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
              Cluster Sizing &amp; Parameters
            </h3>
            <span className="text-xs text-slate-500 font-mono">vLLM Node Fleet</span>
          </div>

          {/* Hardware Profile Selector */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-300 block">
              GPU Node Instance Profile
            </label>
            <div className="space-y-2">
              {HARDWARE_BENCHMARKS.map((hw) => {
                const isSelected = selectedHardware.gpuType === hw.gpuType;
                return (
                  <button
                    key={hw.gpuType}
                    onClick={() => setSelectedHardware(hw)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'border-cyan-500/80 bg-cyan-950/30 text-white shadow-sm'
                        : 'border-slate-800 bg-slate-900/40 text-slate-300 hover:border-slate-700 hover:bg-slate-800/50'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-semibold">{hw.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {hw.throughputTokensPerSecTotal} tok/sec throughput · {hw.fpPrecision}
                      </div>
                    </div>
                    <div className="text-right font-mono tabular-nums text-xs">
                      <span className="text-cyan-400 font-semibold">${hw.hourlyCostUSD.toFixed(2)}</span>
                      <span className="text-slate-500 text-[10px] block">/ node hour</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Node Count Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="cluster-node-count-input" className="font-medium text-slate-300">Cluster Node Count</label>
              <span className="font-mono text-cyan-400 tabular-nums font-semibold">
                {nodeCount} {nodeCount === 1 ? 'node' : 'nodes'} ({nodeCount * selectedHardware.gpusPerNode} total GPUs)
              </span>
            </div>
            <input
              id="cluster-node-count-input"
              aria-label="Cluster Node Count"
              type="range"
              min={1}
              max={16}
              step={1}
              value={nodeCount}
              onChange={(e) => setNodeCount(Number(e.target.value))}
              className="w-full accent-cyan-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>1 Node (Min HA)</span>
              <span>4 Nodes</span>
              <span>8 Nodes</span>
              <span>16 Nodes</span>
            </div>
          </div>

          {/* Average Utilization Factor */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="avg-cluster-utilization-input" className="font-medium text-slate-300">Average Cluster Utilization Rate</label>
              <span className="font-mono text-cyan-400 tabular-nums font-semibold">
                {utilizationPercent}%
              </span>
            </div>
            <input
              id="avg-cluster-utilization-input"
              aria-label="Average Cluster Utilization Rate"
              type="range"
              min={25}
              max={95}
              step={5}
              value={utilizationPercent}
              onChange={(e) => setUtilizationPercent(Number(e.target.value))}
              className="w-full accent-cyan-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
            />
            <p className="text-[11px] text-slate-400">
              Real enterprise workloads average 50%–70% utilization due to night-time dips, traffic spikes, and memory headroom.
            </p>
          </div>

          {/* Dedicated Cost Line Items */}
          <div className="pt-3 border-t border-slate-800 text-xs font-mono space-y-1.5">
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Hardware Compute (730 hrs):</span>
              <span>{formatUSD(selectedHardware.hourlyCostUSD * 730 * nodeCount)}/mo</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Power &amp; Network Overhead ({selectedHardware.powerAndCoolingOverheadPercent}%):</span>
              <span>{formatUSD(selectedHardware.hourlyCostUSD * (selectedHardware.powerAndCoolingOverheadPercent / 100) * 730 * nodeCount)}/mo</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">MLOps / SRE Staffing Fraction:</span>
              <span>{formatUSD(selectedHardware.mlopsStaffCostPerMonthUSD)}/mo</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-800 text-white font-semibold">
              <span>Total Dedicated TCO:</span>
              <span className="text-cyan-400">{formatUSD(breakeven.monthlyDedicatedCostUSD)} / month</span>
            </div>
          </div>
        </div>

        {/* Right: Interactive SVG Breakeven Curve & Insights (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Visual SVG Chart */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="flex items-center justify-between text-xs mb-3 border-b border-slate-800/80 pb-2">
              <span className="font-semibold text-slate-300 uppercase tracking-wider">
                Monthly Cost Crossover Curve ($ / Month)
              </span>
              <div className="flex items-center gap-4 text-[11px] font-mono">
                <span className="flex items-center gap-1.5 text-cyan-400">
                  <span className="h-2 w-2 rounded-full bg-cyan-400" />
                  SaaS API ({primaryModel.name})
                </span>
                <span className="flex items-center gap-1.5 text-amber-400">
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  Dedicated GPU ({selectedHardware.name})
                </span>
              </div>
            </div>

            {/* SVG Visual */}
            <div className="relative w-full overflow-hidden">
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-48 select-none">
                {/* Grid horizontal lines */}
                {[0.25, 0.5, 0.75, 1.0].map((frac) => {
                  const y = chartHeight - frac * (chartHeight - 40) - 20;
                  return (
                    <g key={frac}>
                      <line x1="40" y1={y} x2={chartWidth - 20} y2={y} stroke="#334155" strokeDasharray="3 3" strokeWidth="0.5" />
                      <text x="35" y={y + 3} textAnchor="end" fill="#64748b" fontSize="9" fontFamily="monospace">
                        {formatUSD(maxCost * frac)}
                      </text>
                    </g>
                  );
                })}

                {/* Dedicated Flat Line */}
                <path d={dedicatedPath} fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="4 2" />

                {/* API Scalable Line */}
                <path d={apiPath} fill="none" stroke="#22d3ee" strokeWidth="2.5" />

                {/* Query points dots */}
                {chartPoints.map((p, idx) => {
                  const x = (idx / (chartPoints.length - 1)) * (chartWidth - 60) + 40;
                  const y = chartHeight - (p.apiCost / maxCost) * (chartHeight - 40) - 20;
                  return (
                    <circle key={p.queries} cx={x} cy={y} r="3.5" fill="#22d3ee" />
                  );
                })}
              </svg>
            </div>

            <div className="flex justify-between text-[10px] text-slate-400 font-mono px-4 pt-1">
              <span>10k Q/day</span>
              <span>100k Q/day</span>
              <span>500k Q/day</span>
              <span>1M Q/day</span>
            </div>
          </div>

          {/* Critical TCO Reality Checks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
                <AlertTriangle className="h-4 w-4" />
                <span>Hidden Costs of Self-Hosting</span>
              </div>
              <ul className="mt-2 text-[11px] text-slate-400 space-y-1.5 list-disc list-inside">
                <li><strong>Idle Capacity Tax:</strong> GPUs run 24/7 even during off-peak hours and weekends.</li>
                <li><strong>KV-Cache Memory Bloat:</strong> Multi-turn sessions exhaust GPU VRAM quickly, causing batch eviction.</li>
                <li><strong>SRE Engineering Overhead:</strong> Requires specialized engineers to manage CUDA updates, drivers, and vLLM restarts.</li>
              </ul>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                <ShieldCheck className="h-4 w-4" />
                <span>When Self-Hosting Wins</span>
              </div>
              <ul className="mt-2 text-[11px] text-slate-400 space-y-1.5 list-disc list-inside">
                <li><strong>Predictable 24/7 Load:</strong> High continuous baseline traffic (&gt; 50M tokens/day).</li>
                <li><strong>Strict Data Locality:</strong> Air-gapped on-prem or regulated sovereign VPC constraints.</li>
                <li><strong>Fine-Tuned Small Models:</strong> Running quantized Llama 8B or 70B with ultra-high concurrency.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
