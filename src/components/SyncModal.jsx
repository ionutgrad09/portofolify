import React from 'react';
import {
  X,
  RefreshCcw
} from 'lucide-react';


const SyncModal = ({isOpen, status, onClose}) => {
  if (!isOpen) {
    return null;
  }

  const isError = status.includes("Eroare");
  const isSuccess = status.includes("succes");

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div
        className={`bg-slate-900 rounded-2xl p-8 max-w-sm w-full border shadow-2xl ${isError ? 'border-red-500' : isSuccess ? 'border-green-500' : 'border-blue-500'}`}>
        <div className="flex flex-col items-center text-center">
          {!isError && !isSuccess && <RefreshCcw size={32} className="text-blue-400 animate-spin mb-4"/>}
          {isError && <X size={32} className="text-red-500 mb-4"/>}
          {isSuccess && (
            <svg className="w-8 h-8 text-green-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          )}
          <h3 className={`text-xl font-bold mb-2 ${isError ? 'text-red-400' : 'text-white'}`}>
            {isError ? 'Eroare Sincronizare' : isSuccess ? 'Finalizat!' : 'Sincronizare Date...'}
          </h3>
          <p className="text-slate-300 mb-6">{status}</p>
          <div className="w-full bg-slate-700 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full ${isError ? 'bg-red-500' : isSuccess ? 'bg-green-500' : 'bg-blue-500'}`}
              style={{
                width: isSuccess || isError ? '100%' : status.startsWith("4/") ? '100%' : status.startsWith("3/") ? '75%' : status.startsWith("2/") ? '50%' : '25%'
              }}
            ></div>
          </div>
          {isError && (
            <button onClick={onClose}
                    className="mt-6 w-full px-4 py-3 rounded-xl bg-slate-700 text-white font-semibold hover:bg-slate-600">
              Închide
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SyncModal;