"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MousePointer2, LineChart, Square, Minus as MinusIcon, Trash2,
} from "lucide-react";
import type { Candle, Position } from "@/app/markets/[id]/AssetView";

// --- TYPES ---
type Drawing =
  | { id: string; type: "hline"; price: number }
  | { id: string; type: "trend" | "rect"; x1: number; y1: number; x2: number; y2: number };

const TIMEFRAMES = ["1m", "5m", "15m", "1H", "4H", "1D"];

function generateMockCandles(symbol: string, timeframe: string, count = 60): Candle[] {
  let seed = 0;
  const s = symbol + timeframe;
  for (let i = 0; i < s.length; i++) seed += s.charCodeAt(i) * (i + 1);

  let price = symbol.includes("USD") && !symbol.includes("BTC") ? 1.2280 : 64000;
  if (symbol === "CHRBLF") price = 42;

  const candles: Candle[] = [];
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const r1 = ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    const r2 = ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    const open = price;
    const move = (r1 - 0.45) * (price * 0.015);
    const close = open + move;
    const high = Math.max(open, close) + r2 * price * 0.005;
    const low = Math.min(open, close) - r2 * price * 0.005;
    price = close;
    candles.push({
      time: now - (count - i) * 60000,
      open, high, low, close,
      pattern: { name: "—", bias: "neutral" },
    });
  }
  return candles;
}

export default function WelltradeTerminal({
  coin, positions, onClosePosition, onPlaceTrade,
}: {
  coin: any;
  positions: Position[];
  onClosePosition: (id: string) => void;
  onPlaceTrade?: (side: "buy" | "sell") => void;
}) {
  const [timeframe, setTimeframe] = useState("1H");
  const [candles, setCandles] = useState<Candle[]>([]);
  const [isTableOpen, setIsTableOpen] = useState(true);

  const [activeTool, setActiveTool] = useState<"cursor" | "trend" | "hline" | "rect">("cursor");
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [pending, setPending] = useState<{ type: "trend" | "rect"; x1: number; y1: number; x2: number; y2: number } | null>(null);
  
  const [selectedDrawingId, setSelectedDrawingId] = useState<string | null>(null);
  const [draggingState, setDraggingState] = useState<{ id: string; handle: "body" | "p1" | "p2"; startX: number; startY: number; initialDrawing: Drawing } | null>(null);

  const [hoveredCandle, setHoveredCandle] = useState<Candle | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isMounted, setIsMounted] = useState(false);

  const geom = useRef({ high: 1, low: 0, range: 1, width: 1, height: 1 });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const watermarks = useMemo(() => {
    const symbols = ["$", "€", "£", "¥", "₦", "₿", "Ξ", "Ð"];
    return Array.from({ length: 12 }).map((_, i) => ({
      id: i,
      symbol: symbols[i % symbols.length],
      top: `${(i * 31) % 85}%`,
      left: `${(i * 47) % 90}%`,
      rotate: `${(i * 25) - 50}deg`,
      scale: 1 + (i % 3) * 0.4,
    }));
  }, []);

  useEffect(() => {
    setCandles(generateMockCandles(coin.symbol.toUpperCase() + "USD", timeframe));
    setDrawings([]);
    setPending(null);
    setSelectedDrawingId(null);
  }, [coin.symbol, timeframe]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCandles(prev => {
        if (!prev.length) return prev;
        const next = [...prev];
        const last = { ...next[next.length - 1] };
        const vol = coin.current_price * 0.002;
        last.close += (Math.random() - 0.5) * vol;
        last.high = Math.max(last.high, last.close);
        last.low = Math.min(last.low, last.close);
        next[next.length - 1] = last;

        const tfMs = { "1m": 60_000, "5m": 300_000, "15m": 900_000, "1H": 3_600_000, "4H": 14_400_000, "1D": 86_400_000 }[timeframe] ?? 3_600_000;
        if (Date.now() - last.time > tfMs) {
          next.push({ ...last, time: last.time + tfMs, open: last.close, high: last.close, low: last.close, close: last.close });
          next.shift();
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [coin.current_price, timeframe]);

  const highPrice = candles.length ? Math.max(...candles.map(c => c.high)) * 1.001 : 100;
  const lowPrice = candles.length ? Math.min(...candles.map(c => c.low)) * 0.999 : 0;
  const priceRange = highPrice - lowPrice || 1;

  const toPercentY = useCallback((price: number) => ((highPrice - price) / priceRange) * 100, [highPrice, priceRange]);
  const toPrice = useCallback((yPx: number, height: number) => highPrice - (yPx / height) * priceRange, [highPrice, priceRange]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "Delete" || e.key === "Backspace") && selectedDrawingId) {
        setDrawings(d => d.filter(item => item.id !== selectedDrawingId));
        setSelectedDrawingId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedDrawingId]);

  const handleDeleteSelected = () => {
    if (selectedDrawingId) {
      setDrawings(d => d.filter(item => item.id !== selectedDrawingId));
      setSelectedDrawingId(null);
    }
  };

  const handleSvgMouseDown = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xPx = e.clientX - rect.left;
    const yPx = e.clientY - rect.top;
    const fracX = xPx / rect.width;
    const price = toPrice(yPx, rect.height);

    if (activeTool === "cursor") {
      if (selectedDrawingId && !(e.target as HTMLElement).closest("[data-drawing]")) {
        setSelectedDrawingId(null);
      }
      return;
    }

    if (activeTool === "hline") {
      setDrawings(d => [...d, { id: Date.now().toString(), type: "hline", price }]);
      setActiveTool("cursor");
      return;
    }

    if (!pending) {
      setPending({ type: activeTool, x1: fracX, y1: price, x2: fracX, y2: price });
    } else {
      const newDrawing: Drawing = {
        id: Date.now().toString(),
        type: pending.type,
        x1: pending.x1,
        y1: pending.y1,
        x2: fracX,
        y2: price,
      };
      setDrawings(d => [...d, newDrawing]);
      setPending(null);
      setActiveTool("cursor");
      setSelectedDrawingId(newDrawing.id);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xPx = e.clientX - rect.left;
    const yPx = e.clientY - rect.top;
    setMousePos({ x: xPx, y: yPx });
    const idx = Math.floor((xPx / rect.width) * candles.length);
    if (candles[idx]) setHoveredCandle(candles[idx]);

    if (pending) {
      const price = toPrice(yPx, rect.height);
      setPending({ ...pending, x2: xPx / rect.width, y2: price });
    }

    if (draggingState) {
      const dx = (xPx - draggingState.startX) / rect.width;
      const dyPx = yPx - draggingState.startY;
      const dPrice = -(dyPx / rect.height) * priceRange;
      const init = draggingState.initialDrawing;

      setDrawings(prev => prev.map(d => {
        if (d.id !== draggingState.id) return d;
        if (d.type === "hline" && init.type === "hline") {
          return { ...d, price: init.price + dPrice };
        }
        if (d.type === "trend" && init.type === "trend") {
          if (draggingState.handle === "body") {
            return {
              ...d,
              x1: Math.max(0, Math.min(1, init.x1 + dx)),
              x2: Math.max(0, Math.min(1, init.x2 + dx)),
              y1: init.y1 + dPrice,
              y2: init.y2 + dPrice,
            };
          } else if (draggingState.handle === "p1") {
            return { ...d, x1: Math.max(0, Math.min(1, init.x1 + dx)), y1: init.y1 + dPrice };
          } else if (draggingState.handle === "p2") {
            return { ...d, x2: Math.max(0, Math.min(1, init.x2 + dx)), y2: init.y2 + dPrice };
          }
        }
        if (d.type === "rect" && init.type === "rect") {
          if (draggingState.handle === "body") {
            return {
              ...d,
              x1: Math.max(0, Math.min(1, init.x1 + dx)),
              x2: Math.max(0, Math.min(1, init.x2 + dx)),
              y1: init.y1 + dPrice,
              y2: init.y2 + dPrice,
            };
          } else if (draggingState.handle === "p1") {
            return { ...d, x1: Math.max(0, Math.min(1, init.x1 + dx)), y1: init.y1 + dPrice };
          } else if (draggingState.handle === "p2") {
            return { ...d, x2: Math.max(0, Math.min(1, init.x2 + dx)), y2: init.y2 + dPrice };
          }
        }
        return d;
      }));
    }
  };

  const handleMouseUp = () => {
    setDraggingState(null);
  };

  const handleLeave = () => {
    setHoveredCandle(null);
    setPending(null);
    setDraggingState(null);
  };

  const activePositions = positions.filter(p => p.status === "open");
  const equity = 10000 + activePositions.reduce((a, p) => a + p.pnl, 0);

  if (!isMounted) return null;

  return (
    <div className="flex flex-col h-full w-full font-sans overflow-hidden bg-[#f0fdf4] dark:bg-[#050806] relative" onMouseUp={handleMouseUp}>
      
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {watermarks.map((w) => (
          <div
            key={w.id}
            className="absolute text-5xl md:text-7xl font-bold font-mono text-lime-900/[0.04] dark:text-lime-100/[0.02] select-none transition-transform duration-500"
            style={{
              top: w.top,
              left: w.left,
              transform: `rotate(${w.rotate}) scale(${w.scale})`,
            }}
          >
            {w.symbol}
          </div>
        ))}
      </div>

      {/* 1. WELLTRADE STATS BAR */}
      <div className="h-12 border-b border-lime-500/20 dark:border-lime-500/10 flex items-center justify-between px-4 shrink-0 bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-md z-10 shadow-[0_8px_32px_0_rgba(132,204,22,0.05)]">
        <div className="flex items-center gap-2">
          <span className="font-extrabold tracking-wider text-lime-950 dark:text-lime-400 text-xs font-mono"> WELLTRADE</span>
          <span className="text-lime-500/30">|</span>
          <div className="flex gap-6 text-xs font-mono">
            <div><span className="text-lime-700 dark:text-lime-300/60">Balance:</span> <span className="text-lime-950 dark:text-white font-bold">$10,000.00</span></div>
            <div><span className="text-lime-700 dark:text-lime-300/60">Equity:</span> <span className={equity >= 10000 ? "text-green-500 font-bold" : "text-red-500 font-bold"}>${equity.toFixed(2)}</span></div>
            <div><span className="text-lime-700 dark:text-lime-300/60">Open PnL:</span> <span className={equity >= 10000 ? "text-green-500 font-bold" : "text-red-500 font-bold"}>${(equity - 10000).toFixed(2)}</span></div>
          </div>
        </div>
        
        <div className="relative flex items-center">
          <select 
            onChange={(e) => {
              const action = e.target.value;
              if (action === "buy") onPlaceTrade?.("buy");
              if (action === "sell") onPlaceTrade?.("sell");
              e.target.value = "";
            }}
            className="appearance-none bg-transparent text-lime-600 dark:text-lime-400 font-bold outline-none cursor-pointer pl-2 pr-7 py-2 text-xs"
            defaultValue=""
          >
            <option value="" disabled>   </option>
            <option value="buy">Buy</option>
            <option value="sell">Sell</option>
          </select>
          
          <svg 
            className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-lime-600 dark:text-lime-400 opacity-80" 
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
          >
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative z-10">
        <div className="flex-1 flex flex-col min-w-0">

          {/* CHART TOOLBAR */}
          <div className="h-12 border-b border-lime-500/20 dark:border-lime-500/10 bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-md flex items-center justify-between px-4 shrink-0">
            <div className="flex items-center gap-1">
              {[
                { key: "cursor" as const, icon: MousePointer2 },
                { key: "trend" as const, icon: LineChart },
                { key: "hline" as const, icon: MinusIcon },
                { key: "rect" as const, icon: Square },
              ].map(({ key, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => { setActiveTool(key); setPending(null); }}
                  className={`p-2 rounded-xl transition-colors ${activeTool === key ? "bg-lime-500/20 text-lime-700 dark:text-lime-400" : "text-lime-800/60 dark:text-lime-300/60 hover:text-lime-950 dark:hover:text-white"}`}
                >
                  <Icon size={18} />
                </button>
              ))}
              <div className="w-px h-5 bg-lime-500/20 dark:bg-lime-500/10 mx-2" />
              
              <button 
                onClick={handleDeleteSelected} 
                disabled={!selectedDrawingId}
                title={selectedDrawingId ? "Delete selected drawing" : "Click a drawing on the chart first to select it for deletion"}
                className={`p-2 rounded-xl transition-colors flex items-center gap-1.5 ${selectedDrawingId ? "bg-red-500/20 text-red-500 hover:bg-red-500/30 cursor-pointer" : "text-lime-800/30 dark:text-lime-300/20 cursor-not-allowed"}`}
              >
                <Trash2 size={18} />
                <span className="text-xs font-mono font-bold">Delete</span>
              </button>

              <button 
                onClick={() => { setDrawings([]); setPending(null); setSelectedDrawingId(null); }} 
                title="Clear all drawings"
                className="p-2 text-lime-800/60 dark:text-lime-300/60 hover:text-red-500 rounded-xl transition-colors text-xs font-bold font-mono ml-2"
              >
                Clear All
              </button>
            </div>

            <div className="flex bg-[#f4fbf5] dark:bg-[#050806] rounded-xl border border-lime-500/30 dark:border-lime-500/20 p-1">
              {TIMEFRAMES.map(tf => (
                <button key={tf} onClick={() => setTimeframe(tf)} className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${timeframe === tf ? "bg-lime-600 text-white shadow-sm" : "text-lime-800/60 dark:text-lime-300/60 hover:text-lime-950 dark:hover:text-white"}`}>
                  {tf}
                </button>
              ))}
            </div>
          </div>

          {/* CHART CANVAS */}
          <div className="flex-1 relative cursor-crosshair overflow-hidden flex flex-col">
            <div className="flex-1 relative">
              <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-5" style={{ backgroundImage: "linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

              <svg
                className="w-full h-full absolute inset-0"
                onMouseMove={handleMouseMove}
                onMouseDown={handleSvgMouseDown}
                onMouseLeave={handleLeave}
                viewBox="0 0 1000 1000"
                preserveAspectRatio="none"
              >
                {[0, 0.25, 0.5, 0.75, 1].map(r => (
                  <text key={r} x="95%" y={`${r * 100}%`} fill="currentColor" className="text-lime-800/40 dark:text-lime-200/30 font-mono" fontSize="11">
                    {coin.symbol === "BTC" ? "$" : ""}{(highPrice - r * priceRange).toFixed(2)}
                  </text>
                ))}

                <g opacity="0.15">
                  {[20, 40, 60, 80].map(p => (
                    <line key={p} x1={`${p}%`} y1="0%" x2={`${p}%`} y2="100%" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" className="text-lime-900 dark:text-lime-100" />
                  ))}
                </g>

                {drawings.map(d => {
                  const isSelected = selectedDrawingId === d.id;
                  const strokeColor = isSelected ? "#ef4444" : (d.type === "hline" ? "#f0b429" : d.type === "trend" ? "#38bdf8" : "#a78bfa");

                  if (d.type === "hline") {
                    const y = toPercentY(d.price);
                    return (
                      <g key={d.id} data-drawing="true" className="cursor-pointer" onMouseDown={(e) => {
                        e.stopPropagation();
                        setSelectedDrawingId(d.id);
                        setDraggingState({ id: d.id, handle: "body", startX: e.clientX, startY: e.clientY, initialDrawing: d });
                      }}>
                        <line x1="0%" y1={`${y}%`} x2="100%" y2={`${y}%`} stroke={strokeColor} strokeWidth={isSelected ? "3" : "1.5"} strokeDasharray="4 4" />
                        {isSelected && (
                          <circle cx="50%" cy={`${y}%`} r="5" fill="#ef4444" stroke="#fff" strokeWidth="2" />
                        )}
                      </g>
                    );
                  }

                  if (d.type === "trend") {
                    const x1 = d.x1 * 100;
                    const y1 = toPercentY(d.y1);
                    const x2 = d.x2 * 100;
                    const y2 = toPercentY(d.y2);
                    return (
                      <g key={d.id} data-drawing="true" className="cursor-pointer">
                        <line 
                          x1={`${x1}%`} y1={`${y1}%`} x2={`${x2}%`} y2={`${y2}%`} 
                          stroke={strokeColor} strokeWidth={isSelected ? "4" : "2"} 
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            setSelectedDrawingId(d.id);
                            setDraggingState({ id: d.id, handle: "body", startX: e.clientX, startY: e.clientY, initialDrawing: d });
                          }}
                        />
                        {isSelected && (
                          <>
                            <circle 
                              cx={`${x1}%`} cy={`${y1}%`} r="6" fill="#ef4444" stroke="#fff" strokeWidth="2" className="cursor-grab active:cursor-grabbing"
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                setDraggingState({ id: d.id, handle: "p1", startX: e.clientX, startY: e.clientY, initialDrawing: d });
                              }}
                            />
                            <circle 
                              cx={`${x2}%`} cy={`${y2}%`} r="6" fill="#ef4444" stroke="#fff" strokeWidth="2" className="cursor-grab active:cursor-grabbing"
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                setDraggingState({ id: d.id, handle: "p2", startX: e.clientX, startY: e.clientY, initialDrawing: d });
                              }}
                            />
                          </>
                        )}
                      </g>
                    );
                  }

                  const rx1 = Math.min(d.x1, d.x2) * 100;
                  const rx2 = Math.max(d.x1, d.x2) * 100;
                  const ry1 = Math.min(toPercentY(d.y1), toPercentY(d.y2));
                  const ry2 = Math.max(toPercentY(d.y1), toPercentY(d.y2));
                  return (
                    <g key={d.id} data-drawing="true" className="cursor-pointer">
                      <rect
                        x={`${rx1}%`}
                        y={`${ry1}%`}
                        width={`${rx2 - rx1}%`}
                        height={`${ry2 - ry1}%`}
                        stroke={strokeColor} 
                        strokeWidth={isSelected ? "3" : "1.5"} 
                        fill={isSelected ? "rgba(239, 68, 68, 0.2)" : "rgba(167,139,250,0.15)"}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setSelectedDrawingId(d.id);
                          setDraggingState({ id: d.id, handle: "body", startX: e.clientX, startY: e.clientY, initialDrawing: d });
                        }}
                      />
                      {isSelected && (
                        <>
                          <circle 
                            cx={`${rx1}%`} cy={`${ry1}%`} r="5" fill="#ef4444" stroke="#fff" strokeWidth="2" className="cursor-nwse-resize"
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              setDraggingState({ id: d.id, handle: "p1", startX: e.clientX, startY: e.clientY, initialDrawing: d });
                            }}
                          />
                          <circle 
                            cx={`${rx2}%`} cy={`${ry2}%`} r="5" fill="#ef4444" stroke="#fff" strokeWidth="2" className="cursor-nwse-resize"
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              setDraggingState({ id: d.id, handle: "p2", startX: e.clientX, startY: e.clientY, initialDrawing: d });
                            }}
                          />
                        </>
                      )}
                    </g>
                  );
                })}

                {pending && (
                  pending.type === "trend" ? (
                    <line x1={`${pending.x1 * 100}%`} y1={`${toPercentY(pending.y1)}%`} x2={`${pending.x2 * 100}%`} y2={`${toPercentY(pending.y2)}%`} stroke="#f0b429" strokeWidth="1.5" strokeDasharray="2 2" />
                  ) : (
                    <rect
                      x={`${Math.min(pending.x1, pending.x2) * 100}%`}
                      y={`${Math.min(toPercentY(pending.y1), toPercentY(pending.y2))}%`}
                      width={`${Math.abs(pending.x2 - pending.x1) * 100}%`}
                      height={`${Math.abs(toPercentY(pending.y2) - toPercentY(pending.y1))}%`}
                      stroke="#f0b429" strokeWidth="1.5" strokeDasharray="2 2" fill="rgba(240,180,41,0.08)"
                    />
                  )
                )}

                <g>
                  {candles.map((c, i) => {
                    const w = 100 / candles.length;
                    const x = i * w + w * 0.15;
                    const yHigh = toPercentY(c.high);
                    const yLow = toPercentY(c.low);
                    const yOpen = toPercentY(c.open);
                    const yClose = toPercentY(c.close);
                    const isBull = c.close >= c.open;
                    const color = isBull ? "#22c55e" : "#ef4444";
                    const bodyTop = Math.min(yOpen, yClose);
                    const bodyHeight = Math.max(0.5, Math.abs(yClose - yOpen));
                    return (
                      <g key={`${c.time}-${i}`}>
                        <line x1={`${x + w * 0.35}%`} y1={`${yHigh}%`} x2={`${x + w * 0.35}%`} y2={`${yLow}%`} stroke={color} strokeWidth="1" />
                        <rect x={`${x}%`} y={`${bodyTop}%`} width={`${w * 0.7}%`} height={`${bodyHeight}%`} fill={color} />
                      </g>
                    );
                  })}
                </g>
              </svg>

              {selectedDrawingId && (
                <div className="absolute top-4 right-4 bg-red-600/90 text-white px-3 py-1.5 rounded-xl text-xs font-mono shadow-lg backdrop-blur-md z-20 flex items-center gap-2 animate-bounce">
                  <span>Drawing selected! Click Delete button or press Backspace</span>
                  <button 
                    onClick={handleDeleteSelected}
                    className="bg-white text-red-600 font-bold px-2 py-0.5 rounded text-[10px]"
                  >
                    Delete Now
                  </button>
                </div>
              )}

              {/* Floating One-Click Order Widget matching Welltrade style */}
              <div className="absolute top-4 left-4 bg-red-700/90 dark:bg-red-800/90 backdrop-blur-md text-white rounded-xl shadow-2xl p-2.5 flex items-center gap-3 font-mono text-xs select-none z-10 border border-red-500/30">
                <button onClick={() => onPlaceTrade?.("buy")} className="bg-red-800 hover:bg-red-900 px-3 py-1.5 font-bold rounded-lg transition-colors">Buy</button>
                <div className="bg-white/10 px-2 py-1 rounded-md text-[10px]">{timeframe}</div>
                <button onClick={() => onPlaceTrade?.("sell")} className="bg-red-800 hover:bg-red-900 px-3 py-1.5 font-bold rounded-lg transition-colors">Sell</button>
                <div className="text-base font-bold px-2 tracking-tight">488.32</div>
              </div>

              {hoveredCandle && (
                <div
                  className="absolute bg-[#f4fbf5]/95 dark:bg-[#0a0f0b]/95 border border-lime-500/20 p-3 rounded-2xl text-xs font-mono text-lime-900 dark:text-lime-200 pointer-events-none backdrop-blur-md shadow-2xl z-20"
                  style={{ top: Math.min(mousePos.y + 15, 400), left: Math.min(mousePos.x + 15, 300) }}
                >
                  <div className="text-lime-950 dark:text-white font-bold mb-1">{new Date(hoveredCandle.time).toLocaleTimeString()}</div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <span>Open: <span className="text-lime-950 dark:text-white font-bold">{hoveredCandle.open.toFixed(2)}</span></span>
                    <span>High: <span className="text-green-500 font-bold">{hoveredCandle.high.toFixed(2)}</span></span>
                    <span>Low: <span className="text-red-500 font-bold">{hoveredCandle.low.toFixed(2)}</span></span>
                    <span>Close: <span className="text-lime-950 dark:text-white font-bold">{hoveredCandle.close.toFixed(2)}</span></span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 3. BOTTOM TERMINAL */}
          <div className="border-t border-lime-500/20 dark:border-lime-500/10 bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-md flex flex-col shrink-0 z-10">
            <div className="flex items-center justify-between px-4 py-2.5">
              <div className="flex items-center gap-4 text-xs font-bold">
                <span className="text-lime-950 dark:text-white border-b-2 border-lime-600 pb-0.5">Positions ({activePositions.length})</span>
              </div>
              
              <div className="relative flex items-center justify-center">
                <select
                  onChange={(e) => {
                    setIsTableOpen(e.target.value === "open");
                  }}
                  value={isTableOpen ? "open" : "closed"}
                  className="appearance-none bg-transparent text-lime-600 dark:text-lime-400 font-bold outline-none cursor-pointer text-center pl-2 pr-6 py-1 text-xs"
                >
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                </select>

                <svg 
                  className={`absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-lime-600 dark:text-lime-400 opacity-80 transition-transform duration-300 ${isTableOpen ? "rotate-180" : ""}`}
                  width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                >
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </div>
            </div>

            <AnimatePresence>
              {isTableOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="h-40 overflow-auto custom-scrollbar border-t border-lime-500/10">
                    {activePositions.length === 0 ? (
                      <div className="flex h-full items-center justify-center text-lime-800/40 dark:text-lime-300/40 text-sm font-mono">
                        No open positions. Use Trade above.
                      </div>
                    ) : (
                      <table className="w-full text-left text-xs font-mono">
                        <thead className="text-lime-800/60 dark:text-lime-300/60 border-b border-lime-500/10 bg-[#f4fbf5]/50 dark:bg-black/20 sticky top-0 backdrop-blur-md">
                          <tr>
                            <th className="p-2 font-normal">Symbol</th>
                            <th className="p-2 font-normal">Type</th>
                            <th className="p-2 font-normal">Volume</th>
                            <th className="p-2 font-normal">Entry</th>
                            <th className="p-2 font-normal">Current</th>
                            <th className="p-2 font-normal text-right">P&L</th>
                            <th className="p-2 font-normal text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          <AnimatePresence>
                            {activePositions.map(p => (
                              <motion.tr
                                key={p.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="border-b border-lime-500/5 hover:bg-lime-500/5 transition-colors"
                              >
                                <td className="p-2 text-lime-950 dark:text-white font-bold">{p.symbol}</td>
                                <td className={`p-2 font-bold ${p.side === "buy" ? "text-green-500" : "text-red-500"}`}>{p.side.toUpperCase()}</td>
                                <td className="p-2 text-lime-800/70 dark:text-lime-300/70">{p.lots.toFixed(2)}</td>
                                <td className="p-2 text-lime-800/70 dark:text-lime-300/70">{p.entry.toFixed(2)}</td>
                                <td className="p-2 text-lime-800/70 dark:text-lime-300/70">{p.current.toFixed(2)}</td>
                                <td className={`p-2 text-right font-bold ${p.pnl >= 0 ? "text-green-500" : "text-red-500"}`}>
                                  {p.pnl >= 0 ? "+" : ""}{p.pnl.toFixed(2)}
                                </td>
                                <td className="p-2 text-center">
                                  <button onClick={() => onClosePosition(p.id)} className="px-2.5 py-1 bg-lime-100 dark:bg-lime-900/30 hover:bg-lime-200 dark:hover:bg-lime-900/50 rounded-lg text-[10px] font-bold text-lime-700 dark:text-lime-300 transition-colors">
                                    Close
                                  </button>
                                </td>
                              </motion.tr>
                            ))}
                          </AnimatePresence>
                        </tbody>
                      </table>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
// "use client";

// import React, { useState, useEffect, useRef } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import {
//   MousePointer2, LineChart, Square, Minus as MinusIcon, Trash2,
//   ArrowUp, ArrowDown,
// } from "lucide-react";
// import type { Candle, Position } from "@/app/markets/[id]/AssetView";

// // --- TYPES ---
// type Drawing =
//   | { id: string; type: "hline"; price: number }
//   | { id: string; type: "trend" | "rect"; x1: number; y1: number; x2: number; y2: number };

// const TIMEFRAMES = ["1m", "5m", "15m", "1H", "4H", "1D"];

// function generateMockCandles(symbol: string, timeframe: string, count = 60): Candle[] {
//   let seed = 0;
//   const s = symbol + timeframe;
//   for (let i = 0; i < s.length; i++) seed += s.charCodeAt(i) * (i + 1);

//   let price = symbol.includes("USD") && !symbol.includes("BTC") ? 1.08 : 64000;
//   if (symbol === "CHRBLF") price = 42;

//   const candles: Candle[] = [];
//   const now = Date.now();

//   for (let i = 0; i < count; i++) {
//     const r1 = ((seed = (seed * 9301 + 49297) % 233280) / 233280);
//     const r2 = ((seed = (seed * 9301 + 49297) % 233280) / 233280);
//     const open = price;
//     const move = (r1 - 0.45) * (price * 0.015);
//     const close = open + move;
//     const high = Math.max(open, close) + r2 * price * 0.005;
//     const low = Math.min(open, close) - r2 * price * 0.005;
//     price = close;
//     candles.push({
//       time: now - (count - i) * 60000,
//       open, high, low, close,
//       pattern: { name: "—", bias: "neutral" },
//     });
//   }
//   return candles;
// }

// export default function TradingTerminal({
//   coin, positions, onClosePosition, onPlaceTrade,
// }: {
//   coin: any;
//   positions: Position[];
//   onClosePosition: (id: string) => void;
//   onPlaceTrade?: (side: "buy" | "sell") => void;
// }) {
//   const [timeframe, setTimeframe] = useState("1H");
//   const [candles, setCandles] = useState<Candle[]>([]);
//   const [isTableOpen, setIsTableOpen] = useState(true);

//   const [activeTool, setActiveTool] = useState<"cursor" | "trend" | "hline" | "rect">("cursor");
//   const [drawings, setDrawings] = useState<Drawing[]>([]);
//   const [pending, setPending] = useState<{ type: "trend" | "rect"; x1: number; y1: number; x2: number; y2: number } | null>(null);

//   const [hoveredCandle, setHoveredCandle] = useState<Candle | null>(null);
//   const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

//   // chart geometry stored on a ref so click/move handlers stay stable
//   const geom = useRef({ high: 1, low: 0, range: 1, width: 1, height: 1 });

//   useEffect(() => {
//     setCandles(generateMockCandles(coin.symbol.toUpperCase() + "USD", timeframe));
//     setDrawings([]);
//     setPending(null);
//   }, [coin.symbol, timeframe]);

//   // tick: mutate last candle, and roll over when its lifetime exceeds the tf
//   useEffect(() => {
//     const interval = setInterval(() => {
//       setCandles(prev => {
//         if (!prev.length) return prev;
//         const next = [...prev];
//         const last = { ...next[next.length - 1] };
//         const vol = coin.current_price * 0.002;
//         last.close += (Math.random() - 0.5) * vol;
//         last.high = Math.max(last.high, last.close);
//         last.low = Math.min(last.low, last.close);
//         next[next.length - 1] = last;

//         // roll over: if last candle is older than tf, append a fresh one
//         const tfMs = { "1m": 60_000, "5m": 300_000, "15m": 900_000, "1H": 3_600_000, "4H": 14_400_000, "1D": 86_400_000 }[timeframe] ?? 3_600_000;
//         if (Date.now() - last.time > tfMs) {
//           next.push({ ...last, time: last.time + tfMs, open: last.close, high: last.close, low: last.close, close: last.close });
//           next.shift();
//         }
//         return next;
//       });
//     }, 1000);
//     return () => clearInterval(interval);
//   }, [coin.current_price, timeframe]);

//   // bounds + cache
//   const highPrice = candles.length ? Math.max(...candles.map(c => c.high)) * 1.001 : 100;
//   const lowPrice = candles.length ? Math.min(...candles.map(c => c.low)) * 0.999 : 0;
//   const priceRange = highPrice - lowPrice || 1;

//   const updateGeom = (e: React.MouseEvent<SVGSVGElement>) => {
//     const r = e.currentTarget.getBoundingClientRect();
//     geom.current = { high: highPrice, low: lowPrice, range: priceRange, width: r.width, height: r.height };
//     return r;
//   };

//   const toPercentY = (price: number) => ((highPrice - price) / priceRange) * 100;
//   const toPrice = (yPx: number, rect: DOMRect) => highPrice - (yPx / rect.height) * priceRange;
//   const toFracX = (xPx: number, rect: DOMRect) => xPx / rect.width;

//   const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
//     if (!candles.length) return;
//     const r = updateGeom(e);
//     const xPx = e.clientX - r.left;
//     const yPx = e.clientY - r.top;
//     const fracX = toFracX(xPx, r);
//     const price = toPrice(yPx, r);

//     if (activeTool === "cursor") return;

//     if (activeTool === "hline") {
//       setDrawings(d => [...d, { id: Date.now().toString(), type: "hline", price }]);
//       return;
//     }
//     if (!pending) {
//       setPending({ type: activeTool, x1: fracX, y1: price, x2: fracX, y2: price });
//     } else {
//       setDrawings(d => [...d, { id: Date.now().toString(), type: pending.type, x1: pending.x1, y1: pending.y1, x2: fracX, y2: price } as Drawing]);
//       setPending(null);
//     }
//   };

//   const handleMove = (e: React.MouseEvent<SVGSVGElement>) => {
//     if (!candles.length) return;
//     const r = updateGeom(e);
//     const xPx = e.clientX - r.left;
//     const yPx = e.clientY - r.top;
//     setMousePos({ x: xPx, y: yPx });
//     const idx = Math.floor((xPx / r.width) * candles.length);
//     if (candles[idx]) setHoveredCandle(candles[idx]);

//     if (pending) {
//       const price = toPrice(yPx, r);
//       setPending({ ...pending, x2: xPx / r.width, y2: price });
//     }
//   };

//   const handleLeave = () => {
//     setHoveredCandle(null);
//     // don't orphan a half-finished drawing
//     setPending(null);
//   };

//   const activePositions = positions.filter(p => p.status === "open");
//   const equity = 10000 + activePositions.reduce((a, p) => a + p.pnl, 0);

//   return (
//     <div className="flex flex-col h-full w-full font-sans overflow-hidden bg-[#f0fdf4]/50 dark:bg-[#050806]/50">

//       {/* 1. STATS BAR */}
//       <div className="h-12 border-b border-lime-500/10 flex items-center justify-between px-4 shrink-0 bg-white/40 dark:bg-[#121A14]/60 backdrop-blur-md">
//         <div className="flex gap-6 text-xs font-mono">
//           <div><span className="text-lime-800/60 dark:text-lime-200/50">Balance:</span> <span className="text-lime-950 dark:text-white font-bold">$10,000.00</span></div>
//           <div><span className="text-lime-800/60 dark:text-lime-200/50">Equity:</span> <span className={equity >= 10000 ? "text-green-500 font-bold" : "text-red-500 font-bold"}>${equity.toFixed(2)}</span></div>
//           <div><span className="text-lime-800/60 dark:text-lime-200/50">Open PnL:</span> <span className={equity >= 10000 ? "text-green-500 font-bold" : "text-red-500 font-bold"}>${(equity - 10000).toFixed(2)}</span></div>
//         </div>
        
//         {/* REPLACED HAMBURGER WITH SELECT DROPDOWN + CARET */}
//         <div className="relative flex items-center">
//           <select 
//             onChange={(e) => {
//               const action = e.target.value;
//               if (action === "buy") onPlaceTrade?.("buy");
//               if (action === "sell") onPlaceTrade?.("sell");
//               e.target.value = ""; // Reset after selection
//             }}
//             className="appearance-none bg-transparent text-lime-600 dark:text-[#8fbc8f] font-bold outline-none cursor-pointer pl-2 pr-7 py-2 text-xs"
//           >
//             <option value="" disabled selected>Trade</option>
//             <option value="buy">Buy</option>
//             <option value="sell">Sell</option>
//           </select>
          
//           {/* Custom Inverted Caret */}
//           <svg 
//             className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-lime-600 dark:text-[#8fbc8f] opacity-80" 
//             width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
//           >
//             <path d="M6 9l6 6 6-6"/>
//           </svg>
//         </div>
//       </div>

//       <div className="flex flex-1 overflow-hidden relative">
//         <div className="flex-1 flex flex-col min-w-0">

//           {/* CHART TOOLBAR */}
//           <div className="h-12 border-b border-lime-500/10 bg-white/40 dark:bg-[#121A14]/60 backdrop-blur-md flex items-center justify-between px-4 shrink-0">
//             <div className="flex items-center gap-1">
//               {[
//                 { key: "cursor" as const, icon: MousePointer2 },
//                 { key: "trend" as const, icon: LineChart },
//                 { key: "hline" as const, icon: MinusIcon },
//                 { key: "rect" as const, icon: Square },
//               ].map(({ key, icon: Icon }) => (
//                 <button
//                   key={key}
//                   onClick={() => { setActiveTool(key); setPending(null); }}
//                   className={`p-2 rounded-lg transition-colors ${activeTool === key ? "bg-lime-500/20 text-lime-600 dark:text-lime-400" : "text-lime-800/60 dark:text-lime-200/50 hover:text-lime-950 dark:hover:text-white"}`}
//                 >
//                   <Icon size={18} />
//                 </button>
//               ))}
//               <div className="w-px h-5 bg-lime-500/20 mx-2" />
//               <button onClick={() => { setDrawings([]); setPending(null); }} className="p-2 text-lime-800/60 dark:text-lime-200/50 hover:text-red-500 rounded-lg transition-colors">
//                 <Trash2 size={18} />
//               </button>
//             </div>

//             <div className="flex bg-white/50 dark:bg-black/40 rounded-lg border border-lime-500/20 p-1">
//               {TIMEFRAMES.map(tf => (
//                 <button key={tf} onClick={() => setTimeframe(tf)} className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${timeframe === tf ? "bg-lime-500 text-white shadow-sm" : "text-lime-800/60 dark:text-lime-200/50 hover:text-lime-950"}`}>
//                   {tf}
//                 </button>
//               ))}
//             </div>
//           </div>

//           {/* CHART CANVAS */}
//           <div className="flex-1 relative cursor-crosshair overflow-hidden flex flex-col">
//             <div className="flex-1 relative">
//               <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-5" style={{ backgroundImage: "linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

//               <svg
//                 className="w-full h-full absolute inset-0"
//                 onMouseMove={handleMove}
//                 onClick={handleClick}
//                 onMouseLeave={handleLeave}
//                 viewBox="0 0 1000 1000"
//                 preserveAspectRatio="none"
//               >
//                 {/* Y-Axis labels */}
//                 {[0, 0.25, 0.5, 0.75, 1].map(r => (
//                   <text key={r} x="95%" y={`${r * 100}%`} fill="currentColor" className="text-lime-800/40 dark:text-lime-200/30" fontSize="11" fontFamily="monospace">
//                     {coin.symbol === "BTC" ? "$" : ""}{(highPrice - r * priceRange).toFixed(2)}
//                   </text>
//                 ))}

//                 {/* vertical tracing lines */}
//                 <g opacity="0.15">
//                   {[20, 40, 60, 80].map(p => (
//                     <line key={p} x1={`${p}%`} y1="0%" x2={`${p}%`} y2="100%" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" className="text-lime-900 dark:text-lime-100" />
//                   ))}
//                 </g>

//                 {/* committed drawings */}
//                 {drawings.map(d => {
//                   if (d.type === "hline") {
//                     return <line key={d.id} x1="0%" y1={`${toPercentY(d.price)}%`} x2="100%" y2={`${toPercentY(d.price)}%`} stroke="#f0b429" strokeWidth="1.5" strokeDasharray="4 4" />;
//                   }
//                   if (d.type === "trend") {
//                     return <line key={d.id} x1={`${d.x1 * 100}%`} y1={`${toPercentY(d.y1)}%`} x2={`${d.x2 * 100}%`} y2={`${toPercentY(d.y2)}%`} stroke="#38bdf8" strokeWidth="2" />;
//                   }
//                   // rect
//                   return (
//                     <rect
//                       key={d.id}
//                       x={`${Math.min(d.x1, d.x2) * 100}%`}
//                       y={`${Math.min(toPercentY(d.y1), toPercentY(d.y2))}%`}
//                       width={`${Math.abs(d.x2 - d.x1) * 100}%`}
//                       height={`${Math.abs(toPercentY(d.y2) - toPercentY(d.y1))}%`}
//                       stroke="#a78bfa" strokeWidth="1.5" fill="rgba(167,139,250,0.15)"
//                     />
//                   );
//                 })}

//                 {/* pending preview — handles both trend AND rect */}
//                 {pending && (
//                   pending.type === "trend" ? (
//                     <line x1={`${pending.x1 * 100}%`} y1={`${toPercentY(pending.y1)}%`} x2={`${pending.x2 * 100}%`} y2={`${toPercentY(pending.y2)}%`} stroke="#f0b429" strokeWidth="1.5" strokeDasharray="2 2" />
//                   ) : (
//                     <rect
//                       x={`${Math.min(pending.x1, pending.x2) * 100}%`}
//                       y={`${Math.min(toPercentY(pending.y1), toPercentY(pending.y2))}%`}
//                       width={`${Math.abs(pending.x2 - pending.x1) * 100}%`}
//                       height={`${Math.abs(toPercentY(pending.y2) - toPercentY(pending.y1))}%`}
//                       stroke="#f0b429" strokeWidth="1.5" strokeDasharray="2 2" fill="rgba(240,180,41,0.08)"
//                     />
//                   )
//                 )}

//                 {/* candles */}
//                 <g>
//                   {candles.map((c, i) => {
//                     const w = 100 / candles.length;
//                     const x = i * w + w * 0.15;
//                     const yHigh = toPercentY(c.high);
//                     const yLow = toPercentY(c.low);
//                     const yOpen = toPercentY(c.open);
//                     const yClose = toPercentY(c.close);
//                     const isBull = c.close >= c.open;
//                     const color = isBull ? "#22c55e" : "#ef4444";
//                     const bodyTop = Math.min(yOpen, yClose);
//                     const bodyHeight = Math.max(0.5, Math.abs(yClose - yOpen));
//                     return (
//                       <g key={`${c.time}-${i}`}>
//                         <line x1={`${x + w * 0.35}%`} y1={`${yHigh}%`} x2={`${x + w * 0.35}%`} y2={`${yLow}%`} stroke={color} strokeWidth="1" />
//                         <rect x={`${x}%`} y={`${bodyTop}%`} width={`${w * 0.7}%`} height={`${bodyHeight}%`} fill={color} />
//                       </g>
//                     );
//                   })}
//                 </g>
//               </svg>

//               {hoveredCandle && (
//                 <div
//                   className="absolute bg-white/95 dark:bg-[#0a0f0b]/95 border border-lime-500/20 p-3 rounded-xl text-xs font-mono text-lime-800 dark:text-lime-200 pointer-events-none backdrop-blur-md shadow-2xl z-20"
//                   style={{ top: Math.min(mousePos.y + 15, 400), left: Math.min(mousePos.x + 15, 300) }}
//                 >
//                   <div className="text-lime-950 dark:text-white font-bold mb-1">{new Date(hoveredCandle.time).toLocaleTimeString()}</div>
//                   <div className="grid grid-cols-2 gap-x-4 gap-y-1">
//                     <span>Open: <span className="text-lime-950 dark:text-white font-bold">{hoveredCandle.open.toFixed(2)}</span></span>
//                     <span>High: <span className="text-green-500 font-bold">{hoveredCandle.high.toFixed(2)}</span></span>
//                     <span>Low: <span className="text-red-500 font-bold">{hoveredCandle.low.toFixed(2)}</span></span>
//                     <span>Close: <span className="text-lime-950 dark:text-white font-bold">{hoveredCandle.close.toFixed(2)}</span></span>
//                   </div>
//                 </div>
//               )}
//             </div>
//           </div>

//           {/* 3. BOTTOM TERMINAL */}
//           <div className="border-t border-lime-500/10 bg-white/40 dark:bg-[#121A14]/60 backdrop-blur-md flex flex-col shrink-0">
//             <div className="flex items-center justify-between px-4 py-2.5">
//               <div className="flex items-center gap-4 text-xs font-bold">
//                 <span className="text-lime-950 dark:text-white border-b-2 border-lime-500">Positions ({activePositions.length})</span>
//               </div>
              
//               {/* REPLACED BOTTOM CHEVRON WITH SELECT DROPDOWN + CARET */}
//               <div className="relative flex items-center justify-center">
//                 <select
//                   onChange={(e) => {
//                     setIsTableOpen(e.target.value === "open");
//                   }}
//                   value={isTableOpen ? "open" : "closed"}
//                   className="appearance-none bg-transparent text-lime-600 dark:text-[#8fbc8f] font-bold outline-none cursor-pointer text-center pl-2 pr-6 py-1 text-xs"
//                 >
//                   <option value="open">Open</option>
//                   <option value="closed">Closed</option>
//                 </select>

//                 <svg 
//                   className={`absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-lime-600 dark:text-[#8fbc8f] opacity-80 transition-transform duration-300 ${isTableOpen ? "rotate-180" : ""}`}
//                   width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
//                 >
//                   <path d="M6 9l6 6 6-6"/>
//                 </svg>
//               </div>
//             </div>

//             <AnimatePresence>
//               {isTableOpen && (
//                 <motion.div
//                   initial={{ height: 0, opacity: 0 }}
//                   animate={{ height: "auto", opacity: 1 }}
//                   exit={{ height: 0, opacity: 0 }}
//                   transition={{ duration: 0.3, ease: "easeInOut" }}
//                   className="overflow-hidden"
//                 >
//                   <div className="h-40 overflow-auto custom-scrollbar border-t border-lime-500/5">
//                     {activePositions.length === 0 ? (
//                       <div className="flex h-full items-center justify-center text-lime-800/40 dark:text-lime-200/30 text-sm font-mono">
//                         No open positions. Use Trade above.
//                       </div>
//                     ) : (
//                       <table className="w-full text-left text-xs font-mono">
//                         <thead className="text-lime-800/60 dark:text-lime-200/50 border-b border-lime-500/10 bg-white/50 dark:bg-black/20 sticky top-0 backdrop-blur-md">
//                           <tr>
//                             <th className="p-2 font-normal">Symbol</th>
//                             <th className="p-2 font-normal">Type</th>
//                             <th className="p-2 font-normal">Volume</th>
//                             <th className="p-2 font-normal">Entry</th>
//                             <th className="p-2 font-normal">Current</th>
//                             <th className="p-2 font-normal text-right">P&L</th>
//                             <th className="p-2 font-normal text-center">Action</th>
//                           </tr>
//                         </thead>
//                         <tbody>
//                           <AnimatePresence>
//                             {activePositions.map(p => (
//                               <motion.tr
//                                 key={p.id}
//                                 initial={{ opacity: 0, y: 10 }}
//                                 animate={{ opacity: 1, y: 0 }}
//                                 exit={{ opacity: 0, scale: 0.95 }}
//                                 className="border-b border-lime-500/5 hover:bg-white/60 dark:hover:bg-white/5 transition-colors"
//                               >
//                                 <td className="p-2 text-lime-950 dark:text-white font-bold">{p.symbol}</td>
//                                 <td className={`p-2 font-bold ${p.side === "buy" ? "text-green-500" : "text-red-500"}`}>{p.side.toUpperCase()}</td>
//                                 <td className="p-2 text-lime-800/70 dark:text-lime-200/60">{p.lots.toFixed(2)}</td>
//                                 <td className="p-2 text-lime-800/70 dark:text-lime-200/60">{p.entry.toFixed(2)}</td>
//                                 <td className="p-2 text-lime-800/70 dark:text-lime-200/60">{p.current.toFixed(2)}</td>
//                                 <td className={`p-2 text-right font-bold ${p.pnl >= 0 ? "text-green-500" : "text-red-500"}`}>
//                                   {p.pnl >= 0 ? "+" : ""}{p.pnl.toFixed(2)}
//                                 </td>
//                                 <td className="p-2 text-center">
//                                   <button onClick={() => onClosePosition(p.id)} className="px-2 py-1 bg-lime-100 dark:bg-lime-900/30 hover:bg-lime-200 dark:hover:bg-lime-900/50 rounded text-[10px] font-bold text-lime-700 dark:text-lime-300 transition-colors">
//                                     Close
//                                   </button>
//                                 </td>
//                               </motion.tr>
//                             ))}
//                           </AnimatePresence>
//                         </tbody>
//                       </table>
//                     )}
//                   </div>
//                 </motion.div>
//               )}
//             </AnimatePresence>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }