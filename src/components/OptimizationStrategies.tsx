import React, { useState } from 'react';
import { LLMModel, OptimizationLevers, WorkloadProfile } from '../types/tokenomics';
import { CalculationResult } from '../utils/calculator';
import { FOUNDATION_MODELS } from '../data/modelsRegistry';
import {
  Zap,
  Layers,
  Clock,
  Database,
  Sliders,
  CheckCircle2,
  Code2,
  Copy,
  Check,
  TrendingDown,
} from 'lucide-react';

interface OptimizationStrategiesProps {
  optimizationLevers: OptimizationLevers;
  setOptimizationLevers: React.Dispatch<React.SetStateAction<OptimizationLevers>>;
  primaryModel: LLMModel;
  triageModel: LLMModel;
  setTriageModel: (model: LLMModel) => void;
  workload: WorkloadProfile;
  calcResult: CalculationResult;
}

export const OptimizationStrategies: React.FC<OptimizationStrategiesProps> = ({
  optimizationLevers,
  setOptimizationLevers,
  primaryModel,
  triageModel,
  setTriageModel,
  workload,
  calcResult,
}) => {
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);
  const [activeCodeTab, setActiveCodeTab] = useState<'prompt-caching' | 'cascade-router' | 'semantic-cache'>('prompt-caching');

  const formatUSD = (val: number): string => {
    if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
    if (val >= 10_000) return `$${Math.round(val).toLocaleString()}`;
    return `$${val.toFixed(2)}`;
  };

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  // Triage models eligible for tier-1 routing
  const triageEligibleModels = FOUNDATION_MODELS.filter(
    (m) => m.tier === 'triage' || m.inputPricePerMillion <= 0.8
  );

  const codeSnippets = {
    'prompt-caching': `// High-Performance Prompt Caching Gateway
// Injects static system instructions and documentation prefixes as cached blocks

import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI();

// 1. Create a persistent context cache for large static corpora (10k+ tokens)
const cache = await ai.caches.create({
  model: 'gemini-1.5-pro',
  config: {
    displayName: 'enterprise-kb-v4',
    contents: [{ role: 'user', parts: [{ text: ENTERPRISE_KB_CORPUS }] }],
    ttl: '86400s', // 24-hour cache persistence
  }
});

// 2. Query against cached prefix: 75% to 90% discount on input tokens
const response = await ai.models.generateContent({
  model: 'gemini-1.5-pro',
  contents: [{ role: 'user', parts: [{ text: userQuery }] }],
  config: { cachedContent: cache.name }
});`,

    'cascade-router': `// Intelligent 2-Tier Inference Cascade
// Routes 70% of routine queries to ultra-fast sub-$0.15 models

async function executeCascadedInference(query: string, context: string) {
  // Step 1: Lightweight Classifier / Fast Triage (< 150ms)
  const isComplex = classifyQueryComplexity(query, {
    maxTokensThreshold: 4000,
    requiresCodeExecution: /def |class |SELECT|JOIN/i.test(query),
    reasoningIntent: /explain why|prove that|compare architectural/i.test(query)
  });

  if (!isComplex) {
    // Route to lightweight model: Gemini 2.0 Flash or Claude 3.5 Haiku
    return await callModel('gemini-2-flash', { query, context, maxTokens: 800 });
  }

  // Step 2: Escalate only complex reasoning tasks to Frontier Flagship
  return await callModel('claude-3-5-sonnet', { query, context, maxTokens: 3000 });
}`,

    'semantic-cache': `// Zero-Token Semantic Vector Gateway
// Intercepts repetitive user queries via cosine similarity threshold >= 0.94

async function querySemanticCache(userPrompt: string) {
  const promptEmbedding = await generateEmbedding(userPrompt);
  
  // Vector search against cached Q&A index (Milvus / pgvector / Qdrant)
  const [topMatch] = await vectorDb.query({
    vector: promptEmbedding,
    topK: 1,
    filter: { ttlExpired: false }
  });

  if (topMatch && topMatch.similarity >= 0.94) {
    // Cache Hit: Return stored answer immediately (0 LLM inference tokens, 15ms latency)
    recordMetric('semantic_cache_hit', { prompt: userPrompt });
    return { text: topMatch.cachedAnswer, source: 'semantic_cache', tokenCost: 0 };
  }

  // Cache Miss: Proceed to model generation and asynchronously write back to cache
  const result = await callModelPrimary(userPrompt);
  await vectorDb.upsert({ vector: promptEmbedding, cachedAnswer: result.text, ttl: 86400 });
  return result;
}`
  };

  return (
    <div className="space-y-8">
      {/* Editorial Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-cyan-400 font-mono">
          <span>Cost Optimization Architecture</span>
          <span aria-hidden="true">·</span>
          <span>ROI Engineering</span>
          <span aria-hidden="true">·</span>
          <span>Production FinOps</span>
        </div>
        <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Inference Cost Reduction Strategies &amp; ROI Simulator
        </h1>
        <p className="mt-2 text-sm text-slate-400 max-w-3xl">
          Deploying raw frontier models without architectural guardrails leads to rapid cost escalations.
          Simulate the compounding impact of prompt caching, cascading, batching, semantic deduplication, and output token pruning.
        </p>
      </div>

      {/* Compounding ROI Savings Summary Card */}
      <div className="rounded-xl border border-cyan-800/60 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/40 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-400">
              <TrendingDown className="h-4 w-4" />
              <span>Projected Savings Waterfall</span>
            </div>
            <div className="mt-2 flex flex-wrap items-baseline gap-3">
              <span className="text-3xl sm:text-4xl font-bold font-mono text-emerald-400 tabular-nums">
                {formatUSD(calcResult.monthlySavingsUSD)}
              </span>
              <span className="text-sm font-semibold text-emerald-300 font-mono">
                / month ({calcResult.savingsPercentage.toFixed(1)}% reduction)
              </span>
              <span className="text-xs text-slate-400">
                · Saving <strong className="text-white font-mono">{formatUSD(calcResult.annualSavingsUSD)}</strong> annually
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs font-mono text-slate-300">
              <div>
                <span className="text-slate-500">Unoptimized: </span>
                <span className="line-through text-slate-400">{formatUSD(calcResult.baselineMonthlyCost)}/mo</span>
              </div>
              <div>
                <span className="text-slate-500">Optimized Run-Rate: </span>
                <span className="text-cyan-400 font-semibold">{formatUSD(calcResult.optimizedMonthlyCost)}/mo</span>
              </div>
              <div>
                <span className="text-slate-500">Optimized Cost/kQ: </span>
                <span className="text-emerald-400 font-semibold">${calcResult.optimizedCostPerThousandQueries.toFixed(3)}</span>
              </div>
            </div>
          </div>

          {/* Savings Waterfall distribution preview */}
          <div className="w-full lg:w-72 bg-slate-950/70 rounded-lg p-3 border border-slate-800 text-xs space-y-1.5 font-mono">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 block font-sans font-semibold">
              Attributed Savings Breakdown
            </span>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">KV Prompt Cache:</span>
              <span className="text-cyan-300 font-semibold">{formatUSD(calcResult.savingsPromptCaching)}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Cascaded Router:</span>
              <span className="text-cyan-300 font-semibold">{formatUSD(calcResult.savingsCascading)}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Semantic Cache:</span>
              <span className="text-cyan-300 font-semibold">{formatUSD(calcResult.savingsSemanticCache)}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Batch Offloading:</span>
              <span className="text-cyan-300 font-semibold">{formatUSD(calcResult.savingsBatch)}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Output Pruning:</span>
              <span className="text-cyan-300 font-semibold">{formatUSD(calcResult.savingsOutputPruning)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* The 5 Architectural Levers (Interactive Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Lever 1: KV Prompt Caching */}
        <div className={`rounded-xl border p-5 transition-all flex flex-col justify-between ${
          optimizationLevers.enablePromptCaching
            ? 'border-cyan-500/60 bg-slate-900/80 shadow-sm'
            : 'border-slate-800 bg-slate-900/40 opacity-75'
        }`}>
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-950 border border-cyan-800/80 text-cyan-400">
                  <Zap className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-semibold text-white">1. KV Prompt Caching</h3>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={optimizationLevers.enablePromptCaching}
                  onChange={(e) =>
                    setOptimizationLevers({
                      ...optimizationLevers,
                      enablePromptCaching: e.target.checked,
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-600"></div>
              </label>
            </div>

            <p className="mt-2.5 text-xs text-slate-400 leading-relaxed">
              Reuses key-value attention representations in GPU memory for shared static prefixes (system instructions, tool schemas, retrieved document corpora).
              Saves up to <strong>90%</strong> on cached input tokens and cuts TTFT by 3x.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
            <div className="flex justify-between text-xs">
              <label htmlFor="cache-hit-ratio-input" className="text-slate-400">Target Cache Hit Ratio</label>
              <span className="font-mono text-cyan-400 font-semibold">{optimizationLevers.cacheHitRatio}%</span>
            </div>
            <input
              id="cache-hit-ratio-input"
              aria-label="Target Cache Hit Ratio"
              type="range"
              min={10}
              max={95}
              step={5}
              disabled={!optimizationLevers.enablePromptCaching}
              value={optimizationLevers.cacheHitRatio}
              onChange={(e) =>
                setOptimizationLevers({
                  ...optimizationLevers,
                  cacheHitRatio: Number(e.target.value),
                })
              }
              className="w-full accent-cyan-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer disabled:opacity-50"
            />
            <span className="text-[10px] text-slate-400 block font-mono">
              Provider cached rate: ${primaryModel.cachedInputPricePerMillion.toFixed(3)}/1M (vs ${primaryModel.inputPricePerMillion.toFixed(2)})
            </span>
          </div>
        </div>

        {/* Lever 2: Cascaded Model Routing */}
        <div className={`rounded-xl border p-5 transition-all flex flex-col justify-between ${
          optimizationLevers.enableCascading
            ? 'border-cyan-500/60 bg-slate-900/80 shadow-sm'
            : 'border-slate-800 bg-slate-900/40 opacity-75'
        }`}>
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-950 border border-indigo-800/80 text-indigo-400">
                  <Layers className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-semibold text-white">2. Cascaded Model Routing</h3>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={optimizationLevers.enableCascading}
                  onChange={(e) =>
                    setOptimizationLevers({
                      ...optimizationLevers,
                      enableCascading: e.target.checked,
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-600"></div>
              </label>
            </div>

            <p className="mt-2.5 text-xs text-slate-400 leading-relaxed">
              Tier-1 router sends high-volume, lower-complexity queries to an ultra-fast cheap model, escalating only complex reasoning tasks to your flagship model.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
            <div className="flex justify-between text-xs">
              <label htmlFor="triage-share-input" className="text-slate-400">Routed to Triage Model</label>
              <span className="font-mono text-cyan-400 font-semibold">{optimizationLevers.cascadeTriageShare}%</span>
            </div>
            <input
              id="triage-share-input"
              aria-label="Routed to Triage Model"
              type="range"
              min={10}
              max={90}
              step={5}
              disabled={!optimizationLevers.enableCascading}
              value={optimizationLevers.cascadeTriageShare}
              onChange={(e) =>
                setOptimizationLevers({
                  ...optimizationLevers,
                  cascadeTriageShare: Number(e.target.value),
                })
              }
              className="w-full accent-cyan-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer disabled:opacity-50"
            />
            <div className="pt-1">
              <label htmlFor="triage-model-select" className="text-[10px] text-slate-400 block mb-1">Triage Tier Model</label>
              <select
                id="triage-model-select"
                aria-label="Triage Tier Model"
                disabled={!optimizationLevers.enableCascading}
                value={triageModel.id}
                onChange={(e) => {
                  const m = FOUNDATION_MODELS.find((mod) => mod.id === e.target.value);
                  if (m) setTriageModel(m);
                }}
                className="w-full rounded border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-white focus:outline-none disabled:opacity-50"
              >
                {triageEligibleModels.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} (${m.inputPricePerMillion.toFixed(2)} in / ${m.outputPricePerMillion.toFixed(2)} out)
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Lever 3: Semantic Vector Caching */}
        <div className={`rounded-xl border p-5 transition-all flex flex-col justify-between ${
          optimizationLevers.enableSemanticCache
            ? 'border-cyan-500/60 bg-slate-900/80 shadow-sm'
            : 'border-slate-800 bg-slate-900/40 opacity-75'
        }`}>
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-950 border border-emerald-800/80 text-emerald-400">
                  <Database className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-semibold text-white">3. Semantic Vector Cache</h3>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={optimizationLevers.enableSemanticCache}
                  onChange={(e) =>
                    setOptimizationLevers({
                      ...optimizationLevers,
                      enableSemanticCache: e.target.checked,
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-600"></div>
              </label>
            </div>

            <p className="mt-2.5 text-xs text-slate-400 leading-relaxed">
              Embedding gateway intercepts near-duplicate questions (similarity &gt; 0.94). Cached responses are served in &lt;20ms at <strong>$0.00</strong> token cost.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
            <div className="flex justify-between text-xs">
              <label htmlFor="semantic-hit-rate-input" className="text-slate-400">Semantic Hit Rate</label>
              <span className="font-mono text-cyan-400 font-semibold">{optimizationLevers.semanticCacheHitRate}%</span>
            </div>
            <input
              id="semantic-hit-rate-input"
              aria-label="Semantic Hit Rate"
              type="range"
              min={5}
              max={40}
              step={1}
              disabled={!optimizationLevers.enableSemanticCache}
              value={optimizationLevers.semanticCacheHitRate}
              onChange={(e) =>
                setOptimizationLevers({
                  ...optimizationLevers,
                  semanticCacheHitRate: Number(e.target.value),
                })
              }
              className="w-full accent-cyan-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer disabled:opacity-50"
            />
            <span className="text-[10px] text-slate-400 block font-mono">
              Bypasses model inference entirely for {optimizationLevers.semanticCacheHitRate}% of total query volume
            </span>
          </div>
        </div>

        {/* Lever 4: Batch API Offloading */}
        <div className={`rounded-xl border p-5 transition-all flex flex-col justify-between ${
          optimizationLevers.enableBatchProcessing
            ? 'border-cyan-500/60 bg-slate-900/80 shadow-sm'
            : 'border-slate-800 bg-slate-900/40 opacity-75'
        }`}>
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-950 border border-amber-800/80 text-amber-400">
                  <Clock className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-semibold text-white">4. Batch API Inference</h3>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={optimizationLevers.enableBatchProcessing}
                  onChange={(e) =>
                    setOptimizationLevers({
                      ...optimizationLevers,
                      enableBatchProcessing: e.target.checked,
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-600"></div>
              </label>
            </div>

            <p className="mt-2.5 text-xs text-slate-400 leading-relaxed">
              Asynchronous API processing with a 24-hour turnaround provides a <strong>50% discount</strong> across Google, Anthropic, and OpenAI for non-urgent tasks (evals, indexing, batch PR audits).
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
            <div className="flex justify-between text-xs">
              <label htmlFor="batch-eligible-share-input" className="text-slate-400">Batch-Eligible Volume Share</label>
              <span className="font-mono text-cyan-400 font-semibold">{optimizationLevers.batchShare}%</span>
            </div>
            <input
              id="batch-eligible-share-input"
              aria-label="Batch-Eligible Volume Share"
              type="range"
              min={5}
              max={80}
              step={5}
              disabled={!optimizationLevers.enableBatchProcessing}
              value={optimizationLevers.batchShare}
              onChange={(e) =>
                setOptimizationLevers({
                  ...optimizationLevers,
                  batchShare: Number(e.target.value),
                })
              }
              className="w-full accent-cyan-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer disabled:opacity-50"
            />
            <span className="text-[10px] text-slate-400 block font-mono">
              Applies 50% discount to {optimizationLevers.batchShare}% of workload
            </span>
          </div>
        </div>

        {/* Lever 5: Strict Output Schema Pruning */}
        <div className={`rounded-xl border p-5 transition-all flex flex-col justify-between ${
          optimizationLevers.enableOutputPruning
            ? 'border-cyan-500/60 bg-slate-900/80 shadow-sm'
            : 'border-slate-800 bg-slate-900/40 opacity-75'
        }`}>
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-950 border border-rose-800/80 text-rose-400">
                  <Sliders className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-semibold text-white">5. Output Token Pruning</h3>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={optimizationLevers.enableOutputPruning}
                  onChange={(e) =>
                    setOptimizationLevers({
                      ...optimizationLevers,
                      enableOutputPruning: e.target.checked,
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-600"></div>
              </label>
            </div>

            <p className="mt-2.5 text-xs text-slate-400 leading-relaxed">
              Output tokens cost <strong>3x to 5x more</strong> than input tokens. Enforcing strict JSON schemas, concise system instructions, and early stop tokens eliminates unnecessary wordiness.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
            <div className="flex justify-between text-xs">
              <label htmlFor="output-reduction-input" className="text-slate-400">Output Token Reduction</label>
              <span className="font-mono text-cyan-400 font-semibold">{optimizationLevers.outputPruningReduction}%</span>
            </div>
            <input
              id="output-reduction-input"
              aria-label="Output Token Reduction"
              type="range"
              min={10}
              max={60}
              step={5}
              disabled={!optimizationLevers.enableOutputPruning}
              value={optimizationLevers.outputPruningReduction}
              onChange={(e) =>
                setOptimizationLevers({
                  ...optimizationLevers,
                  outputPruningReduction: Number(e.target.value),
                })
              }
              className="w-full accent-cyan-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer disabled:opacity-50"
            />
            <span className="text-[10px] text-slate-400 block font-mono">
              Trims average output from {workload.avgOutputTokens} to {Math.round(workload.avgOutputTokens * (1 - optimizationLevers.outputPruningReduction / 100))} tokens
            </span>
          </div>
        </div>

        {/* Summary Card for Full-Stack Architecture */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-950 border border-cyan-800/80 text-cyan-400">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold text-white">Architecture Health Score</h3>
            </div>
            <p className="mt-2.5 text-xs text-slate-400 leading-relaxed">
              When all 5 optimization layers are coordinated behind a unified gateway, enterprise teams routinely cut inference overhead by <strong>60% to 80%</strong> while improving P95 response latency.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 space-y-1.5 text-xs font-mono">
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Total Active Strategies:</span>
              <span className="text-white font-semibold">
                {[
                  optimizationLevers.enablePromptCaching,
                  optimizationLevers.enableCascading,
                  optimizationLevers.enableSemanticCache,
                  optimizationLevers.enableBatchProcessing,
                  optimizationLevers.enableOutputPruning,
                ].filter(Boolean).length} / 5
              </span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Net Cost Multiplier:</span>
              <span className="text-emerald-400 font-semibold">
                {(1 - calcResult.savingsPercentage / 100).toFixed(2)}x of baseline
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Production Implementation Code Blueprints */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <Code2 className="h-4 w-4 text-cyan-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Reference Implementation Blueprints
            </span>
          </div>

          {/* Segmented Code Tab Switcher */}
          <div className="flex items-center gap-1 rounded-lg bg-slate-950 p-1 border border-slate-800">
            <button
              onClick={() => setActiveCodeTab('prompt-caching')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                activeCodeTab === 'prompt-caching'
                  ? 'bg-slate-800 text-cyan-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Prompt Caching
            </button>
            <button
              onClick={() => setActiveCodeTab('cascade-router')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                activeCodeTab === 'cascade-router'
                  ? 'bg-slate-800 text-cyan-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Cascaded Router
            </button>
            <button
              onClick={() => setActiveCodeTab('semantic-cache')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                activeCodeTab === 'semantic-cache'
                  ? 'bg-slate-800 text-cyan-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Semantic Vector Cache
            </button>
          </div>
        </div>

        {/* Code Block Container */}
        <div className="relative mt-3">
          <button
            onClick={() => handleCopyCode(activeCodeTab, codeSnippets[activeCodeTab])}
            className="absolute top-3 right-3 flex items-center gap-1.5 rounded border border-slate-700 bg-slate-800/90 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          >
            {copiedSnippet === activeCodeTab ? (
              <>
                <Check className="h-3 w-3 text-emerald-400" />
                <span className="text-emerald-300">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                <span>Copy Code</span>
              </>
            )}
          </button>

          <pre className="overflow-x-auto rounded-lg bg-slate-950 p-4 text-xs font-mono text-slate-300 leading-relaxed border border-slate-800">
            <code>{codeSnippets[activeCodeTab]}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
