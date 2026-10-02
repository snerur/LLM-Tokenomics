import React, { useState } from 'react';
import { CalculationResult } from '../utils/calculator';
import { OptimizationLevers, WorkloadProfile, LLMModel, DepartmentBudget } from '../types/tokenomics';
import {
  TrendingDown,
  DollarSign,
  Calendar,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Percent,
} from 'lucide-react';

interface ROIProjectionProps {
  calcResult: CalculationResult;
  optimizationLevers?: OptimizationLevers;
  workload?: WorkloadProfile;
  primaryModel?: LLMModel;
  departments?: DepartmentBudget[];
}

export const ROIProjection: React.FC<ROIProjectionProps> = ({
  calcResult,
  optimizationLevers,
  departments,
}) => {
  const [horizonYears, setHorizonYears] = useState<number>(1);
  const [annualVolumeGrowthPercent, setAnnualVolumeGrowthPercent] = useState<number>(50);
  const [implementationCostUSD, setImplementationCostUSD] = useState<number>(18000);

  const formatUSD = (val: number): string => {
    if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
    if (val >= 10_000) return `$${Math.round(val).toLocaleString()}`;
    return `$${val.toFixed(0)}`;
  };

  // 1-Year Baseline & Optimized
  const annualBaseline = calcResult.baselineAnnualCost;
  const annualOptimized = calcResult.optimizedAnnualCost;
  const annualSavings = calcResult.annualSavingsUSD;

  // Multi-year compound calculations (factoring in annual workload growth and ~30% token market deflation)
  const multiYearProjections = [];
  let cumBaseline = 0;
  let cumOptimized = 0;

  for (let year = 1; year <= 3; year++) {
    const growthMultiplier = Math.pow(1 + annualVolumeGrowthPercent / 100, year - 1);
    // Market deflation assumption: -25% price drop each year for underlying tokens
    const deflationMultiplier = Math.pow(0.75, year - 1);
    const yearBaseline = annualBaseline * growthMultiplier * deflationMultiplier;
    const yearOptimized = annualOptimized * growthMultiplier * deflationMultiplier;
    const yearSavings = yearBaseline - yearOptimized;

    cumBaseline += yearBaseline;
    cumOptimized += yearOptimized;

    multiYearProjections.push({
      year,
      yearBaseline,
      yearOptimized,
      yearSavings,
      cumBaseline,
      cumOptimized,
      cumSavings: cumBaseline - cumOptimized,
    });
  }

  const selectedProjection = multiYearProjections[horizonYears - 1];

  // Payback & Net ROI calculations
  const dailySavings = calcResult.monthlySavingsUSD / 30.416;
  const paybackDays = dailySavings > 0 ? Math.max(1, Math.round(implementationCostUSD / dailySavings)) : 999;
  const netAnnualProfit = Math.max(0, annualSavings - implementationCostUSD);
  const roiMultiple = implementationCostUSD > 0 ? (annualSavings / implementationCostUSD) : 0;

  // Breakdown of active strategy contributions (annualized)
  const strategyContributions = [
    {
      name: 'KV Prompt Caching',
      enabled: optimizationLevers?.enablePromptCaching ?? true,
      annualSavings: calcResult.savingsPromptCaching * 12,
      detail: `${optimizationLevers?.cacheHitRatio ?? 70}% hit rate on static prefixes`,
      color: 'bg-cyan-500',
      textColor: 'text-cyan-400',
    },
    {
      name: '2-Tier Cascaded Routing',
      enabled: optimizationLevers?.enableCascading ?? true,
      annualSavings: calcResult.savingsCascading * 12,
      detail: `${optimizationLevers?.cascadeTriageShare ?? 65}% routed to lightweight triage model`,
      color: 'bg-indigo-500',
      textColor: 'text-indigo-400',
    },
    {
      name: 'Semantic Vector Caching',
      enabled: optimizationLevers?.enableSemanticCache ?? true,
      annualSavings: calcResult.savingsSemanticCache * 12,
      detail: `${optimizationLevers?.semanticCacheHitRate ?? 15}% queries intercepted at $0.00 token cost`,
      color: 'bg-emerald-500',
      textColor: 'text-emerald-400',
    },
    {
      name: 'Batch API Offloading',
      enabled: optimizationLevers?.enableBatchProcessing ?? false,
      annualSavings: calcResult.savingsBatch * 12,
      detail: `${optimizationLevers?.batchShare ?? 25}% eligible volume at 50% discount`,
      color: 'bg-amber-500',
      textColor: 'text-amber-400',
    },
    {
      name: 'Strict Output Schema Pruning',
      enabled: optimizationLevers?.enableOutputPruning ?? true,
      annualSavings: calcResult.savingsOutputPruning * 12,
      detail: `${optimizationLevers?.outputPruningReduction ?? 25}% reduction in generated output tokens`,
      color: 'bg-rose-500',
      textColor: 'text-rose-400',
    },
  ];

  const totalAttributedAnnualSavings = strategyContributions.reduce(
    (acc, curr) => acc + (curr.enabled ? curr.annualSavings : 0),
    0
  );

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6 space-y-6">
      {/* Top Section: Header & Horizon Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
            <TrendingDown className="h-4 w-4" />
            <span>ROI &amp; Capital Efficiency Projection</span>
          </div>
          <h2 className="text-lg font-bold text-white mt-1">
            Annual Inference Cost Savings vs. Baseline Run-Rate
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Quantifies the financial return of your configured optimization levers over time.
          </p>
        </div>

        {/* Time Horizon Segmented Buttons */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono hidden md:inline">Horizon:</span>
          <div className="flex items-center gap-1 rounded-lg bg-slate-950 p-1 border border-slate-800">
            {[1, 2, 3].map((yr) => (
              <button
                key={yr}
                onClick={() => setHorizonYears(yr)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  horizonYears === yr
                    ? 'bg-slate-800 text-emerald-400 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {yr} {yr === 1 ? 'Year' : 'Years'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Primary KPI Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Baseline Spend */}
        <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-1">
            {horizonYears}-Year Baseline Cost
          </span>
          <span className="text-2xl font-bold font-mono text-slate-300 tabular-nums line-through decoration-rose-500/70 block">
            {formatUSD(selectedProjection.cumBaseline)}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block font-mono">
            Unoptimized raw frontier API calls
          </span>
        </div>

        {/* Optimized Spend */}
        <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-1">
            {horizonYears}-Year Optimized Spend
          </span>
          <span className="text-2xl font-bold font-mono text-cyan-400 tabular-nums block">
            {formatUSD(selectedProjection.cumOptimized)}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block font-mono">
            With active caching &amp; routing
          </span>
        </div>

        {/* Projected Net Savings */}
        <div className="rounded-lg border border-emerald-900/60 bg-emerald-950/20 p-4">
          <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-400 block mb-1">
            Projected Capital Saved
          </span>
          <span className="text-2xl font-bold font-mono text-emerald-400 tabular-nums block">
            {formatUSD(selectedProjection.cumSavings)}
          </span>
          <span className="text-[11px] text-emerald-300 font-semibold mt-1 block">
            {calcResult.savingsPercentage.toFixed(1)}% reduction in annual bill
          </span>
        </div>

        {/* Payback Period & Multiplier */}
        <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
          <span className="text-[10px] uppercase font-mono tracking-wider text-amber-400 block mb-1">
            FinOps Payback Period
          </span>
          <span className="text-2xl font-bold font-mono text-amber-300 tabular-nums block">
            {paybackDays} {paybackDays === 1 ? 'day' : 'days'}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block font-mono">
            Net ROI: <strong className="text-white font-semibold">{roiMultiple.toFixed(1)}x</strong> on engineering setup
          </span>
        </div>
      </div>

      {/* 2-Column: Left Strategy Contribution Breakdown, Right Investment Payback Model */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Strategy Contribution Waterfall (7 cols) */}
        <div className="lg:col-span-7 space-y-4 rounded-lg border border-slate-800 bg-slate-950/40 p-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-cyan-400" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Annual Savings Contribution by Optimization Lever
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Total: <strong className="text-white">{formatUSD(annualSavings)}/yr</strong>
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {strategyContributions.map((strat) => {
              const shareOfSavings =
                totalAttributedAnnualSavings > 0
                  ? (strat.annualSavings / totalAttributedAnnualSavings) * 100
                  : 0;

              return (
                <div key={strat.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${strat.enabled ? strat.color : 'bg-slate-700'}`} />
                      <span className={strat.enabled ? 'font-medium text-slate-200' : 'text-slate-500 line-through'}>
                        {strat.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 font-mono tabular-nums">
                      <span className="text-[11px] text-slate-400 hidden sm:inline">
                        {strat.detail}
                      </span>
                      <span className={`font-semibold ${strat.enabled ? strat.textColor : 'text-slate-600'}`}>
                        {strat.enabled ? formatUSD(strat.annualSavings) : '$0'} / yr
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1.5 w-full rounded-full bg-slate-800/80 overflow-hidden">
                    <div
                      style={{ width: `${strat.enabled ? Math.min(100, Math.max(2, shareOfSavings)) : 0}%` }}
                      className={`h-full rounded-full transition-all ${strat.color}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-800/80 leading-relaxed">
            Note: Prompt caching and cascaded triage yield the largest recurring savings multiplier on large input context payloads, while semantic caching eliminates recurring query overhead entirely.
          </p>
        </div>

        {/* Right: Engineering Setup & Payback Modeler (5 cols) */}
        <div className="lg:col-span-5 space-y-4 rounded-lg border border-slate-800 bg-slate-950/40 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-400" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  FinOps Setup &amp; Net ROI
                </h3>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">1-Time CapEx</span>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <label htmlFor="finops-setup-cost-input" className="text-slate-400">Estimated Gateway / FinOps Implementation Cost</label>
                  <span className="font-mono text-cyan-400 font-semibold">{formatUSD(implementationCostUSD)}</span>
                </div>
                <input
                  id="finops-setup-cost-input"
                  aria-label="Estimated Gateway FinOps Implementation Cost"
                  type="range"
                  min={5000}
                  max={60000}
                  step={1000}
                  value={implementationCostUSD}
                  onChange={(e) => setImplementationCostUSD(Number(e.target.value))}
                  className="w-full accent-cyan-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                />
                <span className="text-[10px] text-slate-400 block font-mono mt-0.5">
                  Covers ~2-3 engineer-weeks for gateway proxy integration, KV-cache prefixing, and alerting.
                </span>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <label htmlFor="annual-workload-growth-input" className="text-slate-400">Annual Workload Growth Rate</label>
                  <span className="font-mono text-cyan-400 font-semibold">+{annualVolumeGrowthPercent}% / yr</span>
                </div>
                <input
                  id="annual-workload-growth-input"
                  aria-label="Annual Workload Growth Rate"
                  type="range"
                  min={10}
                  max={200}
                  step={10}
                  value={annualVolumeGrowthPercent}
                  onChange={(e) => setAnnualVolumeGrowthPercent(Number(e.target.value))}
                  className="w-full accent-cyan-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Payback Result Box */}
          <div className="rounded-lg bg-slate-900 border border-slate-800 p-3.5 space-y-2 font-mono text-xs">
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Net 1-Year Profit:</span>
              <span className="text-emerald-400 font-semibold">{formatUSD(netAnnualProfit)}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Payback Breakeven:</span>
              <span className="text-amber-300 font-semibold">{paybackDays} Calendar Days</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Return on Investment:</span>
              <span className="text-cyan-400 font-semibold">{roiMultiple.toFixed(1)}x capital return</span>
            </div>
          </div>
        </div>
      </div>

      {/* Departmental Annual Reinvestment Impact */}
      {departments && departments.length > 0 && (
        <div className="pt-2">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold text-slate-300 uppercase tracking-wider">
              Departmental Annual Capital Recovery
            </span>
            <span className="text-slate-500 text-[11px]">
              Allocated proportionally across business units
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {departments.map((dept) => {
              const deptAnnualSavings = annualSavings * (dept.sharePercentage / 100);
              return (
                <div key={dept.id} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                  <span className="text-[11px] font-semibold text-slate-300 truncate block">
                    {dept.name}
                  </span>
                  <span className="text-base font-bold font-mono text-emerald-400 tabular-nums mt-1 block">
                    {formatUSD(deptAnnualSavings)}
                  </span>
                  <span className="text-[10px] text-slate-400 block font-mono">
                    / yr recovered budget
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
