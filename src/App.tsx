import React, { useState, useMemo } from 'react';
import { WorkloadProfile, LLMModel, OptimizationLevers } from './types/tokenomics';
import { FOUNDATION_MODELS } from './data/modelsRegistry';
import { WORKLOAD_PRESETS } from './data/presets';
import { calculateInferenceEconomics } from './utils/calculator';
import { Navigation, ActiveTab } from './components/Navigation';
import { CostSimulator } from './components/CostSimulator';
import { OptimizationStrategies } from './components/OptimizationStrategies';
import { SelfHostedTCO } from './components/SelfHostedTCO';
import { OrganizationalFinOps } from './components/OrganizationalFinOps';
import { RisksAndMitigation } from './components/RisksAndMitigation';
import { ExportModal } from './components/ExportModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('simulator');
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);

  // Default initial workload
  const defaultWorkload: WorkloadProfile = {
    dailyQueries: 250000,
    avgInputTokens: 3200,
    avgOutputTokens: 450,
    multiTurnTurns: 4,
    promptCacheHitRate: 75,
    batchEligiblePercentage: 10,
    activeUsers: 85000,
    peakConcurrencyQPS: 45,
  };

  const [workload, setWorkload] = useState<WorkloadProfile>(defaultWorkload);
  const [primaryModel, setPrimaryModel] = useState<LLMModel>(
    FOUNDATION_MODELS.find((m) => m.id === 'claude-3-5-sonnet') || FOUNDATION_MODELS[2]
  );
  const [triageModel, setTriageModel] = useState<LLMModel>(
    FOUNDATION_MODELS.find((m) => m.id === 'gemini-2-flash') || FOUNDATION_MODELS[0]
  );

  const defaultOptimizationLevers: OptimizationLevers = {
    enablePromptCaching: true,
    cacheHitRatio: 70,
    enableCascading: true,
    cascadeTriageShare: 65,
    cascadeTriageModelId: 'gemini-2-flash',
    enableBatchProcessing: false,
    batchShare: 25,
    enableSemanticCache: true,
    semanticCacheHitRate: 15,
    enableOutputPruning: true,
    outputPruningReduction: 25,
  };

  const [optimizationLevers, setOptimizationLevers] = useState<OptimizationLevers>(
    defaultOptimizationLevers
  );

  const handleResetDefaults = () => {
    setWorkload(defaultWorkload);
    setPrimaryModel(FOUNDATION_MODELS.find((m) => m.id === 'claude-3-5-sonnet') || FOUNDATION_MODELS[2]);
    setTriageModel(FOUNDATION_MODELS.find((m) => m.id === 'gemini-2-flash') || FOUNDATION_MODELS[0]);
    setOptimizationLevers(defaultOptimizationLevers);
  };

  // Memoized economic calculations
  const calcResult = useMemo(() => {
    return calculateInferenceEconomics(workload, primaryModel, triageModel, optimizationLevers);
  }, [workload, primaryModel, triageModel, optimizationLevers]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Strict 3-zone Top Bar Contract */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenExport={() => setIsExportOpen(true)}
        onResetDefaults={handleResetDefaults}
      />

      {/* Main Content Area */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'simulator' && (
          <CostSimulator
            workload={workload}
            setWorkload={setWorkload}
            primaryModel={primaryModel}
            setPrimaryModel={setPrimaryModel}
            triageModel={triageModel}
            optimizationLevers={optimizationLevers}
            calcResult={calcResult}
          />
        )}

        {activeTab === 'strategies' && (
          <OptimizationStrategies
            optimizationLevers={optimizationLevers}
            setOptimizationLevers={setOptimizationLevers}
            primaryModel={primaryModel}
            triageModel={triageModel}
            setTriageModel={setTriageModel}
            workload={workload}
            calcResult={calcResult}
          />
        )}

        {activeTab === 'tco' && (
          <SelfHostedTCO
            workload={workload}
            primaryModel={primaryModel}
          />
        )}

        {activeTab === 'finops' && (
          <OrganizationalFinOps
            calcResult={calcResult}
            optimizationLevers={optimizationLevers}
            workload={workload}
            primaryModel={primaryModel}
          />
        )}

        {activeTab === 'risks' && (
          <RisksAndMitigation />
        )}
      </main>

      {/* Clean quiet footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">Tokenomics Studio</span>
            <span aria-hidden="true">·</span>
            <span>AI Inference Economics &amp; FinOps Workbench</span>
          </div>
          <div className="flex items-center gap-4 font-mono text-[11px] text-slate-500">
            <span>Standardized per 1M tokens</span>
            <span>·</span>
            <span>All currency in USD</span>
          </div>
        </div>
      </footer>

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        workload={workload}
        primaryModel={primaryModel}
        triageModel={triageModel}
        optimizationLevers={optimizationLevers}
        calcResult={calcResult}
      />
    </div>
  );
}
