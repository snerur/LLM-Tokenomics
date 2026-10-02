import React, { useState, useEffect } from 'react';
import { RISK_SCENARIOS } from '../data/governanceAndRisks';
import { RiskScenario } from '../types/tokenomics';
import { ShieldAlert, Play, Square, RefreshCw, Lock, ZapOff, CheckCircle2 } from 'lucide-react';

export const RisksAndMitigation: React.FC = () => {
  const [selectedRisk, setSelectedRisk] = useState<RiskScenario>(RISK_SCENARIOS[0]);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationSeconds, setSimulationSeconds] = useState<number>(0);
  const [unmitigatedLoss, setUnmitigatedLoss] = useState<number>(0);
  const [mitigatedLoss, setMitigatedLoss] = useState<number>(0);
  const [circuitTripped, setCircuitTripped] = useState<boolean>(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSimulating) {
      interval = setInterval(() => {
        setSimulationSeconds((prev) => {
          const nextSec = prev + 1;
          // Unmitigated burns ~$45/sec
          setUnmitigatedLoss((loss) => loss + 45 + Math.random() * 15);

          // Mitigated gets capped when circuit trips at 3 seconds
          if (nextSec >= 3) {
            setCircuitTripped(true);
            // Capped at ~$120 total
          } else {
            setMitigatedLoss((loss) => loss + 40);
          }

          if (nextSec >= 15) {
            setIsSimulating(false);
          }
          return nextSec;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isSimulating]);

  const handleStartSimulation = () => {
    setSimulationSeconds(0);
    setUnmitigatedLoss(0);
    setMitigatedLoss(0);
    setCircuitTripped(false);
    setIsSimulating(true);
  };

  const handleStopSimulation = () => {
    setIsSimulating(false);
  };

  const formatUSD = (val: number): string => {
    return `$${Math.round(val).toLocaleString()}`;
  };

  return (
    <div className="space-y-8">
      {/* Editorial Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-rose-400 font-mono">
          <span>Deployment Vulnerability Assessment</span>
          <span aria-hidden="true">·</span>
          <span>Attack Vectors</span>
          <span aria-hidden="true">·</span>
          <span>Circuit Breakers</span>
        </div>
        <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Inference Risks, Attacks &amp; Guardrail Engineering
        </h1>
        <p className="mt-2 text-sm text-slate-400 max-w-3xl">
          Unlike traditional software where compute spikes translate to minor CPU load, unbounded LLM deployments can incur tens of thousands of dollars in minutes through malicious prompt injections or broken autonomous loops.
        </p>
      </div>

      {/* Interactive Attack & Runaway Stress Tester */}
      <div className="rounded-xl border border-rose-900/50 bg-gradient-to-br from-slate-900 via-slate-900 to-rose-950/20 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-950/80 border border-rose-800/80 text-rose-400">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Live Incident Simulator: Denial of Wallet (DoW) Runaway Loop
              </h2>
              <span className="text-xs text-slate-400">
                Simulate 200 concurrent unauthenticated rogue requests triggering recursive reasoning loops
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isSimulating ? (
              <button
                onClick={handleStartSimulation}
                className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-rose-500 shadow-sm transition-colors"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>Simulate Incident</span>
              </button>
            ) : (
              <button
                onClick={handleStopSimulation}
                className="flex items-center gap-1.5 rounded-lg bg-slate-800 border border-slate-700 px-3.5 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
              >
                <Square className="h-3.5 w-3.5" />
                <span>Halt Simulation</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Counters */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-lg bg-slate-950/80 border border-slate-800 p-4">
            <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">
              Simulation Timer
            </span>
            <span className="text-2xl font-bold font-mono text-white tabular-nums">
              {simulationSeconds}s {isSimulating && <span className="text-xs text-rose-400 font-normal">Active...</span>}
            </span>
            <span className="text-[11px] text-slate-400 block mt-1">
              200 rogue requests @ 16k tokens each
            </span>
          </div>

          <div className="rounded-lg bg-slate-950/80 border border-rose-950 p-4">
            <span className="text-[10px] uppercase font-mono text-rose-400 block mb-1">
              Unmitigated Financial Damage
            </span>
            <span className="text-2xl font-bold font-mono text-rose-400 tabular-nums">
              {formatUSD(unmitigatedLoss)}
            </span>
            <span className="text-[11px] text-slate-400 block mt-1">
              No max_token limit or circuit breaker
            </span>
          </div>

          <div className="rounded-lg bg-slate-950/80 border border-emerald-950 p-4">
            <span className="text-[10px] uppercase font-mono text-emerald-400 block mb-1">
              Protected Spend (With Circuit Breakers)
            </span>
            <span className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
              {formatUSD(mitigatedLoss)}
            </span>
            <div className="flex items-center gap-1.5 text-[11px] mt-1">
              {circuitTripped ? (
                <span className="text-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Circuit tripped at 3s · Saved {formatUSD(Math.max(0, unmitigatedLoss - mitigatedLoss))}
                </span>
              ) : (
                <span className="text-slate-400">Monitoring threshold (1,000 req/min cap)</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4 Core Inference Risk Dossiers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Risk Selection list (4 cols) */}
        <div className="lg:col-span-4 space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
            Vulnerability Matrix
          </span>
          {RISK_SCENARIOS.map((risk) => {
            const isSelected = selectedRisk.id === risk.id;
            return (
              <button
                key={risk.id}
                onClick={() => setSelectedRisk(risk)}
                className={`w-full text-left p-3.5 rounded-lg border transition-all ${
                  isSelected
                    ? 'border-rose-500/80 bg-rose-950/30 text-white shadow-sm'
                    : 'border-slate-800 bg-slate-900/40 text-slate-300 hover:border-slate-700 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                  <span className="text-slate-400">{risk.category}</span>
                  <span
                    className={
                      risk.severity === 'Critical'
                        ? 'text-rose-400 font-semibold'
                        : 'text-amber-400 font-semibold'
                    }
                  >
                    {risk.severity}
                  </span>
                </div>
                <div className="text-xs font-semibold text-slate-200">{risk.title}</div>
              </button>
            );
          })}
        </div>

        {/* Right: Detailed Risk Dossier & Hardened Architecture (8 cols) */}
        <div className="lg:col-span-8 rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-5">
          <div className="border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <span>{selectedRisk.category}</span>
              <span aria-hidden="true">·</span>
              <span className={selectedRisk.severity === 'Critical' ? 'text-rose-400 font-bold' : 'text-amber-400 font-bold'}>
                Severity: {selectedRisk.severity}
              </span>
            </div>
            <h2 className="mt-1 text-lg font-bold text-white">
              {selectedRisk.title}
            </h2>
          </div>

          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
              Vulnerability Mechanics
            </span>
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/70 p-3 rounded-lg border border-slate-800">
              {selectedRisk.vulnerabilityDescription}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-lg border border-rose-950 bg-rose-950/20">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-400 block mb-1">
                Potential Financial Exposure
              </span>
              <p className="text-xs text-slate-200 font-mono">
                {selectedRisk.unmitigatedFinancialImpact}
              </p>
            </div>

            <div className="p-3.5 rounded-lg border border-cyan-950 bg-cyan-950/20">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-cyan-400 block mb-1">
                Mitigation Strategy
              </span>
              <p className="text-xs text-slate-200">
                {selectedRisk.mitigationStrategy}
              </p>
            </div>
          </div>

          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
              Technical Gateway Guardrail
            </span>
            <div className="rounded-lg bg-slate-950 p-3 border border-slate-800 font-mono text-xs text-emerald-400 flex items-start gap-2">
              <Lock className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
              <span>{selectedRisk.technicalGuardrail}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
