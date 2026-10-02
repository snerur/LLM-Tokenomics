import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Line,
} from 'recharts';
import { LLMModel, OptimizationLevers, WorkloadProfile } from '../types/tokenomics';
import { calculateInferenceEconomics } from '../utils/calculator';
import { FOUNDATION_MODELS } from '../data/modelsRegistry';
import { TrendingUp, SlidersHorizontal, Info } from 'lucide-react';

interface QueryVolumeSensitivityChartProps {
  workload: WorkloadProfile;
  primaryModel: LLMModel;
  triageModel: LLMModel;
  optimizationLevers: OptimizationLevers;
}

export const QueryVolumeSensitivityChart: React.FC<QueryVolumeSensitivityChartProps> = ({
  workload,
  primaryModel,
  triageModel,
  optimizationLevers,
}) => {
  const [scaleMode, setScaleMode] = useState<'standard' | 'logarithmic' | 'enterprise'>('standard');
  const [showAlternativeModels, setShowAlternativeModels] = useState<boolean>(true);

  const formatUSD = (val: number): string => {
    if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
    if (val >= 10_000) return `$${Math.round(val).toLocaleString()}`;
    return `$${val.toFixed(0)}`;
  };

  const formatNumber = (num: number): string => {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(0)}k`;
    return num.toLocaleString();
  };

  // Generate sensitivity data points for daily query volumes
  const sensitivityData = useMemo(() => {
    let querySteps: number[] = [];

    if (scaleMode === 'enterprise') {
      querySteps = [10000, 50000, 100000, 250000, 500000, 750000, 1000000, 1500000, 2000000];
    } else {
      // Dynamic range centered around current workload
      const baseQ = workload.dailyQueries;
      const ratios = [0.1, 0.25, 0.5, 0.75, 1.0, 1.5, 2.0, 3.0, 4.0];
      querySteps = ratios.map((r) => Math.max(1000, Math.round(baseQ * r)));
      // Ensure unique and sorted
      querySteps = Array.from(new Set(querySteps)).sort((a, b) => a - b);
    }

    // Benchmark comparison models
    const geminiFlashModel = FOUNDATION_MODELS.find((m) => m.id === 'gemini-2-flash') || FOUNDATION_MODELS[0];
    const gpt4oModel = FOUNDATION_MODELS.find((m) => m.id === 'gpt-4o') || FOUNDATION_MODELS[4];
    const claudeSonnetModel = FOUNDATION_MODELS.find((m) => m.id === 'claude-3-5-sonnet') || FOUNDATION_MODELS[2];

    return querySteps.map((q) => {
      const simWorkload: WorkloadProfile = {
        ...workload,
        dailyQueries: q,
      };

      const result = calculateInferenceEconomics(
        simWorkload,
        primaryModel,
        triageModel,
        optimizationLevers
      );

      // Alternatives unoptimized baseline
      const geminiResult = calculateInferenceEconomics(
        simWorkload,
        geminiFlashModel,
        triageModel,
        optimizationLevers
      );

      const sonnetResult = calculateInferenceEconomics(
        simWorkload,
        claudeSonnetModel,
        triageModel,
        optimizationLevers
      );

      const gpt4oResult = calculateInferenceEconomics(
        simWorkload,
        gpt4oModel,
        triageModel,
        optimizationLevers
      );

      return {
        dailyQueries: q,
        queryLabel: `${formatNumber(q)}/d`,
        baselineMonthlyCost: Math.round(result.baselineMonthlyCost),
        optimizedMonthlyCost: Math.round(result.optimizedMonthlyCost),
        monthlySavings: Math.round(result.monthlySavingsUSD),
        savingsPercent: result.savingsPercentage,
        costPerThousandQueries: result.optimizedCostPerThousandQueries,
        // Model curves
        geminiFlashCost: Math.round(geminiResult.optimizedMonthlyCost),
        claudeSonnetCost: Math.round(sonnetResult.optimizedMonthlyCost),
        gpt4oCost: Math.round(gpt4oResult.optimizedMonthlyCost),
        isCurrentScale: q === workload.dailyQueries,
      };
    });
  }, [workload, primaryModel, triageModel, optimizationLevers, scaleMode]);

  // Marginal cost calculation: how much does +100k queries/day add to monthly bill?
  const marginalResult1 = calculateInferenceEconomics(
    { ...workload, dailyQueries: 100000 },
    primaryModel,
    triageModel,
    optimizationLevers
  );
  const marginalResult2 = calculateInferenceEconomics(
    { ...workload, dailyQueries: 200000 },
    primaryModel,
    triageModel,
    optimizationLevers
  );

  const baselineMarginalPer100k = marginalResult2.baselineMonthlyCost - marginalResult1.baselineMonthlyCost;
  const optimizedMarginalPer100k = marginalResult2.optimizedMonthlyCost - marginalResult1.optimizedMonthlyCost;

  // Custom tooltip component for Recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="rounded-lg border border-slate-700 bg-slate-900/95 p-3.5 shadow-xl backdrop-blur-md text-xs font-mono space-y-2 max-w-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 font-sans">
            <span className="font-semibold text-white">Daily Volume: {data.dailyQueries.toLocaleString()} Q/day</span>
            {data.dailyQueries === workload.dailyQueries && (
              <span className="text-[10px] text-cyan-400 bg-cyan-950/80 px-1.5 py-0.5 rounded font-mono">
                Current
              </span>
            )}
          </div>

          <div className="space-y-1 text-slate-300">
            <div className="flex justify-between items-center text-slate-400">
              <span>Baseline Monthly:</span>
              <span className="font-semibold text-rose-400">{formatUSD(data.baselineMonthlyCost)}</span>
            </div>

            <div className="flex justify-between items-center text-slate-400">
              <span>Optimized Monthly:</span>
              <span className="font-semibold text-cyan-400">{formatUSD(data.optimizedMonthlyCost)}</span>
            </div>

            <div className="flex justify-between items-center text-slate-400 pt-1 border-t border-slate-800/80">
              <span>Retained Savings:</span>
              <span className="font-semibold text-emerald-400">
                {formatUSD(data.monthlySavings)} ({data.savingsPercent.toFixed(0)}%)
              </span>
            </div>

            <div className="flex justify-between items-center text-slate-400 text-[11px]">
              <span>Unit Cost / kQ:</span>
              <span className="text-white">${data.costPerThousandQueries.toFixed(3)}</span>
            </div>
          </div>

          {showAlternativeModels && (
            <div className="pt-1.5 border-t border-slate-800/80 space-y-1 text-[11px] text-slate-400">
              <span className="text-[10px] uppercase font-sans text-slate-500 block">Model Benchmarks (Optimized)</span>
              <div className="flex justify-between">
                <span>Gemini 2.0 Flash:</span>
                <span className="text-cyan-300">{formatUSD(data.geminiFlashCost)}</span>
              </div>
              <div className="flex justify-between">
                <span>GPT-4o:</span>
                <span className="text-violet-300">{formatUSD(data.gpt4oCost)}</span>
              </div>
              <div className="flex justify-between">
                <span>Claude 3.5 Sonnet:</span>
                <span className="text-amber-300">{formatUSD(data.claudeSonnetCost)}</span>
              </div>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-5">
      {/* Top Header & Range Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-cyan-400" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
              Query Volume Sensitivity Analysis
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Simulates monthly inference cost scaling across varying daily query volumes (Unoptimized vs. Optimized).
          </p>
        </div>

        {/* Controls: Scale & Benchmark Overlay */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Scale mode segmented control */}
          <div className="flex items-center gap-1 rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs">
            <button
              onClick={() => setScaleMode('standard')}
              className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
                scaleMode === 'standard'
                  ? 'bg-slate-800 text-cyan-400 font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Dynamic Workload
            </button>
            <button
              onClick={() => setScaleMode('enterprise')}
              className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
                scaleMode === 'enterprise'
                  ? 'bg-slate-800 text-cyan-400 font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Enterprise 10k–2M
            </button>
          </div>

          {/* Model Benchmark lines toggle */}
          <button
            onClick={() => setShowAlternativeModels(!showAlternativeModels)}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs transition-colors whitespace-nowrap ${
              showAlternativeModels
                ? 'border-cyan-500/60 bg-cyan-950/40 text-cyan-300'
                : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            <SlidersHorizontal className="h-3 w-3" />
            <span>Model Benchmarks</span>
          </button>
        </div>
      </div>

      {/* Main Recharts Area Chart */}
      <div className="w-full h-80 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={sensitivityData} margin={{ top: 10, right: 25, left: 10, bottom: 20 }}>
            <defs>
              {/* Gradient for Baseline Cost */}
              <linearGradient id="colorBaseline" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
              </linearGradient>

              {/* Gradient for Optimized Cost */}
              <linearGradient id="colorOptimized" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.05} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />

            <XAxis
              dataKey="queryLabel"
              stroke="#64748b"
              fontSize={11}
              fontFamily="JetBrains Mono, monospace"
              tickLine={false}
              dy={10}
            />

            <YAxis
              stroke="#64748b"
              fontSize={11}
              fontFamily="JetBrains Mono, monospace"
              tickFormatter={(v) => formatUSD(v)}
              tickLine={false}
              dx={-5}
            />

            <Tooltip content={<CustomTooltip />} />

            <Legend
              verticalAlign="top"
              height={36}
              wrapperStyle={{ fontSize: '11px', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            />

            {/* Baseline Spend Area */}
            <Area
              type="monotone"
              dataKey="baselineMonthlyCost"
              name={`Baseline (${primaryModel.name})`}
              stroke="#f43f5e"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorBaseline)"
            />

            {/* Optimized Spend Area */}
            <Area
              type="monotone"
              dataKey="optimizedMonthlyCost"
              name="Optimized Stack"
              stroke="#06b6d4"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#colorOptimized)"
            />

            {/* Optional benchmark comparison lines */}
            {showAlternativeModels && (
              <>
                <Line
                  type="monotone"
                  dataKey="geminiFlashCost"
                  name="Gemini 2.0 Flash Benchmark"
                  stroke="#38bdf8"
                  strokeWidth={1.5}
                  strokeDasharray="4 2"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="gpt4oCost"
                  name="GPT-4o Benchmark"
                  stroke="#a78bfa"
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="claudeSonnetCost"
                  name="Claude 3.5 Sonnet Benchmark"
                  stroke="#f59e0b"
                  strokeWidth={1.5}
                  strokeDasharray="2 2"
                  dot={false}
                />
              </>
            )}

            {/* Current Workload Marker */}
            <ReferenceLine
              x={`${formatNumber(workload.dailyQueries)}/d`}
              stroke="#22d3ee"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: 'Current Workload',
                position: 'top',
                fill: '#22d3ee',
                fontSize: 10,
                fontFamily: 'JetBrains Mono, monospace',
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Marginal Sensitivity Insights Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800">
        <div className="rounded-lg bg-slate-950/70 border border-slate-800/80 p-3">
          <span className="text-[10px] uppercase font-mono text-slate-400 block mb-0.5">
            Marginal Cost / +100k Queries
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold font-mono text-cyan-400 tabular-nums">
              +{formatUSD(optimizedMarginalPer100k)}
            </span>
            <span className="text-xs text-slate-400 line-through font-mono">
              +{formatUSD(baselineMarginalPer100k)}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 block mt-0.5">
            Monthly cost increase per 100k queries/day
          </span>
        </div>

        <div className="rounded-lg bg-slate-950/70 border border-slate-800/80 p-3">
          <span className="text-[10px] uppercase font-mono text-slate-400 block mb-0.5">
            Cost Divergence Multiplier
          </span>
          <span className="text-base font-bold font-mono text-emerald-400 tabular-nums">
            {(baselineMarginalPer100k / Math.max(1, optimizedMarginalPer100k)).toFixed(1)}x
          </span>
          <span className="text-[11px] text-slate-400 block mt-0.5">
            Unoptimized burn accelerates {(baselineMarginalPer100k / Math.max(1, optimizedMarginalPer100k)).toFixed(1)}x faster at volume
          </span>
        </div>

        <div className="rounded-lg bg-slate-950/70 border border-slate-800/80 p-3">
          <span className="text-[10px] uppercase font-mono text-slate-400 block mb-0.5">
            Projected Spend at 2x Scale
          </span>
          <span className="text-base font-bold font-mono text-white tabular-nums">
            {formatUSD(marginalResult2.optimizedMonthlyCost * (workload.dailyQueries / 100000))}
          </span>
          <span className="text-[11px] text-slate-400 block mt-0.5">
            Estimated monthly cost if current traffic doubles
          </span>
        </div>
      </div>
    </div>
  );
};
