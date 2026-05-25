'use client';
import { useState } from 'react';
import { createClient } from '@/utils/supabase/client'; // <-- Adjust this path if needed

// 1. Define the shape of your Trade object for TypeScript
export interface Trade {
  ticket_id: string | number;
  ticker: string;
  direction: 'BUY' | 'SELL' | string;
  lots: number;
  close_time: string | Date;
  net_pnl: number;
  notes?: string; // The "?" means this field might be empty/optional
  screenshot_url?: string;
}

// 2. Define the props the component expects to receive
interface TradeSlideOutProps {
  trade: Trade | null;
  onClose: () => void;
}

export default function TradeSlideOut({ trade, onClose }: TradeSlideOutProps) {
  const [notes, setNotes] = useState<string>(trade?.notes || '');
  const [screenshot, setScreenshot] = useState<string>(trade?.screenshot_url || '');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Initialize Supabase client
  const supabase = createClient();

  if (!trade) return null;

  const handleSave = async () => {
    setIsSaving(true);
    const { error } = await supabase
      .from('trades')
      .update({ notes: notes, screenshot_url: screenshot })
      .eq('ticket_id', trade.ticket_id);
    
    setIsSaving(false);
    if (!error) {
      onClose(); // Close panel on success
    } else {
      console.error("Failed to save trade details:", error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity">
      {/* Slide-out Panel - Styled to match your dark theme */}
      <div className="w-full max-w-xl h-full bg-[#0B1221] border-l border-slate-800 p-8 flex flex-col overflow-y-auto text-slate-300 shadow-2xl animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">{trade.ticker}</h2>
            <p className="text-sm text-slate-400 mt-1 font-medium">
              <span className={trade.direction === 'BUY' ? 'text-emerald-400' : 'text-red-400'}>
                {trade.direction}
              </span> 
              <span className="mx-2">•</span> {trade.lots} lots 
              <span className="mx-2">•</span> {new Date(trade.close_time).toLocaleString()}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-500 hover:text-white transition-colors bg-slate-800/50 hover:bg-slate-800 p-2 rounded-full"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* PnL Banner */}
        <div className={`p-4 rounded-xl mb-8 flex justify-between items-center font-semibold border ${Number(trade.net_pnl) >= 0 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
          <span className="text-sm uppercase tracking-wider opacity-80">Net PnL</span>
          <span className="text-xl">{Number(trade.net_pnl) >= 0 ? '+' : ''}${Number(trade.net_pnl).toFixed(2)}</span>
        </div>

        {/* Screenshot Input & Display */}
        <div className="mb-8">
          <label className="block text-sm font-semibold mb-2 text-slate-300">TradingView Image URL</label>
          <input 
            type="url" 
            placeholder="https://www.tradingview.com/x/..." 
            value={screenshot}
            onChange={(e) => setScreenshot(e.target.value)}
            className="w-full bg-[#131B2C] border border-slate-700/50 rounded-lg p-3 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
          />
          {screenshot && (
            <div className="mt-4 rounded-xl overflow-hidden border border-slate-700/50 shadow-lg bg-[#131B2C]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={screenshot} alt="Trade Chart Screenshot" className="w-full h-auto object-cover" />
            </div>
          )}
        </div>

        {/* Journal Notes */}
        <div className="mb-8 flex-grow">
          <label className="block text-sm font-semibold mb-2 text-slate-300">Execution Notes & Context</label>
          <textarea 
            rows={8}
            placeholder="What was the setup? Did you follow your edge? How was your psychology?"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-[#131B2C] border border-slate-700/50 rounded-lg p-4 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm resize-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-auto pt-6 border-t border-slate-800/50">
          <button 
            onClick={onClose} 
            className="flex-1 py-3 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 font-medium transition-all"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave} 
            disabled={isSaving} 
            className="flex-1 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-[0_0_15px_rgba(37,99,235,0.3)] transition-all disabled:opacity-50 disabled:shadow-none"
          >
            {isSaving ? 'Saving...' : 'Save Trade Context'}
          </button>
        </div>

      </div>
    </div>
  );
}