import React from 'react';
import {
   Activity, RefreshCcw
} from 'lucide-react';

interface EmptyStateProps {
  onSync: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onSync }) => (
  <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 flex items-center justify-center">
    <div className="bg-slate-900/50 p-12 rounded-3xl border border-slate-800 max-w-lg shadow-2xl backdrop-blur-xl text-center">
      <div className="mb-6 flex justify-center">
        <div className="bg-slate-800 p-4 rounded-full">
          <Activity className="text-blue-400 w-16 h-16" />
        </div>
      </div>
      <h1 className="text-3xl font-bold text-white mb-4">Nu există date</h1>
      <p className="text-slate-400 mb-8 text-lg">Importă date direct din Google Sheets.</p>
      <button onClick={onSync} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 mx-auto">
        <RefreshCcw size={20} />
        Actualizează Datele
      </button>
    </div>
  </div>
);

export default EmptyState;