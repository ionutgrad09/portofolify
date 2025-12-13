import { formatEUR } from "../utils/utils";
import React from "react";

interface TooltipPayload {
  name: string;
  value: number;
  color: string;
  payload: {
    comment?: string;
  };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const entryData = payload[0].payload;
    return (
      <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl shadow-xl">
        <p className="text-slate-300 font-medium mb-2">{label}</p>
        {payload.map((pld, index) => (
          <div key={index} className="flex items-center gap-2 text-sm mb-1" style={{ color: pld.color || "white" }}>
            <span>{pld.name}:</span>
            <span className="font-bold">
              {pld.name.includes('%') ? `${pld.value.toFixed(2)}%` : formatEUR(pld.value)}
            </span>
          </div>
        ))}
        {entryData.comment && (
          <div className="mt-3 pt-2 border-t border-slate-700">
            <p className="text-xs text-slate-400 italic">{entryData.comment}</p>
          </div>
        )}
      </div>
    );
  }
  return null;
};

export default CustomTooltip;