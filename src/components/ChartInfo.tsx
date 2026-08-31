import React, { useState, useRef, useEffect } from 'react';
import { Info } from 'lucide-react';

interface Props {
  text: string;
}

const ChartInfo: React.FC<Props> = ({ text }) => {
  const [visible, setVisible] = useState(false);
  const [above, setAbove] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (visible && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setAbove(rect.bottom + 200 > window.innerHeight);
    }
  }, [visible]);

  return (
    <div className="relative inline-flex items-center ml-1.5" ref={ref}>
      <button
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        className="text-slate-500 hover:text-slate-300 transition-colors focus:outline-none"
        aria-label="Informații grafic"
      >
        <Info size={15} />
      </button>
      {visible && (
        <div
          className={`absolute z-50 left-6 ${above ? 'bottom-0' : 'top-0'} w-72 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl p-3 text-xs text-slate-300 leading-relaxed pointer-events-none`}
        >
          {text}
        </div>
      )}
    </div>
  );
};

export default ChartInfo;
