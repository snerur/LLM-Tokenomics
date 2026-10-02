import React, { useState } from 'react';
import { LLMModel, WorkloadProfile, OptimizationLevers } from '../types/tokenomics';
import { FOUNDATION_MODELS } from '../data/modelsRegistry';
import { WORKLOAD_PRESETS, WorkloadPreset } from '../data/presets';
import { CalculationResult } from '../utils/calculator';
import { QueryVolumeSensitivityChart } from './QueryVolumeSensitivityChart';
import { Check, Info } from 'lucide-react';

interface CostSimulatorProps {
  workload: WorkloadProfile;
  setWorkload: React.Dispatch<React.SetStateAction<WorkloadProfile>>;
  primaryModel: LLMModel;
  setPrimaryModel: (model: LLMModel) => void;
  triageModel: LLMModel;
  optimizationLevers: OptimizationLevers;
  calcResult: CalculationResult;
}

export const CostSimulator: React.FC<CostSimulatorProps> = ({
  workload,
  setWorkload,
  primaryModel,
  setPrimaryModel,
  triageModel,
  optimizationLevers,
  calcResult,
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('customer-support-rag');

  const applyPreset = (preset: WorkloadPreset) => {
    setSelectedPresetId(preset.id);
    setWorkload(preset.profile);
    const foundModel = FOUNDATION_MODELS.find((m) => m.id === preset.recommendedModelId);
    if (foundModel) {
      setPrimaryModel(foundModel);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(2)}B`;
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}k`;
    return num.toLocaleString();
  };

  const formatUSD = (val: number): string => {
    if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
    if (val >= 10_000) return `$${Math.round(val).toLocaleString()}`;
    return `$${val.toFixed(2)}`;
  };

  // Calculate costs across all models for comparative bar chart
  const modelComparisonData = FOUNDATION_MODELS.map((model) => {
    const rawMonthlyInput = calcResult.monthlyInputTokens;
    const rawMonthlyOutput = calcResult.monthlyOutputTokens;
    const inputCost = (rawMonthlyInput / 1_000_000) * model.inputPricePerMillion;
    const outputCost = (rawMonthlyOutput / 1_000_000) * model.outputPricePerMillion;
    const totalCost = inputCost + outputCost;
    return {
      model,
      inputCost,
      outputCost,
      totalCost,
    };
  }).sort((a, b) => a.totalCost - b.totalCost);

  const maxModelCost = Math.max(...modelComparisonData.map((d) => d.totalCost), 1);

  return (
    <div className="space-y-8">
      {/* Editorial Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-cyan-400 font-mono">
          <span>Inference Unit Economics</span>
          <span aria-hidden="true">·</span>
          <span>Token Billing Architecture</span>
          <span aria-hidden="true">·</span>
          <span>Scalable Sizing</span>
        </div>
        <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Production LLM Workload Sizing &amp; Cost Simulator
        </h1>
        <p className="mt-2 text-sm text-slate-400 max-w-3xl">
          Model real-world token consumption across input prefixes, generative outputs, and multi-turn compounding.
          Compare foundation models on standardized unit economics ($/1M tokens, Cost per 1k queries, and monthly run-rate).
        </p>
      </div>

      {/* Enterprise Archetype Presets */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Workload Archetype Presets
          </span>
          <span className="text-xs text-slate-500">
            Select a verified production scenario to populate realistic token distributions
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {WORKLOAD_PRESETS.map((preset) => {
            const isSelected = selectedPresetId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => applyPreset(preset)}
                className={`flex flex-col text-left p-3 rounded-lg border transition-all ${
                  isSelected
                    ? 'border-cyan-500/80 bg-cyan-950/30 text-white shadow-sm'
                    : 'border-slate-800 bg-slate-900/40 text-slate-300 hover:border-slate-700 hover:bg-slate-800/60'
                }`}
              >
                <span className="text-xs font-semibold tracking-tight text-slate-200">
                  {preset.title}
                </span>
                <span className="mt-1 text-[11px] text-slate-400 line-clamp-2">
                  {preset.description}
                </span>
                <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>{formatNumber(preset.profile.dailyQueries)} Q/day</span>
                  <span>{formatNumber(preset.profile.avgInputTokens)} in / {formatNumber(preset.profile.avgOutputTokens)} out</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2-Column Grid: Left Controls, Right Output Economics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Workload Inputs (5 cols) */}
        <div className="lg:col-span-5 space-y-5 rounded-xl border border-slate-800 bg-slate-900/50 p-5">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
              Workload Parameters
            </h2>
            <span className="text-xs text-slate-500 font-mono">
              Volume &amp; Token Geometry
            </span>
          </div>

          {/* Daily Queries Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="daily-queries-input" className="font-medium text-slate-300">Daily Query Volume</label>
              <span className="font-mono text-cyan-400 tabular-nums font-semibold">
                {workload.dailyQueries.toLocaleString()} queries / day
              </span>
            </div>
            <input
              id="daily-queries-input"
              aria-label="Daily Query Volume"
              type="range"
              min={1000}
              max={2000000}
              step={5000}
              value={workload.dailyQueries}
              onChange={(e) => setWorkload({ ...workload, dailyQueries: Number(e.target.value) })}
              className="w-full accent-cyan-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>1k</span>
              <span>500k</span>
              <span>1M</span>
              <span>2M</span>
            </div>
          </div>

          {/* Avg Input Tokens */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="avg-input-tokens-input" className="font-medium text-slate-300">Average Input Tokens (per call)</label>
              <span className="font-mono text-cyan-400 tabular-nums font-semibold">
                {workload.avgInputTokens.toLocaleString()} tokens
              </span>
            </div>
            <input
              id="avg-input-tokens-input"
              aria-label="Average Input Tokens per call"
              type="range"
              min={100}
              max={64000}
              step={100}
              value={workload.avgInputTokens}
              onChange={(e) => setWorkload({ ...workload, avgInputTokens: Number(e.target.value) })}
              className="w-full accent-cyan-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>100 (Short)</span>
              <span>8k (RAG / Docs)</span>
              <span>32k (Codebase)</span>
              <span>64k (Deep Analysis)</span>
            </div>
          </div>

          {/* Avg Output Tokens */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="avg-output-tokens-input" className="font-medium text-slate-300">Average Output Tokens (generation)</label>
              <span className="font-mono text-cyan-400 tabular-nums font-semibold">
                {workload.avgOutputTokens.toLocaleString()} tokens
              </span>
            </div>
            <input
              id="avg-output-tokens-input"
              aria-label="Average Output Tokens generation"
              type="range"
              min={50}
              max={8192}
              step={50}
              value={workload.avgOutputTokens}
              onChange={(e) => setWorkload({ ...workload, avgOutputTokens: Number(e.target.value) })}
              className="w-full accent-cyan-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>50 (Classification)</span>
              <span>500 (Summary)</span>
              <span>2k (Draft)</span>
              <span>8k (CoT / Reasoning)</span>
            </div>
          </div>

          {/* Multi-turn depth */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <label htmlFor="multi-turn-depth-input" className="font-medium text-slate-300">Multi-Turn Session Depth</label>
                <span title="Each turn compounds earlier conversation history into subsequent input tokens." className="text-slate-400 hover:text-slate-300 cursor-help">
                  <Info className="h-3 w-3" />
                </span>
              </div>
              <span className="font-mono text-cyan-400 tabular-nums font-semibold">
                {workload.multiTurnTurns} {workload.multiTurnTurns === 1 ? 'turn (Stateless)' : 'turns/session'}
              </span>
            </div>
            <input
              id="multi-turn-depth-input"
              aria-label="Multi-Turn Session Depth"
              type="range"
              min={1}
              max={15}
              step={1}
              value={workload.multiTurnTurns}
              onChange={(e) => setWorkload({ ...workload, multiTurnTurns: Number(e.target.value) })}
              className="w-full accent-cyan-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
            />
            <p className="text-[11px] text-slate-400">
              {workload.multiTurnTurns > 1
                ? `Quadratic context multiplier: +${Math.round((workload.multiTurnTurns - 1) * 45)}% effective input volume due to conversational re-submissions.`
                : 'Stateless single-shot inference (no history compounding).'}
            </p>
          </div>

          {/* Active Monthly Users */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="active-users-input" className="font-medium text-slate-300">Monthly Active Users (MAU)</label>
              <span className="font-mono text-cyan-400 tabular-nums font-semibold">
                {workload.activeUsers.toLocaleString()} MAU
              </span>
            </div>
            <input
              id="active-users-input"
              aria-label="Monthly Active Users"
              type="range"
              min={100}
              max={500000}
              step={500}
              value={workload.activeUsers}
              onChange={(e) => setWorkload({ ...workload, activeUsers: Number(e.target.value) })}
              className="w-full accent-cyan-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
            />
          </div>

          {/* Primary Model Selection */}
          <div className="pt-2 border-t border-slate-800 space-y-2">
            <label htmlFor="primary-model-select" className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
              Active Baseline Model
            </label>
            <select
              id="primary-model-select"
              aria-label="Active Baseline Model"
              value={primaryModel.id}
              onChange={(e) => {
                const found = FOUNDATION_MODELS.find((m) => m.id === e.target.value);
                if (found) setPrimaryModel(found);
              }}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
            >
              {FOUNDATION_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.provider}) — ${m.inputPricePerMillion.toFixed(2)} in / ${m.outputPricePerMillion.toFixed(2)} out per 1M
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400">
              {primaryModel.description}
            </p>
          </div>
        </div>

        {/* Output Economics & Key Metrics (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                Monthly Spend
              </span>
              <span className="mt-1 text-xl sm:text-2xl font-bold font-mono text-white tabular-nums block">
                {formatUSD(calcResult.baselineMonthlyCost)}
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {formatUSD(calcResult.baselineDailyCost)} / day
              </span>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                Annual Run-Rate
              </span>
              <span className="mt-1 text-xl sm:text-2xl font-bold font-mono text-cyan-400 tabular-nums block">
                {formatUSD(calcResult.baselineAnnualCost)}
              </span>
              <span className="text-[11px] text-slate-400">
                Unoptimized projection
              </span>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                Cost Per 1K Queries
              </span>
              <span className="mt-1 text-xl sm:text-2xl font-bold font-mono text-emerald-400 tabular-nums block">
                ${calcResult.baselineCostPerThousandQueries.toFixed(3)}
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                ${(calcResult.baselineCostPerThousandQueries / 1000).toFixed(4)} / query
              </span>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                Cost Per MAU
              </span>
              <span className="mt-1 text-xl sm:text-2xl font-bold font-mono text-amber-400 tabular-nums block">
                ${calcResult.baselineCostPerActiveUserMonthly.toFixed(2)}
              </span>
              <span className="text-[11px] text-slate-400">
                Monthly cost / active user
              </span>
            </div>
          </div>

          {/* Monthly Token Footprint Breakdown */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between text-xs mb-3">
              <span className="font-semibold text-slate-300 uppercase tracking-wider">
                Monthly Token Footprint
              </span>
              <span className="font-mono text-slate-400">
                Total: <strong className="text-white">{formatNumber(calcResult.totalMonthlyTokens)}</strong> tokens / month
              </span>
            </div>

            {/* Proportion Bar */}
            <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden flex">
              <div
                style={{ width: `${(calcResult.monthlyInputTokens / calcResult.totalMonthlyTokens) * 100}%` }}
                className="bg-cyan-500 h-full"
                title={`Input Tokens: ${formatNumber(calcResult.monthlyInputTokens)}`}
              />
              <div
                style={{ width: `${(calcResult.monthlyOutputTokens / calcResult.totalMonthlyTokens) * 100}%` }}
                className="bg-violet-500 h-full"
                title={`Output Tokens: ${formatNumber(calcResult.monthlyOutputTokens)}`}
              />
            </div>

            <div className="mt-3 grid grid-cols-2 gap-4 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-cyan-500 shrink-0" />
                <div className="truncate">
                  <span className="text-slate-400">Input Tokens: </span>
                  <span className="font-semibold text-white">{formatNumber(calcResult.monthlyInputTokens)}</span>
                  <span className="text-slate-400 text-[11px] ml-1">
                    ({((calcResult.monthlyInputTokens / calcResult.totalMonthlyTokens) * 100).toFixed(0)}%)
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-violet-500 shrink-0" />
                <div className="truncate">
                  <span className="text-slate-400">Output Tokens: </span>
                  <span className="font-semibold text-white">{formatNumber(calcResult.monthlyOutputTokens)}</span>
                  <span className="text-slate-400 text-[11px] ml-1">
                    ({((calcResult.monthlyOutputTokens / calcResult.totalMonthlyTokens) * 100).toFixed(0)}%)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Model Cross-Comparison Chart */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between text-xs mb-3 border-b border-slate-800/80 pb-2">
              <span className="font-semibold text-slate-300 uppercase tracking-wider">
                Monthly Spend Benchmark Across Foundation Models
              </span>
              <span className="text-[11px] text-slate-400">
                Sorted by baseline cost (lowest to highest)
              </span>
            </div>

            <div className="space-y-2.5">
              {modelComparisonData.map(({ model, inputCost, outputCost, totalCost }) => {
                const isCurrent = model.id === primaryModel.id;
                const barWidth = Math.max(3, (totalCost / maxModelCost) * 100);

                return (
                  <div
                    key={model.id}
                    onClick={() => setPrimaryModel(model)}
                    className={`p-2 rounded-lg cursor-pointer transition-all ${
                      isCurrent
                        ? 'bg-slate-800/90 ring-1 ring-cyan-500/80'
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <div className="flex items-center gap-2">
                        {isCurrent ? (
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-cyan-500 text-slate-950 font-bold text-[10px]">
                            <Check className="h-3 w-3" />
                          </span>
                        ) : (
                          <span className="h-4 w-4 rounded-full border border-slate-700 shrink-0" />
                        )}
                        <span className={`font-medium ${isCurrent ? 'text-cyan-300 font-semibold' : 'text-slate-300'}`}>
                          {model.name}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {model.provider}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 font-mono tabular-nums text-xs">
                        <span className="text-slate-400 hidden sm:inline text-[11px]">
                          ${model.inputPricePerMillion.toFixed(2)} / ${model.outputPricePerMillion.toFixed(2)}
                        </span>
                        <span className={`font-semibold ${isCurrent ? 'text-cyan-400' : 'text-white'}`}>
                          {formatUSD(totalCost)}
                        </span>
                      </div>
                    </div>

                    {/* Proportional Bar */}
                    <div className="h-2 w-full rounded-full bg-slate-800/90 overflow-hidden flex">
                      <div
                        style={{ width: `${(inputCost / totalCost) * barWidth}%` }}
                        className="bg-cyan-500/80 h-full"
                        title={`Input portion: ${formatUSD(inputCost)}`}
                      />
                      <div
                        style={{ width: `${(outputCost / totalCost) * barWidth}%` }}
                        className="bg-violet-500/80 h-full"
                        title={`Output portion: ${formatUSD(outputCost)}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Query Volume Sensitivity Analysis (Recharts) */}
      <QueryVolumeSensitivityChart
        workload={workload}
        primaryModel={primaryModel}
        triageModel={triageModel}
        optimizationLevers={optimizationLevers}
      />
    </div>
  );
};
