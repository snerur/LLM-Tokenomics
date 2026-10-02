import React from 'react';
import { Download, RotateCcw } from 'lucide-react';

export type ActiveTab = 'simulator' | 'strategies' | 'tco' | 'finops' | 'risks';

interface NavigationProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenExport: () => void;
  onResetDefaults: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  onOpenExport,
  onResetDefaults,
}) => {
  const tabs: { id: ActiveTab; label: string }[] = [
    { id: 'simulator', label: 'Inference Cost Simulator' },
    { id: 'strategies', label: 'Optimization Strategies' },
    { id: 'tco', label: 'API vs Self-Hosted TCO' },
    { id: 'finops', label: 'Organizational FinOps' },
    { id: 'risks', label: 'Risks & Vulnerabilities' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Single text wordmark */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-950/80 border border-cyan-800/60 text-cyan-400 font-mono font-bold text-base shadow-sm">
            Tk
          </div>
          <span className="text-lg font-bold tracking-tight text-white">
            Tokenomics <span className="font-light text-slate-400">Studio</span>
          </span>
        </div>

        {/* Zone 2: Navigation Links / Segmented Tabs */}
        <nav className="hidden lg:flex items-center gap-1 rounded-lg bg-slate-900/90 p-1 border border-slate-800/80">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-slate-800 text-cyan-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Zone 3: Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onResetDefaults}
            title="Reset simulation parameters to enterprise baseline"
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
          <button
            onClick={onOpenExport}
            className="flex items-center gap-1.5 rounded-lg bg-cyan-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-cyan-500 shadow-sm transition-colors whitespace-nowrap"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Mobile nav row */}
      <div className="lg:hidden border-t border-slate-800/80 bg-slate-900/60 px-4 py-2 overflow-x-auto flex items-center gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              activeTab === tab.id
                ? 'bg-slate-800 text-cyan-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </header>
  );
};
