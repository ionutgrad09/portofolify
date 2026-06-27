import React from 'react';
import { Trophy } from 'lucide-react';
import type { MergedData } from '../types';

const parseDDMMYYYY = (dateStr: string): Date => {
  const [day, month, year] = dateStr.split('.').map(Number);
  return new Date(year, month - 1, day);
};

const MILESTONES = Array.from({ length: (2000000 - 100000) / 25000 + 1 }, (_, i) => 100000 + i * 25000);

const formatK = (v: number) =>
  v >= 1000000 ? `${(v / 1000000).toFixed(v % 1000000 === 0 ? 0 : 1)}M €` : `${v / 1000}k €`;

interface Props { mergedData: MergedData[] }

const MilestoneTimeline: React.FC<Props> = ({ mergedData }) => {
  if (!mergedData || mergedData.length < 2) return null;

  const sorted = [...mergedData].sort(
    (a, b) => parseDDMMYYYY(a.date).getTime() - parseDDMMYYYY(b.date).getTime()
  );

  const currentWealth = sorted[sorted.length - 1].netWorth;

  const crossed: { target: number; date: string; daysFromPrev: number | null }[] = [];
  let prevDate: Date | null = null;

  for (const milestone of MILESTONES) {
    const entry = sorted.find(e => e.netWorth >= milestone);
    if (!entry) break;
    const d = parseDDMMYYYY(entry.date);
    const daysFromPrev = prevDate
      ? Math.round((d.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24))
      : null;
    crossed.push({ target: milestone, date: entry.date, daysFromPrev });
    prevDate = d;
  }

  const next = MILESTONES.find(m => m > currentWealth);
  const all = next ? [...crossed, { target: next, date: null as any, daysFromPrev: null }] : crossed;

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-slate-800">
      <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
        <Trophy className="text-yellow-400" size={24} />
        Timeline Milestone-uri
      </h2>
      <p className="text-xs text-slate-500 mb-6">
        Când ai atins fiecare prag de avere și cât timp a durat între ele.
      </p>

      {/* ── DESKTOP: horizontal ── */}
      <div className="hidden md:block overflow-x-auto pb-4">
        <div className="flex items-start gap-0 min-w-max">
          {all.map((m, i) => {
            const isCurrent = i === crossed.length - 1;
            const isNext = !m.date;
            const isLast = i === all.length - 1;

            return (
              <div key={m.target} className="flex items-start">
                <div className="flex flex-col items-center w-32">
                  {/* Amount */}
                  <span className={`text-xs font-bold mb-2 ${isNext ? 'text-yellow-400' : 'text-emerald-400'}`}>
                    {formatK(m.target)}
                  </span>

                  {/* Dot */}
                  <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                    isNext
                      ? 'bg-yellow-400 border-yellow-400 shadow-[0_0_10px_#facc15]'
                      : 'bg-emerald-500 border-emerald-500'
                  }`} />

                  {/* Date + days + badge */}
                  <div className="flex flex-col items-center mt-2 gap-0.5 text-center">
                    {m.date ? (
                      <span className="text-xs text-slate-300 font-medium">{m.date}</span>
                    ) : (
                      <span className="text-xs text-yellow-400 font-medium">
                        rămas €{Math.round(m.target - currentWealth).toLocaleString('ro-RO')}
                      </span>
                    )}
                    {m.daysFromPrev !== null && (
                      <span className="text-[10px] text-slate-500">+{m.daysFromPrev}z</span>
                    )}
                    {isCurrent && (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full mt-0.5">
                        Curent
                      </span>
                    )}
                    {isNext && (
                      <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded-full mt-0.5">
                        Următor
                      </span>
                    )}
                  </div>
                </div>

                {/* Connector */}
                {!isLast && (
                  <div className={`mt-[22px] h-0.5 w-8 flex-shrink-0 ${
                    isNext ? 'border-t-2 border-dashed border-yellow-500/40' : 'bg-slate-600'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── MOBILE: vertical ── */}
      <div className="md:hidden relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-700" />
        <div className="space-y-3">
          {all.map((m, i) => {
            const isCurrent = i === crossed.length - 1;
            const isNext = !m.date;
            return (
              <div key={m.target} className="relative flex items-start gap-3 pl-10">
                <div className={`absolute left-3 top-2 w-3 h-3 rounded-full border-2 ${
                  isNext
                    ? 'bg-yellow-400 border-yellow-400 shadow-[0_0_8px_#facc15]'
                    : 'bg-emerald-500 border-emerald-500'
                }`} />
                <div className={`flex-1 rounded-xl px-3 py-2.5 flex justify-between items-center gap-2 ${
                  isNext ? 'bg-yellow-500/5 border border-dashed border-yellow-500/30' : 'bg-slate-800/50'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${isNext ? 'text-yellow-400' : 'text-emerald-400'}`}>
                      {formatK(m.target)}
                    </span>
                    {isCurrent && <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 rounded-full">Curent</span>}
                    {isNext && <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-1.5 rounded-full">Următor</span>}
                  </div>
                  <div className="text-right">
                    {m.date
                      ? <p className="text-xs text-slate-300">{m.date}</p>
                      : <p className="text-xs text-yellow-400/70">-€{Math.round(m.target - currentWealth).toLocaleString('ro-RO')}</p>
                    }
                    {m.daysFromPrev !== null && (
                      <p className="text-[10px] text-slate-500">+{m.daysFromPrev} zile</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MilestoneTimeline;
