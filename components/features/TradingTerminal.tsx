// components/features/TradingTerminal.tsx
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crosshair, PenTool, Minus, Trash2, ChevronDown, Search, ArrowUpRight,
  Settings2, MoveUpRight, Square, AlignEndHorizontal, X, Clock, LayoutGrid,
  History, Eye
} from "lucide-react";
import { executeTradeAction, saveDrawingAction, deleteDrawingAction, closeTradeAction } from "@/app/actions/trade";
import { useTour } from "@/components/providers/TourProvider";

export const COMMODITIES: Record<string, any> = {
  CHR: { name: 'Charcoal', unit: 'bag', base: 42.50, region: 'Enugu', color: '#f59e0b' },
  BLF: { name: 'Bitterleaf', unit: 'bundle', base: 18.20, region: 'Onitsha', color: '#10b981' },
  SCN: { name: 'Scrap iron', unit: 'tonne', base: 285.00, region: 'Kano', color: '#78716c' },
  ENO: { name: 'Condemned oil', unit: 'barrel', base: 62.40, region: 'P/H', color: '#1e293b' },
  PLM: { name: 'Palm oil', unit: 'litre', base: 2.85, region: 'Benin', color: '#ea580c' },
  GRI: { name: 'Garri', unit: 'kg', base: 1.45, region: 'Ibadan', color: '#ca8a04' },
};

const TIMEFRAMES: Record<string, { label: string, points: number, interval: number, vol: number }> = {
  "1m":  { label: "1M", points: 200, interval: 60 * 1000, vol: 0.0005 },
  "1h":  { label: "1H", points: 200, interval: 60 * 60 * 1000, vol: 0.002 },
  "4h":  { label: "4H", points: 200, interval: 4 * 60 * 60 * 1000, vol: 0.005 },
  "6h":  { label: "6H", points: 200, interval: 6 * 60 * 60 * 1000, vol: 0.008 },
  "12h": { label: "12H", points: 200, interval: 12 * 60 * 60 * 1000, vol: 0.012 },
  "24h": { label: "24H", points: 200, interval: 24 * 60 * 60 * 1000, vol: 0.018 },
  "1w":  { label: "1W", points: 200, interval: 7 * 24 * 60 * 60 * 1000, vol: 0.03 },
  "2w":  { label: "2W", points: 200, interval: 14 * 24 * 60 * 60 * 1000, vol: 0.04 },
  "3w":  { label: "3W", points: 200, interval: 21 * 24 * 60 * 60 * 1000, vol: 0.05 },
  "1M":  { label: "1M", points: 200, interval: 30 * 24 * 60 * 60 * 1000, vol: 0.06 },
  "2M":  { label: "2M", points: 200, interval: 60 * 24 * 60 * 60 * 1000, vol: 0.08 },
  "4M":  { label: "4M", points: 200, interval: 120 * 24 * 60 * 60 * 1000, vol: 0.12 },
  "6M":  { label: "6M", points: 200, interval: 180 * 24 * 60 * 60 * 1000, vol: 0.15 },
  "1y":  { label: "1Y", points: 200, interval: 365 * 24 * 60 * 60 * 1000, vol: 0.25 },
};

const getChartGridConfig = (tf: string) => {
  if (["1m", "1h", "4h"].includes(tf)) return { gridInterval: 4, boundary: "day" };
  if (["6h", "12h", "24h", "1w"].includes(tf)) return { gridInterval: 6, boundary: "month" };
  return { gridInterval: 2, boundary: "year" };
};

export default function TradingTerminal({
  coin,
  quoteAssetSymbol,
  positions = [],
  onClosePosition,
  initialTrades = [],
  currencySymbol = "$",
  availableQuotes = [],
  dbAssets = [],
}: {
  coin?: any,
  quoteAssetSymbol?: string,
  positions?: any[],
  onClosePosition?: (id: string) => void,
  initialTrades?: any[],
  currencySymbol?: string,
  availableQuotes?: any[],
  dbAssets?: any[],
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setSteps } = useTour();

  const pairParam = searchParams.get("pair");
  const tradeIdParam = searchParams.get("tradeId");

  const [isMarketOpen, setIsMarketOpen] = useState(false);
  const [timeframe, setTimeframe] = useState("1h");

  const [baseAsset, setBaseAsset] = useState(pairParam?.split("-")[0] || coin?.symbol?.toUpperCase() || "CHR");
  const [quoteAsset, setQuoteAsset] = useState(pairParam?.split("-")[1] || quoteAssetSymbol || "USD");

  const [isSelectingPair, setIsSelectingPair] = useState(false);
  const [selectionStep, setSelectionStep] = useState<"base" | "quote">("base");
  const [searchQuery, setSearchQuery] = useState("");

  const [showToolsModal, setShowToolsModal] = useState(false);
  const [showTimeframeModal, setShowTimeframeModal] = useState(false);

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [selectedHistoryTrade, setSelectedHistoryTrade] = useState<any>(null);

  const [zoom, setZoom] = useState(1);
  const [activeTool, setActiveTool] = useState<"cursor" | "line" | "hline" | "ray" | "rect" | "fib">("cursor");

  const [drawings, setDrawings] = useState<any[]>([]);
  const [selectedDrawingIds, setSelectedDrawingIds] = useState<string[]>([]);
  const [activeTradeId, setActiveTradeId] = useState<string | null>(tradeIdParam);

  const [mousePos, setMousePos] = useState<{ x: number, y: number, price: number, time: number } | null>(null);
  const [pinnedInfo, setPinnedInfo] = useState<{ x: number, y: number, price: number, time: number } | null>(null);

  const [trades, setTrades] = useState<any[]>(initialTrades);
  const activeTradesList = coin ? positions : trades;

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const candlesRef = useRef<any[]>([]);

  const activePairId = `${baseAsset}-${quoteAsset}`;

  // Sync URL params (e.g. navigating from Dashboard to Terminal)
  useEffect(() => {
    if (pairParam) {
      const [b, q] = pairParam.split("-");
      if (b) setBaseAsset(b);
      if (q) setQuoteAsset(q);
    }
    if (tradeIdParam) {
      setActiveTradeId(tradeIdParam);
      setShowHistoryModal(true);
    }
  }, [pairParam, tradeIdParam]);

  useEffect(() => {
    setSteps([
      { id: "tour-terminal-header", title: "Trading Pair", text: "This shows your active trading pair. Click it to open the market selector." },
      { id: "tour-terminal-tools", title: "Drawing Tools", text: "Click here to access line, ray, fibonacci, and other technical analysis tools." },
      { id: "tour-terminal-timeframe", title: "Timeframes", text: "Switch between 1-minute, 1-hour, daily, or weekly charts." },
      { id: "tour-terminal-chart", title: "Live Chart", text: "This is where the price action happens. You can draw analysis and track live trends." },
      { id: "tour-terminal-history", title: "Trade History", text: "View your past trades, check PnL, and manage open positions." }
    ]);
    return () => setSteps([]);
  }, [setSteps]);

  useEffect(() => {
    const checkMarket = () => {
      const now = new Date();
      const day = now.getDay();
      const hour = now.getHours();
      const isWeekend = day === 0 || day === 6;
      const isTradingHours = hour >= 9 && hour < 17;
      setIsMarketOpen(!isWeekend && isTradingHours);
    };
    checkMarket();
    const interval = setInterval(checkMarket, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeTradeId) {
      const trade = activeTradesList.find(t => t._id === activeTradeId || t.id === activeTradeId);
      if (trade) setDrawings(trade.drawings || []);
    } else {
      setDrawings([]);
    }
    setSelectedDrawingIds([]);
  }, [activeTradeId, activeTradesList]);

  useEffect(() => { if (coin) setBaseAsset(coin.symbol.toUpperCase()); }, [coin]);
  useEffect(() => { if (quoteAssetSymbol) setQuoteAsset(quoteAssetSymbol); }, [quoteAssetSymbol]);

    // Trend Color Logic (Synced with Dashboard Sparklines)
  const getTrendColor = (data: any[]) => {
    // 1. Check if the active trade has closed or hit stop loss (Red)
    if (activeTradeId) {
      const trade = activeTradesList.find(t => t._id === activeTradeId || t.id === activeTradeId);
      if (trade && trade.status === "closed") return "#ef4444"; 
    }

    if (data.length < 5) return "#10b981"; // Stable (Green)
    
    const recent = data.slice(-15);
    const highs = recent.map(c => c.h);
    const lows = recent.map(c => c.l);
    const currentClose = recent[recent.length - 1].c;
    const prevHigh = Math.max(...highs.slice(0, -1));
    const prevLow = Math.min(...lows.slice(0, -1));

    // 2. Check if falling below entry price (Red)
    if (activeTradeId) {
       const trade = activeTradesList.find(t => t._id === activeTradeId || t.id === activeTradeId);
       if (trade && currentClose < (trade.entryPrice || trade.entry)) return "#ef4444"; // Closing
    }

    // 3. Increasing (Blue)
    if (currentClose > prevHigh) return "#3b82f6"; 
    
    // 4. Falling (Yellow)
    if (currentClose < prevLow) return "#eab308"; 
    
    // 5. Stable (Green)
    return "#10b981"; 
  };

  const generateCandles = useCallback((pairId: string, tf: string) => {
    const cfg = TIMEFRAMES[tf];
    const basePrice = coin ? coin.current_price : (COMMODITIES[pairId.split("-")[0]]?.base || 1);

    let seed = baseAsset.length * 100;
    const candles = [];
    let close = basePrice;

    for (let i = 0; i < cfg.points; i++) {
      const r1 = ((seed = (seed*9301+49297) % 233280) / 233280);
      const open = close;
      const bodyMove = (r1 - 0.45) * cfg.vol * 2;
      close = open * (1 + bodyMove);
      const high = Math.max(open, close) * (1 + r1 * cfg.vol);
      const low = Math.min(open, close) * (1 - r1 * cfg.vol);

      candles.push({ t: Date.now() - (cfg.points - i) * cfg.interval, o: open, h: high, l: low, c: close });
    }
    return candles;
  }, [coin, baseAsset]);

  const renderChart = useCallback(() => {
    const svg = svgRef.current;
    const container = chartContainerRef.current;
    if (!svg || !container) return;

    const W = container.clientWidth;
    const H = container.clientHeight;
    if (W === 0 || H === 0) return;

    const data = candlesRef.current;
    if (data.length === 0) return;

    const visibleCount = Math.max(10, Math.floor(data.length / zoom));
    const visibleData = data.slice(-visibleCount);

    let pMin = Math.min(...visibleData.map(c => c.l));
    let pMax = Math.max(...visibleData.map(c => c.h));
    const padP = (pMax - pMin) * 0.1 || 1;
    pMin -= padP; pMax += padP;

    const PAD_L = 10, PAD_R = 65, PAD_T = 20, PAD_B = 30;
    const plotW = W - PAD_L - PAD_R;
    const plotH = H - PAD_T - PAD_B;

    const yForP = (p: number) => PAD_T + (1 - (p - pMin) / (pMax - pMin)) * plotH;

    const tMin = visibleData[0].t;
    const tMax = visibleData[visibleData.length - 1].t;
    const xForT = (t: number) => PAD_L + ((t - tMin) / (tMax - tMin)) * plotW;

    const parts = [];

    for (let i = 0; i <= 5; i++) {
      const p = pMin + (pMax - pMin) * (i / 5);
      const y = yForP(p);
      parts.push(`<line x1="${PAD_L}" y1="${y}" x2="${W - PAD_R}" y2="${y}" stroke="#333" stroke-width="1" stroke-dasharray="4 4"/>`);
      parts.push(`<text x="${W - PAD_R + 10}" y="${y + 4}" fill="#888" font-size="10" font-family="monospace">${currencySymbol}${p.toFixed(p < 1 ? 6 : 2)}</text>`);
    }

    const { gridInterval, boundary } = getChartGridConfig(timeframe);

    visibleData.forEach((c, i) => {
      const x = xForT(c.t);
      if (i % gridInterval === 0) {
        parts.push(`<line x1="${x}" y1="${PAD_T}" x2="${x}" y2="${PAD_T + plotH}" stroke="#2a2a2a" stroke-width="1" stroke-dasharray="4 4"/>`);
      }
      if (i > 0) {
        const prevC = visibleData[i - 1];
        const d = new Date(c.t);
        const pd = new Date(prevC.t);
        let isBoundary = false;

        if (boundary === "day" && d.getDate() !== pd.getDate()) isBoundary = true;
        if (boundary === "month" && d.getMonth() !== pd.getMonth()) isBoundary = true;
        if (boundary === "year" && d.getFullYear() !== pd.getFullYear()) isBoundary = true;

        if (isBoundary) {
          parts.push(`<line x1="${x}" y1="${PAD_T}" x2="${x}" y2="${PAD_T + plotH}" stroke="#555" stroke-width="1" />`);
          const label = boundary === "year" ? d.getFullYear().toString() : boundary === "month" ? d.toLocaleString('default', { month: 'short' }) : `${d.getDate()}/${d.getMonth() + 1}`;
          parts.push(`<text x="${x + 2}" y="${PAD_T + plotH + 15}" fill="#666" font-size="9" font-family="monospace">${label}</text>`);
        }
      }
    });

    const isLineMode = visibleData.length > 80 || (plotW / visibleData.length) < 4;
    const trendColor = getTrendColor(visibleData);
    const slotW = plotW / visibleData.length;

    if (isLineMode) {
      parts.push(`
        <defs>
          <linearGradient id="glowGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${trendColor}" stop-opacity="0.5"/>
            <stop offset="100%" stop-color="${trendColor}" stop-opacity="0"/>
          </linearGradient>
          <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
      `);
      let linePath = '';
      visibleData.forEach((c, i) => {
        const x = xForT(c.t);
        const y = yForP(c.c);
        if (i === 0) linePath += `M ${x} ${y}`;
        else {
          const prevX = xForT(visibleData[i - 1].t);
          const prevY = yForP(visibleData[i - 1].c);
          const cpX = (x + prevX) / 2;
          linePath += ` C ${cpX} ${prevY}, ${cpX} ${y}, ${x} ${y}`;
        }
      });
      const areaPath = `${linePath} L ${xForT(visibleData[visibleData.length - 1].t)} ${PAD_T + plotH} L ${xForT(visibleData[0].t)} ${PAD_T + plotH} Z`;
      parts.push(`<path d="${areaPath}" fill="url(#glowGrad)" />`);
      parts.push(`<path d="${linePath}" fill="none" stroke="${trendColor}" stroke-width="2.5" filter="url(#glowFilter)" />`);
    } else {
      visibleData.forEach((c, i) => {
        const cx = xForT(c.t);
        const isBull = c.c >= c.o;
        const color = isBull ? "#10b981" : "#ef4444";
        parts.push(`<line x1="${cx}" y1="${yForP(c.h)}" x2="${cx}" y2="${yForP(c.l)}" stroke="${color}" stroke-width="1.5"/>`);
        parts.push(`<rect x="${cx - slotW*0.35}" y="${Math.min(yForP(c.o), yForP(c.c))}" width="${slotW*0.7}" height="${Math.max(1, Math.abs(yForP(c.c) - yForP(c.o)))}" fill="${color}" rx="1"/>`);
      });
    }

    drawings.forEach(d => {
      const isSelected = selectedDrawingIds.includes(d.id);
      const stroke = isSelected ? "#3b82f6" : "#eab308";
      const fill = isSelected ? "rgba(59, 130, 246, 0.1)" : "rgba(234, 179, 8, 0.1)";

      const x1 = xForT(d.start.t);
      const y1 = yForP(d.start.p);
      const x2 = xForT(d.end.t);
      const y2 = yForP(d.end.p);

      if (d.type === "line") {
        parts.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${isSelected ? 3 : 2}" pointer-events="stroke" cursor="pointer" data-id="${d.id}" />`);
      } else if (d.type === "hline") {
        parts.push(`<line x1="${PAD_L}" y1="${y1}" x2="${W - PAD_R}" y2="${y1}" stroke="${stroke}" stroke-width="${isSelected ? 3 : 2}" stroke-dasharray="5 5" pointer-events="stroke" cursor="pointer" data-id="${d.id}" />`);
      } else if (d.type === "ray") {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const extX = W - PAD_R;
        const extY = y1 + (dy / dx) * (extX - x1);
        parts.push(`<line x1="${x1}" y1="${y1}" x2="${extX}" y2="${extY}" stroke="${stroke}" stroke-width="${isSelected ? 3 : 2}" pointer-events="stroke" cursor="pointer" data-id="${d.id}" />`);
      } else if (d.type === "rect") {
        const rx = Math.min(x1, x2);
        const ry = Math.min(y1, y2);
        const rw = Math.abs(x1 - x2);
        const rh = Math.abs(y1 - y2);
        parts.push(`<rect x="${rx}" y="${ry}" width="${rw}" height="${rh}" fill="${fill}" stroke="${stroke}" stroke-width="${isSelected ? 3 : 2}" pointer-events="stroke" cursor="pointer" data-id="${d.id}" />`);
      } else if (d.type === "fib") {
        const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
        const top = Math.min(y1, y2);
        const bottom = Math.max(y1, y2);
        const height = bottom - top;
        const left = Math.min(x1, x2);
        const right = Math.max(x1, x2);

        parts.push(`<line x1="${left}" y1="${top}" x2="${right}" y2="${top}" stroke="${stroke}" stroke-width="1" />`);
        parts.push(`<line x1="${left}" y1="${bottom}" x2="${right}" y2="${bottom}" stroke="${stroke}" stroke-width="1" />`);
        parts.push(`<line x1="${left}" y1="${top}" x2="${left}" y2="${bottom}" stroke="${stroke}" stroke-width="1" opacity="0.5" />`);
        parts.push(`<line x1="${right}" y1="${top}" x2="${right}" y2="${bottom}" stroke="${stroke}" stroke-width="1" opacity="0.5" />`);

        levels.forEach(l => {
          const ly = top + height * l;
          parts.push(`<line x1="${left}" y1="${ly}" x2="${right}" y2="${ly}" stroke="${stroke}" stroke-width="${isSelected ? 2 : 1}" stroke-dasharray="3 3" pointer-events="stroke" cursor="pointer" data-id="${d.id}" />`);
          parts.push(`<text x="${left + 4}" y="${ly - 4}" fill="${stroke}" font-size="9" font-family="monospace">${(l * 100).toFixed(1)}%</text>`);
        });
      }
    });

    const last = visibleData[visibleData.length - 1];
    const lastY = yForP(last.c);
    parts.push(`<line x1="${PAD_L}" y1="${lastY}" x2="${W - PAD_R}" y2="${lastY}" stroke="${trendColor}" stroke-width="1" stroke-dasharray="2 2"/>`);
    parts.push(`<rect x="${W - PAD_R + 2}" y="${lastY - 9}" width="60" height="18" fill="${trendColor}" rx="3"/>`);
    parts.push(`<text x="${W - PAD_R + 6}" y="${lastY + 4}" fill="#000" font-size="10" font-weight="bold" font-family="monospace">${currencySymbol}${last.c.toFixed(last.c < 1 ? 6 : 2)}</text>`);

    svg.innerHTML = parts.join("");
  }, [zoom, drawings, selectedDrawingIds, currencySymbol, timeframe]);

  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number, y: number, t: number, p: number } | null>(null);

  const getCoords = (e: React.MouseEvent) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const container = chartContainerRef.current;
    if (!container) return null;
    const W = container.clientWidth;
    const H = container.clientHeight;
    const data = candlesRef.current;
    const visibleCount = Math.max(10, Math.floor(data.length / zoom));
    const visibleData = data.slice(-visibleCount);

    let pMin = Math.min(...visibleData.map(c => c.l));
    let pMax = Math.max(...visibleData.map(c => c.h));
    const padP = (pMax - pMin) * 0.1 || 1;
    pMin -= padP; pMax += padP;

    const PAD_L = 10, PAD_R = 65, PAD_T = 20, PAD_B = 30;
    const plotW = W - PAD_L - PAD_R;
    const plotH = H - PAD_T - PAD_B;

    const pForY = (y: number) => pMin + (1 - (y - PAD_T) / plotH) * (pMax - pMin);
    const tMin = visibleData[0].t;
    const tMax = visibleData[visibleData.length - 1].t;
    const tForX = (x: number) => tMin + ((x - PAD_L) / plotW) * (tMax - tMin);

    return { x, y, t: tForX(x), p: pForY(y) };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const coords = getCoords(e);
    if (!coords) return;
    setMousePos({ x: coords.x, y: coords.y, price: coords.p, time: coords.t });
  };

  const handleMouseLeave = () => {
    setMousePos(null);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const coords = getCoords(e);
    if (!coords) return;

    if (activeTool === "cursor") {
      setPinnedInfo({ x: coords.x, y: coords.y, price: coords.p, time: coords.t });
      const target = e.target as SVGElement;
      const drawingId = target.getAttribute("data-id");

      if (drawingId) {
        if (e.shiftKey) {
          setSelectedDrawingIds(prev =>
            prev.includes(drawingId) ? prev.filter(id => id !== drawingId) : [...prev, drawingId]
          );
        } else {
          setSelectedDrawingIds([drawingId]);
        }
      } else {
        setSelectedDrawingIds([]);
        setPinnedInfo(null);
      }
    } else if (activeTool === "hline") {
      const newDrawing = { id: Date.now().toString(), type: "hline", start: { t: coords.t, p: coords.p }, end: { t: coords.t, p: coords.p } };
      setDrawings(prev => [...prev, newDrawing]);
      if (activeTradeId) saveDrawingAction(activeTradeId, newDrawing);
      setActiveTool("cursor");
      setShowToolsModal(false);
    } else {
      setIsDrawing(true);
      setStartPos(coords);
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDrawing || !startPos) return;
    const coords = getCoords(e);
    if (!coords) return;

    if (Math.abs(coords.x - startPos.x) > 5 || Math.abs(coords.y - startPos.y) > 5) {
      const newDrawing = {
        id: Date.now().toString(),
        type: activeTool,
        start: { t: startPos.t, p: startPos.p },
        end: { t: coords.t, p: coords.p }
      };
      setDrawings(prev => [...prev, newDrawing]);
      if (activeTradeId) saveDrawingAction(activeTradeId, newDrawing);
    }
    setIsDrawing(false);
    setActiveTool("cursor");
    setShowToolsModal(false);
  };

  const deleteSelected = async () => {
    if (selectedDrawingIds.length === 0) return;
    setDrawings(prev => prev.filter(d => !selectedDrawingIds.includes(d.id)));
    if (activeTradeId) {
      for (const id of selectedDrawingIds) {
        await deleteDrawingAction(activeTradeId, id);
      }
    }
    setSelectedDrawingIds([]);
  };

  useEffect(() => {
    candlesRef.current = generateCandles(activePairId, timeframe);
    renderChart();
    const ro = new ResizeObserver(renderChart);
    if (chartContainerRef.current) ro.observe(chartContainerRef.current);
    return () => ro.disconnect();
  }, [activePairId, generateCandles, renderChart, timeframe]);

  const handleDeleteHistory = (id: string) => {
    setTrades(prev => prev.filter(t => t._id !== id && t.id !== id));
    setSelectedHistoryTrade(null);
  };

  const handleCloseOrForfeit = (trade: any) => {
    const id = trade._id || trade.id;
    const isProfit = (trade.pnl || 0) > 0;

    if (window.confirm(isProfit ? "Are you sure you want to Take Profit?" : "Are you sure you want to Close & Forfeit this trade?")) {
      if (onClosePosition) {
        onClosePosition(id);
      } else {
        closeTradeAction(id, coin ? coin.current_price : 0).then(() => {
          setTrades(prev => prev.filter(t => t._id !== id));
        });
      }
      setSelectedHistoryTrade(null);
    }
  };

  const allAvailableAssets = React.useMemo(() => {
    const baseAssets = dbAssets.map((a: any) => ({
      id: a.symbol,
      symbol: a.symbol,
      name: a.name,
      color: a.color,
      image: a.image // 👈 Added image support
    }));

    if (availableQuotes.length > 0) {
      availableQuotes.forEach((q: any) => {
        if (!baseAssets.find((a: any) => a.symbol === q.symbol.toUpperCase())) {
          baseAssets.push({
            id: q.id,
            symbol: q.symbol.toUpperCase(),
            name: q.name,
            color: q.category === 'crypto' ? "#f59e0b" : q.category === 'memes' ? "#ec4899" : "#3b82f6",
            image: q.image // 👈 Added image support
          });
        }
      });
    }

    if (coin && !baseAssets.find((a: any) => a.symbol === coin.symbol.toUpperCase())) {
      baseAssets.unshift({
        id: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        color: "#f59e0b",
        image: coin.image // 👈 Added image support
      });
    }

    return baseAssets;
  }, [dbAssets, availableQuotes, coin]);

  const filteredAssets = allAvailableAssets.filter((asset: any) =>
    (asset.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (asset.symbol || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredHistory = activeTradesList.filter((t: any) =>
    (t.baseAsset || t.symbol || "").toLowerCase().includes(historySearch.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-2xl border border-lime-500/20 dark:border-lime-500/10 rounded-3xl shadow-[0_8px_32px_0_rgba(132,204,22,0.15)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] overflow-hidden relative">
      <div id="tour-terminal-header" className="flex items-center justify-between p-3 border-b border-lime-500/10 bg-white/40 dark:bg-[#121A14]/60 backdrop-blur-md shrink-0">
        <button
          onClick={() => { setIsSelectingPair(true); setSelectionStep("base"); setSearchQuery(""); }}
          className="flex items-center gap-2 bg-white/50 dark:bg-[#050806]/80 px-3 py-1.5 rounded-lg border border-lime-500/20 hover:border-lime-500 cursor-pointer transition-colors"
        >
          <span className="text-sm font-bold uppercase tracking-wider text-lime-950 dark:text-[#ecfdf5]">
            {baseAsset} / {quoteAsset}
          </span>
          <ChevronDown size={14} className="text-lime-600 dark:text-lime-400" />
        </button>

        <div className={`text-xs font-bold px-2 py-1 rounded ${isMarketOpen ? "bg-green-500/10 text-green-600 dark:text-green-500" : "bg-red-500/10 text-red-600 dark:text-red-500"}`}>
          {isMarketOpen ? "MARKET OPEN" : "MARKET CLOSED"}
        </div>
      </div>

      <div className="flex-1 flex flex-col relative overflow-hidden">
        <div className="flex items-center justify-between gap-2 p-2 bg-white/30 dark:bg-[#121A14]/50 border-b border-lime-500/10 backdrop-blur z-10">
          <button
            id="tour-terminal-tools"
            onClick={() => { setShowToolsModal(!showToolsModal); setShowTimeframeModal(false); }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-colors shadow-sm ${showToolsModal ? "bg-lime-600 text-white border-lime-600" : "bg-white/50 dark:bg-[#050806]/80 border-lime-500/20 text-lime-800 dark:text-lime-200 hover:border-lime-500/50"}`}
          >
            <Settings2 size={16} />
            <span className="text-[11px] font-bold uppercase tracking-wider">Tools</span>
          </button>

          <button
            id="tour-terminal-timeframe"
            onClick={() => { setShowTimeframeModal(!showTimeframeModal); setShowToolsModal(false); }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-colors shadow-sm ${showTimeframeModal ? "bg-lime-600 text-white border-lime-600" : "bg-white/50 dark:bg-[#050806]/80 border-lime-500/20 text-lime-800 dark:text-lime-200 hover:border-lime-500/50"}`}
          >
            <Clock size={14} className={showTimeframeModal ? "text-white" : "text-lime-600 dark:text-lime-400"} />
            <span className="text-[11px] font-bold font-mono tracking-wider">{TIMEFRAMES[timeframe].label}</span>
            <ChevronDown size={14} className={showTimeframeModal ? "text-white" : "text-lime-600 dark:text-lime-400"} />
          </button>
        </div>

        <div
          id="tour-terminal-chart"
          ref={chartContainerRef}
          className="flex-1 w-full h-full cursor-crosshair bg-transparent relative"
          onWheel={(e) => {
            if (e.deltaY > 0) setZoom(z => Math.max(0.5, z / 1.1));
            else setZoom(z => Math.min(10, z * 1.1));
          }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
        >
          <svg ref={svgRef} className="w-full h-full block" />

          {pinnedInfo && (
            <div
              className="absolute z-30 bg-[#0a0f0b]/90 border border-lime-500/30 text-white text-[10px] font-mono p-2 rounded-lg shadow-xl pointer-events-none flex flex-col gap-1 backdrop-blur-md"
              style={{
                left: pinnedInfo.x > (chartContainerRef.current!.clientWidth / 2) ? pinnedInfo.x - 100 : pinnedInfo.x + 15,
                top: pinnedInfo.y - 40
              }}
            >
              <div className="text-lime-400 font-bold">{currencySymbol}{pinnedInfo.price.toFixed(2)}</div>
              <div className="text-gray-400">{new Date(pinnedInfo.time).toLocaleTimeString()}</div>
            </div>
          )}

          {mousePos && !pinnedInfo && (
            <div
              className="absolute z-20 bg-[#0a0f0b]/80 border border-lime-500/20 text-white text-[10px] font-mono p-1.5 rounded-lg shadow-lg pointer-events-none flex flex-col opacity-80"
              style={{ left: mousePos.x + 15, top: mousePos.y - 30 }}
            >
              <div>{currencySymbol}{mousePos.price.toFixed(2)}</div>
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 p-3 bg-white/40 dark:bg-[#121A14]/60 backdrop-blur-md border-t border-lime-500/10">
        <button
          id="tour-terminal-history"
          onClick={() => setShowHistoryModal(true)}
          className="w-full flex items-center justify-between bg-white/50 dark:bg-[#050806]/80 border border-lime-500/20 rounded-xl px-4 py-3 hover:border-lime-500/50 transition-colors group"
        >
          <div className="flex items-center gap-2 text-lime-800 dark:text-lime-200 font-bold text-sm">
            <History size={16} className="text-lime-600 dark:text-lime-400" />
            Trade History
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-lime-600 dark:text-lime-400">
            {activeTradesList.length} Trades
            <ChevronDown size={14} className="group-hover:translate-y-0.5 transition-transform" />
          </div>
        </button>
      </div>

      <AnimatePresence>
        {showHistoryModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-[#f4fbf5]/95 dark:bg-[#0a0f0b]/95 backdrop-blur-2xl border border-lime-500/30 dark:border-lime-500/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="p-4 border-b border-lime-500/10 flex justify-between items-center bg-white/40 dark:bg-[#121A14]/60 shrink-0">
                <h2 className="text-lg font-bold text-lime-950 dark:text-white flex items-center gap-2">
                  <History size={18} className="text-lime-500" /> Trade History
                </h2>
                <button onClick={() => setShowHistoryModal(false)} className="p-1.5 rounded-lg hover:bg-lime-500/10 text-lime-600 dark:text-lime-400 transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="p-3 shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-lime-600/50 dark:text-lime-400/50" size={16} />
                  <input
                    type="text"
                    placeholder="Search history..."
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    className="w-full bg-white/50 dark:bg-[#050806]/80 border border-lime-500/20 rounded-full py-2 pl-9 pr-4 text-sm text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 transition-colors"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                {filteredHistory.map((t) => (
                  <div
                    key={t._id || t.id}
                    className={`p-3 rounded-2xl border transition-colors flex flex-col gap-2 cursor-pointer ${
                      activeTradeId === (t._id || t.id)
                        ? "border-lime-500 bg-lime-500/10"
                        : "border-lime-500/20 dark:border-lime-500/10 bg-white/50 dark:bg-[#121A14]/50 hover:border-lime-500/50"
                    }`}
                    onClick={() => setActiveTradeId(t._id || t.id)}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${t.side === 'buy' ? 'bg-green-500/20 text-green-600' : 'bg-red-500/20 text-red-600'}`}>
                          {t.side?.toUpperCase() || "BUY"}
                        </span>
                        <span className="font-bold text-sm text-lime-950 dark:text-white">
                          {t.baseAsset || t.symbol}/{t.quoteAsset || "USD"}
                        </span>
                      </div>
                      <span className={`font-mono text-sm font-bold ${t.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {t.pnl >= 0 ? "+" : ""}{currencySymbol}{(t.pnl || 0).toFixed(2)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs font-mono text-lime-800/60 dark:text-lime-200/50">
                      <div>Qty: {t.amount || t.lots} @ ${t.entryPrice || t.entry}</div>
                      <div className="flex gap-1">
                        <button onClick={(e) => { e.stopPropagation(); setSelectedHistoryTrade(t); }} className="p-1.5 bg-lime-500/10 text-lime-600 rounded hover:bg-lime-500/20" title="View Details"><Eye size={14} /></button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteHistory(t._id || t.id); }} className="p-1.5 bg-red-500/10 text-red-600 rounded hover:bg-red-500/20" title="Delete Record"><Trash2 size={14} /></button>

                        <button
                          onClick={(e) => { e.stopPropagation(); handleCloseOrForfeit(t); }}
                          className={`px-2 py-1 rounded font-bold text-[10px] transition-colors ${
                            (t.pnl || 0) > 0
                              ? "bg-green-500/10 text-green-600 hover:bg-green-500/20"
                              : "bg-red-500/10 text-red-600 hover:bg-red-500/20"
                          }`}
                        >
                          {(t.pnl || 0) > 0 ? "Take Profit" : "Close & Forfeit"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredHistory.length === 0 && (
                  <div className="text-center text-xs text-lime-800/60 dark:text-lime-200/50 py-8">
                    No trade history found.
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedHistoryTrade && (
          <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-[#f4fbf5]/95 dark:bg-[#0a0f0b]/95 border border-lime-500/30 rounded-3xl p-6 shadow-2xl flex flex-col gap-4"
            >
              <div className="flex justify-between items-center border-b border-lime-500/10 pb-3">
                <h3 className="font-bold text-lime-950 dark:text-white">Trade Details</h3>
                <button onClick={() => setSelectedHistoryTrade(null)} className="text-gray-500 hover:text-red-500"><X size={16} /></button>
              </div>
              <div className="space-y-2 text-sm font-mono">
                <div className="flex justify-between"><span className="text-gray-500">Asset:</span> <span className="font-bold text-lime-950 dark:text-white">{selectedHistoryTrade.baseAsset || selectedHistoryTrade.symbol}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Side:</span> <span className={`font-bold uppercase ${selectedHistoryTrade.side === 'buy' ? 'text-green-500' : 'text-red-500'}`}>{selectedHistoryTrade.side}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Entry Price:</span> <span className="text-lime-950 dark:text-white">${selectedHistoryTrade.entryPrice || selectedHistoryTrade.entry}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Quantity:</span> <span className="text-lime-950 dark:text-white">{selectedHistoryTrade.amount || selectedHistoryTrade.lots}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">PnL:</span> <span className={`font-bold ${selectedHistoryTrade.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>{selectedHistoryTrade.pnl >= 0 ? "+" : ""}{currencySymbol}{(selectedHistoryTrade.pnl || 0).toFixed(2)}</span></div>
              </div>
              <button onClick={() => setSelectedHistoryTrade(null)} className="mt-4 w-full py-2 bg-lime-600 text-white font-bold rounded-xl hover:bg-lime-700 transition-colors">Close Details</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTimeframeModal && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-28 right-2 z-50 p-3 bg-white/95 dark:bg-[#121A14]/95 backdrop-blur-xl border border-lime-500/30 dark:border-lime-500/20 rounded-2xl shadow-2xl w-56"
          >
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-[10px] font-bold text-lime-800/60 dark:text-lime-200/50 uppercase tracking-widest">Timeframes</span>
              <button onClick={() => setShowTimeframeModal(false)} className="text-red-500 hover:bg-red-500/10 p-1 rounded-full transition-colors"><X size={14} /></button>
            </div>

            <div className="grid grid-cols-3 gap-1.5 max-h-64 overflow-y-auto custom-scrollbar">
              {Object.entries(TIMEFRAMES).map(([key, tf]) => (
                <button
                  key={key}
                  onClick={() => { setTimeframe(key); setShowTimeframeModal(false); }}
                  className={`py-2 rounded-lg text-[11px] font-bold font-mono transition-all flex items-center justify-center ${
                    timeframe === key
                      ? "bg-lime-600 text-white shadow-md"
                      : "text-lime-800 dark:text-lime-200 bg-lime-500/5 hover:bg-lime-500/15"
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showToolsModal && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-28 left-2 z-50 p-2 bg-white/95 dark:bg-[#121A14]/95 backdrop-blur-xl border border-lime-500/30 dark:border-lime-500/20 rounded-2xl shadow-2xl flex flex-col gap-1 w-14"
          >
            <button onClick={() => setShowToolsModal(false)} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-md hover:bg-red-600"><X size={12} /></button>

            <button onClick={() => { setActiveTool("cursor"); setShowToolsModal(false); }} className={`p-2 rounded-xl flex justify-center transition-colors ${activeTool === "cursor" ? "bg-lime-600 text-white shadow-md" : "text-lime-800 dark:text-lime-200 hover:bg-lime-500/10"}`} title="Cursor"><Crosshair size={20} /></button>
            <button onClick={() => { setActiveTool("line"); setShowToolsModal(false); }} className={`p-2 rounded-xl flex justify-center transition-colors ${activeTool === "line" ? "bg-lime-600 text-white shadow-md" : "text-lime-800 dark:text-lime-200 hover:bg-lime-500/10"}`} title="Trend Line"><PenTool size={20} /></button>
            <button onClick={() => { setActiveTool("hline"); setShowToolsModal(false); }} className={`p-2 rounded-xl flex justify-center transition-colors ${activeTool === "hline" ? "bg-lime-600 text-white shadow-md" : "text-lime-800 dark:text-lime-200 hover:bg-lime-500/10"}`} title="Horizontal Line"><Minus size={20} /></button>
            <button onClick={() => { setActiveTool("ray"); setShowToolsModal(false); }} className={`p-2 rounded-xl flex justify-center transition-colors ${activeTool === "ray" ? "bg-lime-600 text-white shadow-md" : "text-lime-800 dark:text-lime-200 hover:bg-lime-500/10"}`} title="Ray"><MoveUpRight size={20} /></button>
            <button onClick={() => { setActiveTool("rect"); setShowToolsModal(false); }} className={`p-2 rounded-xl flex justify-center transition-colors ${activeTool === "rect" ? "bg-lime-600 text-white shadow-md" : "text-lime-800 dark:text-lime-200 hover:bg-lime-500/10"}`} title="Rectangle"><Square size={20} /></button>
            <button onClick={() => { setActiveTool("fib"); setShowToolsModal(false); }} className={`p-2 rounded-xl flex justify-center transition-colors ${activeTool === "fib" ? "bg-lime-600 text-white shadow-md" : "text-lime-800 dark:text-lime-200 hover:bg-lime-500/10"}`} title="Fibonacci"><AlignEndHorizontal size={20} /></button>

            <div className="h-px w-full bg-lime-500/20 my-1" />

            <button onClick={deleteSelected} disabled={selectedDrawingIds.length === 0} className={`p-2 rounded-xl flex justify-center transition-colors ${selectedDrawingIds.length > 0 ? "text-red-500 hover:bg-red-500/10" : "text-lime-500/30 dark:text-lime-200/20 cursor-not-allowed"}`} title="Delete Selected"><Trash2 size={20} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSelectingPair && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-[#f4fbf5]/95 dark:bg-[#0a0f0b]/95 backdrop-blur-2xl border border-lime-500/30 dark:border-lime-500/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="p-4 border-b border-lime-500/10 flex justify-between items-center bg-white/40 dark:bg-[#121A14]/60 shrink-0">
                <h2 className="text-lg font-bold text-lime-950 dark:text-white">
                  Select {selectionStep === "base" ? "Base Asset" : "Quote Asset"}
                </h2>
                <button onClick={() => setIsSelectingPair(false)} className="p-1.5 rounded-lg hover:bg-lime-500/10 text-lime-600 dark:text-lime-400 transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="p-3 shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-lime-600/50 dark:text-lime-400/50" size={16} />
                  <input
                    type="text"
                    placeholder="Search assets..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/50 dark:bg-[#050806]/80 border border-lime-500/20 rounded-full py-2 pl-9 pr-4 text-sm text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 transition-colors"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                {filteredAssets.map((asset) => (
                  <button
                    key={asset.id}
                    onClick={() => {
                      if (selectionStep === "base") {
                        setBaseAsset(asset.symbol);
                        setSelectionStep("quote");
                        setSearchQuery("");
                      } else {
                        if (asset.symbol === baseAsset) return;
                        setQuoteAsset(asset.symbol);
                        setIsSelectingPair(false);
                      }
                    }}
                    className={`w-full p-3 rounded-2xl border flex items-center justify-between transition-colors ${baseAsset === asset.symbol && selectionStep === "quote" ? "opacity-50 cursor-not-allowed border-lime-500/10 bg-white/30 dark:bg-[#121A14]/30" : "border-lime-500/20 dark:border-lime-500/10 bg-white/50 dark:bg-[#121A14]/50 hover:border-lime-500/50 hover:bg-white/80 dark:hover:bg-[#121A14]/80"}`}
                  >
                    <div className="flex items-center gap-3">
                      {/* 👇 RENDERS ACTUAL IMAGE IF AVAILABLE */}
                      <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-black shadow-sm overflow-hidden shrink-0" style={{ background: asset.color || "#84cc16" }}>
                        {asset.image ? (
                          <img src={asset.image} alt={asset.symbol} className="w-full h-full object-cover" />
                        ) : (
                          asset.symbol[0]
                        )}
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-sm text-lime-950 dark:text-white uppercase">{asset.symbol}</div>
                        <div className="text-xs text-lime-800/60 dark:text-lime-200/50">{asset.name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm font-bold text-lime-950 dark:text-white">
                        {asset.symbol === coin?.symbol?.toUpperCase() ? `$${coin.current_price.toFixed(2)}` : `$${(COMMODITIES[asset.symbol]?.base || 0).toFixed(2)}`}
                      </div>
                      <div className="text-[10px] font-bold text-green-500 flex items-center justify-end">
                        <ArrowUpRight size={10} className="mr-1"/> +2.4%
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="p-3 border-t border-lime-500/10 bg-white/40 dark:bg-[#121A14]/60 shrink-0">
                <button
                  onClick={() => {
                    setIsSelectingPair(false);
                    router.push("/markets");
                  }}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-lime-500/10 hover:bg-lime-500/20 border border-lime-500/20 text-lime-700 dark:text-lime-300 font-bold text-sm transition-colors"
                >
                  <LayoutGrid size={16} />
                  {selectionStep === "base" ? "Explore All Base Markets" : "Explore All Markets"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
// // components/features/TradingTerminal.tsx
// "use client";

// import React, { useState, useEffect, useRef, useCallback } from "react";
// import { useRouter } from "next/navigation";
// import { motion, AnimatePresence } from "framer-motion";
// import {
//   Crosshair, PenTool, Minus, Trash2, ChevronDown, Search, ArrowUpRight,
//   Settings2, MoveUpRight, Square, AlignEndHorizontal, X, Clock, LayoutGrid,
//   History, Eye
// } from "lucide-react";
// import { executeTradeAction, saveDrawingAction, deleteDrawingAction, closeTradeAction } from "@/app/actions/trade";
// import { useTour } from "@/components/providers/TourProvider";

// export const COMMODITIES: Record<string, any> = {
//   CHR: { name: 'Charcoal', unit: 'bag', base: 42.50, region: 'Enugu', color: '#f59e0b' },
//   BLF: { name: 'Bitterleaf', unit: 'bundle', base: 18.20, region: 'Onitsha', color: '#10b981' },
//   SCN: { name: 'Scrap iron', unit: 'tonne', base: 285.00, region: 'Kano', color: '#78716c' },
//   ENO: { name: 'Condemned oil', unit: 'barrel', base: 62.40, region: 'P/H', color: '#1e293b' },
//   PLM: { name: 'Palm oil', unit: 'litre', base: 2.85, region: 'Benin', color: '#ea580c' },
//   GRI: { name: 'Garri', unit: 'kg', base: 1.45, region: 'Ibadan', color: '#ca8a04' },
// };

// const TIMEFRAMES: Record<string, { label: string, points: number, interval: number, vol: number }> = {
//   "1m":  { label: "1M", points: 200, interval: 60 * 1000, vol: 0.0005 },
//   "1h":  { label: "1H", points: 200, interval: 60 * 60 * 1000, vol: 0.002 },
//   "4h":  { label: "4H", points: 200, interval: 4 * 60 * 60 * 1000, vol: 0.005 },
//   "6h":  { label: "6H", points: 200, interval: 6 * 60 * 60 * 1000, vol: 0.008 },
//   "12h": { label: "12H", points: 200, interval: 12 * 60 * 60 * 1000, vol: 0.012 },
//   "24h": { label: "24H", points: 200, interval: 24 * 60 * 60 * 1000, vol: 0.018 },
//   "1w":  { label: "1W", points: 200, interval: 7 * 24 * 60 * 60 * 1000, vol: 0.03 },
//   "2w":  { label: "2W", points: 200, interval: 14 * 24 * 60 * 60 * 1000, vol: 0.04 },
//   "3w":  { label: "3W", points: 200, interval: 21 * 24 * 60 * 60 * 1000, vol: 0.05 },
//   "1M":  { label: "1M", points: 200, interval: 30 * 24 * 60 * 60 * 1000, vol: 0.06 },
//   "2M":  { label: "2M", points: 200, interval: 60 * 24 * 60 * 60 * 1000, vol: 0.08 },
//   "4M":  { label: "4M", points: 200, interval: 120 * 24 * 60 * 60 * 1000, vol: 0.12 },
//   "6M":  { label: "6M", points: 200, interval: 180 * 24 * 60 * 60 * 1000, vol: 0.15 },
//   "1y":  { label: "1Y", points: 200, interval: 365 * 24 * 60 * 60 * 1000, vol: 0.25 },
// };

// const getChartGridConfig = (tf: string) => {
//   if (["1m", "1h", "4h"].includes(tf)) return { gridInterval: 4, boundary: "day" };
//   if (["6h", "12h", "24h", "1w"].includes(tf)) return { gridInterval: 6, boundary: "month" };
//   return { gridInterval: 2, boundary: "year" };
// };

// export default function TradingTerminal({
//   coin,
//   quoteAssetSymbol,
//   positions = [],
//   onClosePosition,
//   initialTrades = [],
//   currencySymbol = "$",
//   availableQuotes = [],
//   dbAssets = [],
// }: {
//   coin?: any,
//   quoteAssetSymbol?: string,
//   positions?: any[],
//   onClosePosition?: (id: string) => void,
//   initialTrades?: any[],
//   currencySymbol?: string,
//   availableQuotes?: any[],
//   dbAssets?: any[],
// }) {
//   const router = useRouter();
//   const { setSteps } = useTour();

//   const [isMarketOpen, setIsMarketOpen] = useState(false);
//   const [timeframe, setTimeframe] = useState("1h");

//   const [baseAsset, setBaseAsset] = useState(coin?.symbol?.toUpperCase() || "CHR");
//   const [quoteAsset, setQuoteAsset] = useState(quoteAssetSymbol || "USD");

//   const [isSelectingPair, setIsSelectingPair] = useState(false);
//   const [selectionStep, setSelectionStep] = useState<"base" | "quote">("base");
//   const [searchQuery, setSearchQuery] = useState("");

//   const [showToolsModal, setShowToolsModal] = useState(false);
//   const [showTimeframeModal, setShowTimeframeModal] = useState(false);

//   const [showHistoryModal, setShowHistoryModal] = useState(false);
//   const [historySearch, setHistorySearch] = useState("");
//   const [selectedHistoryTrade, setSelectedHistoryTrade] = useState<any>(null);

//   const [zoom, setZoom] = useState(1);
//   const [activeTool, setActiveTool] = useState<"cursor" | "line" | "hline" | "ray" | "rect" | "fib">("cursor");

//   const [drawings, setDrawings] = useState<any[]>([]);
//   const [selectedDrawingIds, setSelectedDrawingIds] = useState<string[]>([]);
//   const [activeTradeId, setActiveTradeId] = useState<string | null>(null);

//   const [mousePos, setMousePos] = useState<{ x: number, y: number, price: number, time: number } | null>(null);
//   const [pinnedInfo, setPinnedInfo] = useState<{ x: number, y: number, price: number, time: number } | null>(null);

//   const [trades, setTrades] = useState<any[]>(initialTrades);
//   const activeTradesList = coin ? positions : trades;

//   const chartContainerRef = useRef<HTMLDivElement>(null);
//   const svgRef = useRef<SVGSVGElement>(null);
//   const candlesRef = useRef<any[]>([]);

//   const activePairId = `${baseAsset}-${quoteAsset}`;

//   // 👇 1. CONFIGURE TOUR STEPS
//   useEffect(() => {
//     setSteps([
//       { id: "tour-terminal-header", title: "Trading Pair", text: "This shows your active trading pair. Click it to open the market selector." },
//       { id: "tour-terminal-tools", title: "Drawing Tools", text: "Click here to access line, ray, fibonacci, and other technical analysis tools." },
//       { id: "tour-terminal-timeframe", title: "Timeframes", text: "Switch between 1-minute, 1-hour, daily, or weekly charts." },
//       { id: "tour-terminal-chart", title: "Live Chart", text: "This is where the price action happens. You can draw analysis and track live trends." },
//       { id: "tour-terminal-history", title: "Trade History", text: "View your past trades, check PnL, and manage open positions." }
//     ]);

//     // Clear steps when leaving the page to prevent conflicts
//     return () => setSteps([]);
//   }, [setSteps]);

//   // Market Hours Logic
//   useEffect(() => {
//     const checkMarket = () => {
//       const now = new Date();
//       const day = now.getDay();
//       const hour = now.getHours();
//       const isWeekend = day === 0 || day === 6;
//       const isTradingHours = hour >= 9 && hour < 17;
//       setIsMarketOpen(!isWeekend && isTradingHours);
//     };
//     checkMarket();
//     const interval = setInterval(checkMarket, 60000);
//     return () => clearInterval(interval);
//   }, []);

//   // Sync Drawings
//   useEffect(() => {
//     if (activeTradeId) {
//       const trade = activeTradesList.find(t => t._id === activeTradeId || t.id === activeTradeId);
//       if (trade) setDrawings(trade.drawings || []);
//     } else {
//       setDrawings([]);
//     }
//     setSelectedDrawingIds([]);
//   }, [activeTradeId, activeTradesList]);

//   useEffect(() => { if (coin) setBaseAsset(coin.symbol.toUpperCase()); }, [coin]);
//   useEffect(() => { if (quoteAssetSymbol) setQuoteAsset(quoteAssetSymbol); }, [quoteAssetSymbol]);

//   // Trend Color Logic
//   const getTrendColor = (data: any[]) => {
//     if (data.length < 5) return "#3b82f6";
//     const recent = data.slice(-15);
//     const highs = recent.map(c => c.h);
//     const lows = recent.map(c => c.l);
//     const currentClose = recent[recent.length - 1].c;
//     const prevHigh = Math.max(...highs.slice(0, -1));
//     const prevLow = Math.min(...lows.slice(0, -1));

//     if (currentClose < prevLow) return "#ef4444";
//     if (currentClose > prevHigh) return "#3b82f6";
//     const startMid = (recent[0].h + recent[0].l) / 2;
//     const endMid = (recent[recent.length - 1].h + recent[recent.length - 1].l) / 2;
//     if (endMid < startMid * 0.99) return "#eab308";
//     return "#3b82f6";
//   };

//   const generateCandles = useCallback((pairId: string, tf: string) => {
//     const cfg = TIMEFRAMES[tf];
//     const basePrice = coin ? coin.current_price : (COMMODITIES[pairId.split("-")[0]]?.base || 1);

//     let seed = baseAsset.length * 100;
//     const candles = [];
//     let close = basePrice;

//     for (let i = 0; i < cfg.points; i++) {
//       const r1 = ((seed = (seed*9301+49297) % 233280) / 233280);
//       const open = close;
//       const bodyMove = (r1 - 0.45) * cfg.vol * 2;
//       close = open * (1 + bodyMove);
//       const high = Math.max(open, close) * (1 + r1 * cfg.vol);
//       const low = Math.min(open, close) * (1 - r1 * cfg.vol);

//       candles.push({ t: Date.now() - (cfg.points - i) * cfg.interval, o: open, h: high, l: low, c: close });
//     }
//     return candles;
//   }, [coin, baseAsset]);

//   const renderChart = useCallback(() => {
//     const svg = svgRef.current;
//     const container = chartContainerRef.current;
//     if (!svg || !container) return;

//     const W = container.clientWidth;
//     const H = container.clientHeight;
//     if (W === 0 || H === 0) return;

//     const data = candlesRef.current;
//     if (data.length === 0) return;

//     const visibleCount = Math.max(10, Math.floor(data.length / zoom));
//     const visibleData = data.slice(-visibleCount);

//     let pMin = Math.min(...visibleData.map(c => c.l));
//     let pMax = Math.max(...visibleData.map(c => c.h));
//     const padP = (pMax - pMin) * 0.1 || 1;
//     pMin -= padP; pMax += padP;

//     const PAD_L = 10, PAD_R = 65, PAD_T = 20, PAD_B = 30;
//     const plotW = W - PAD_L - PAD_R;
//     const plotH = H - PAD_T - PAD_B;

//     const yForP = (p: number) => PAD_T + (1 - (p - pMin) / (pMax - pMin)) * plotH;

//     const tMin = visibleData[0].t;
//     const tMax = visibleData[visibleData.length - 1].t;
//     const xForT = (t: number) => PAD_L + ((t - tMin) / (tMax - tMin)) * plotW;

//     const parts = [];

//     // 1. Horizontal Grid (Price)
//     for (let i = 0; i <= 5; i++) {
//       const p = pMin + (pMax - pMin) * (i / 5);
//       const y = yForP(p);
//       parts.push(`<line x1="${PAD_L}" y1="${y}" x2="${W - PAD_R}" y2="${y}" stroke="#333" stroke-width="1" stroke-dasharray="4 4"/>`);
//       parts.push(`<text x="${W - PAD_R + 10}" y="${y + 4}" fill="#888" font-size="10" font-family="monospace">${currencySymbol}${p.toFixed(p < 1 ? 6 : 2)}</text>`);
//     }

//     // 2. Vertical Grid & Time Boundaries
//     const { gridInterval, boundary } = getChartGridConfig(timeframe);

//     visibleData.forEach((c, i) => {
//       const x = xForT(c.t);

//       // Broken vertical lines (Grid)
//       if (i % gridInterval === 0) {
//         parts.push(`<line x1="${x}" y1="${PAD_T}" x2="${x}" y2="${PAD_T + plotH}" stroke="#2a2a2a" stroke-width="1" stroke-dasharray="4 4"/>`);
//       }

//       // Solid vertical lines (Boundaries)
//       if (i > 0) {
//         const prevC = visibleData[i - 1];
//         const d = new Date(c.t);
//         const pd = new Date(prevC.t);
//         let isBoundary = false;

//         if (boundary === "day" && d.getDate() !== pd.getDate()) isBoundary = true;
//         if (boundary === "month" && d.getMonth() !== pd.getMonth()) isBoundary = true;
//         if (boundary === "year" && d.getFullYear() !== pd.getFullYear()) isBoundary = true;

//         if (isBoundary) {
//           parts.push(`<line x1="${x}" y1="${PAD_T}" x2="${x}" y2="${PAD_T + plotH}" stroke="#555" stroke-width="1" />`);
//           const label = boundary === "year"
//             ? d.getFullYear().toString()
//             : boundary === "month"
//               ? d.toLocaleString('default', { month: 'short' })
//               : `${d.getDate()}/${d.getMonth() + 1}`;
//           parts.push(`<text x="${x + 2}" y="${PAD_T + plotH + 15}" fill="#666" font-size="9" font-family="monospace">${label}</text>`);
//         }
//       }
//     });

//     // 3. Price Action (Line or Candles)
//     const isLineMode = visibleData.length > 80 || (plotW / visibleData.length) < 4;
//     const trendColor = getTrendColor(visibleData);
//     const slotW = plotW / visibleData.length;

//     if (isLineMode) {
//       parts.push(`
//         <defs>
//           <linearGradient id="glowGrad" x1="0" y1="0" x2="0" y2="1">
//             <stop offset="0%" stop-color="${trendColor}" stop-opacity="0.5"/>
//             <stop offset="100%" stop-color="${trendColor}" stop-opacity="0"/>
//           </linearGradient>
//           <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
//             <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
//             <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
//           </filter>
//         </defs>
//       `);
//       let linePath = '';
//       visibleData.forEach((c, i) => {
//         const x = xForT(c.t);
//         const y = yForP(c.c);
//         if (i === 0) linePath += `M ${x} ${y}`;
//         else {
//           const prevX = xForT(visibleData[i - 1].t);
//           const prevY = yForP(visibleData[i - 1].c);
//           const cpX = (x + prevX) / 2;
//           linePath += ` C ${cpX} ${prevY}, ${cpX} ${y}, ${x} ${y}`;
//         }
//       });
//       const areaPath = `${linePath} L ${xForT(visibleData[visibleData.length - 1].t)} ${PAD_T + plotH} L ${xForT(visibleData[0].t)} ${PAD_T + plotH} Z`;
//       parts.push(`<path d="${areaPath}" fill="url(#glowGrad)" />`);
//       parts.push(`<path d="${linePath}" fill="none" stroke="${trendColor}" stroke-width="2.5" filter="url(#glowFilter)" />`);
//     } else {
//       visibleData.forEach((c, i) => {
//         const cx = xForT(c.t);
//         const isBull = c.c >= c.o;
//         const color = isBull ? "#10b981" : "#ef4444";
//         parts.push(`<line x1="${cx}" y1="${yForP(c.h)}" x2="${cx}" y2="${yForP(c.l)}" stroke="${color}" stroke-width="1.5"/>`);
//         parts.push(`<rect x="${cx - slotW*0.35}" y="${Math.min(yForP(c.o), yForP(c.c))}" width="${slotW*0.7}" height="${Math.max(1, Math.abs(yForP(c.c) - yForP(c.o)))}" fill="${color}" rx="1"/>`);
//       });
//     }

//     // 4. Drawings
//     drawings.forEach(d => {
//       const isSelected = selectedDrawingIds.includes(d.id);
//       const stroke = isSelected ? "#3b82f6" : "#eab308";
//       const fill = isSelected ? "rgba(59, 130, 246, 0.1)" : "rgba(234, 179, 8, 0.1)";

//       const x1 = xForT(d.start.t);
//       const y1 = yForP(d.start.p);
//       const x2 = xForT(d.end.t);
//       const y2 = yForP(d.end.p);

//       if (d.type === "line") {
//         parts.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${isSelected ? 3 : 2}" pointer-events="stroke" cursor="pointer" data-id="${d.id}" />`);
//       } else if (d.type === "hline") {
//         parts.push(`<line x1="${PAD_L}" y1="${y1}" x2="${W - PAD_R}" y2="${y1}" stroke="${stroke}" stroke-width="${isSelected ? 3 : 2}" stroke-dasharray="5 5" pointer-events="stroke" cursor="pointer" data-id="${d.id}" />`);
//       } else if (d.type === "ray") {
//         const dx = x2 - x1;
//         const dy = y2 - y1;
//         const extX = W - PAD_R;
//         const extY = y1 + (dy / dx) * (extX - x1);
//         parts.push(`<line x1="${x1}" y1="${y1}" x2="${extX}" y2="${extY}" stroke="${stroke}" stroke-width="${isSelected ? 3 : 2}" pointer-events="stroke" cursor="pointer" data-id="${d.id}" />`);
//       } else if (d.type === "rect") {
//         const rx = Math.min(x1, x2);
//         const ry = Math.min(y1, y2);
//         const rw = Math.abs(x1 - x2);
//         const rh = Math.abs(y1 - y2);
//         parts.push(`<rect x="${rx}" y="${ry}" width="${rw}" height="${rh}" fill="${fill}" stroke="${stroke}" stroke-width="${isSelected ? 3 : 2}" pointer-events="stroke" cursor="pointer" data-id="${d.id}" />`);
//       } else if (d.type === "fib") {
//         const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
//         const top = Math.min(y1, y2);
//         const bottom = Math.max(y1, y2);
//         const height = bottom - top;
//         const left = Math.min(x1, x2);
//         const right = Math.max(x1, x2);

//         parts.push(`<line x1="${left}" y1="${top}" x2="${right}" y2="${top}" stroke="${stroke}" stroke-width="1" />`);
//         parts.push(`<line x1="${left}" y1="${bottom}" x2="${right}" y2="${bottom}" stroke="${stroke}" stroke-width="1" />`);
//         parts.push(`<line x1="${left}" y1="${top}" x2="${left}" y2="${bottom}" stroke="${stroke}" stroke-width="1" opacity="0.5" />`);
//         parts.push(`<line x1="${right}" y1="${top}" x2="${right}" y2="${bottom}" stroke="${stroke}" stroke-width="1" opacity="0.5" />`);

//         levels.forEach(l => {
//           const ly = top + height * l;
//           parts.push(`<line x1="${left}" y1="${ly}" x2="${right}" y2="${ly}" stroke="${stroke}" stroke-width="${isSelected ? 2 : 1}" stroke-dasharray="3 3" pointer-events="stroke" cursor="pointer" data-id="${d.id}" />`);
//           parts.push(`<text x="${left + 4}" y="${ly - 4}" fill="${stroke}" font-size="9" font-family="monospace">${(l * 100).toFixed(1)}%</text>`);
//         });
//       }
//     });

//     // 5. Live Price
//     const last = visibleData[visibleData.length - 1];
//     const lastY = yForP(last.c);
//     parts.push(`<line x1="${PAD_L}" y1="${lastY}" x2="${W - PAD_R}" y2="${lastY}" stroke="${trendColor}" stroke-width="1" stroke-dasharray="2 2"/>`);
//     parts.push(`<rect x="${W - PAD_R + 2}" y="${lastY - 9}" width="60" height="18" fill="${trendColor}" rx="3"/>`);
//     parts.push(`<text x="${W - PAD_R + 6}" y="${lastY + 4}" fill="#000" font-size="10" font-weight="bold" font-family="monospace">${currencySymbol}${last.c.toFixed(last.c < 1 ? 6 : 2)}</text>`);

//     svg.innerHTML = parts.join("");
//   }, [zoom, drawings, selectedDrawingIds, currencySymbol, timeframe]);

//   const [isDrawing, setIsDrawing] = useState(false);
//   const [startPos, setStartPos] = useState<{ x: number, y: number, t: number, p: number } | null>(null);

//   const getCoords = (e: React.MouseEvent) => {
//     const svg = svgRef.current;
//     if (!svg) return null;
//     const rect = svg.getBoundingClientRect();
//     const x = e.clientX - rect.left;
//     const y = e.clientY - rect.top;

//     const container = chartContainerRef.current;
//     if (!container) return null;
//     const W = container.clientWidth;
//     const H = container.clientHeight;
//     const data = candlesRef.current;
//     const visibleCount = Math.max(10, Math.floor(data.length / zoom));
//     const visibleData = data.slice(-visibleCount);

//     let pMin = Math.min(...visibleData.map(c => c.l));
//     let pMax = Math.max(...visibleData.map(c => c.h));
//     const padP = (pMax - pMin) * 0.1 || 1;
//     pMin -= padP; pMax += padP;

//     const PAD_L = 10, PAD_R = 65, PAD_T = 20, PAD_B = 30;
//     const plotW = W - PAD_L - PAD_R;
//     const plotH = H - PAD_T - PAD_B;

//     const pForY = (y: number) => pMin + (1 - (y - PAD_T) / plotH) * (pMax - pMin);
//     const tMin = visibleData[0].t;
//     const tMax = visibleData[visibleData.length - 1].t;
//     const tForX = (x: number) => tMin + ((x - PAD_L) / plotW) * (tMax - tMin);

//     return { x, y, t: tForX(x), p: pForY(y) };
//   };

//   const handleMouseMove = (e: React.MouseEvent) => {
//     const coords = getCoords(e);
//     if (!coords) return;
//     setMousePos({ x: coords.x, y: coords.y, price: coords.p, time: coords.t });
//   };

//   const handleMouseLeave = () => {
//     setMousePos(null);
//   };

//   const handleMouseDown = (e: React.MouseEvent) => {
//     const coords = getCoords(e);
//     if (!coords) return;

//     if (activeTool === "cursor") {
//       setPinnedInfo({ x: coords.x, y: coords.y, price: coords.p, time: coords.t });
//       const target = e.target as SVGElement;
//       const drawingId = target.getAttribute("data-id");

//       if (drawingId) {
//         if (e.shiftKey) {
//           setSelectedDrawingIds(prev =>
//             prev.includes(drawingId) ? prev.filter(id => id !== drawingId) : [...prev, drawingId]
//           );
//         } else {
//           setSelectedDrawingIds([drawingId]);
//         }
//       } else {
//         setSelectedDrawingIds([]);
//         setPinnedInfo(null);
//       }

//     } else if (activeTool === "hline") {
//       const newDrawing = { id: Date.now().toString(), type: "hline", start: { t: coords.t, p: coords.p }, end: { t: coords.t, p: coords.p } };
//       setDrawings(prev => [...prev, newDrawing]);
//       if (activeTradeId) saveDrawingAction(activeTradeId, newDrawing);
//       setActiveTool("cursor");
//       setShowToolsModal(false);
//     } else {
//       setIsDrawing(true);
//       setStartPos(coords);
//     }
//   };

//   const handleMouseUp = (e: React.MouseEvent) => {
//     if (!isDrawing || !startPos) return;
//     const coords = getCoords(e);
//     if (!coords) return;

//     if (Math.abs(coords.x - startPos.x) > 5 || Math.abs(coords.y - startPos.y) > 5) {
//       const newDrawing = {
//         id: Date.now().toString(),
//         type: activeTool,
//         start: { t: startPos.t, p: startPos.p },
//         end: { t: coords.t, p: coords.p }
//       };
//       setDrawings(prev => [...prev, newDrawing]);
//       if (activeTradeId) saveDrawingAction(activeTradeId, newDrawing);
//     }
//     setIsDrawing(false);
//     setActiveTool("cursor");
//     setShowToolsModal(false);
//   };

//   const deleteSelected = async () => {
//     if (selectedDrawingIds.length === 0) return;
//     setDrawings(prev => prev.filter(d => !selectedDrawingIds.includes(d.id)));
//     if (activeTradeId) {
//       for (const id of selectedDrawingIds) {
//         await deleteDrawingAction(activeTradeId, id);
//       }
//     }
//     setSelectedDrawingIds([]);
//   };

//   useEffect(() => {
//     candlesRef.current = generateCandles(activePairId, timeframe);
//     renderChart();
//     const ro = new ResizeObserver(renderChart);
//     if (chartContainerRef.current) ro.observe(chartContainerRef.current);
//     return () => ro.disconnect();
//   }, [activePairId, generateCandles, renderChart, timeframe]);

//   const handleDeleteHistory = (id: string) => {
//     setTrades(prev => prev.filter(t => t._id !== id && t.id !== id));
//     setSelectedHistoryTrade(null);
//   };

//   const handleCloseOrForfeit = (trade: any) => {
//     const id = trade._id || trade.id;
//     const isProfit = (trade.pnl || 0) > 0;

//     if (window.confirm(isProfit ? "Are you sure you want to Take Profit?" : "Are you sure you want to Close & Forfeit this trade?")) {
//       if (onClosePosition) {
//         onClosePosition(id);
//       } else {
//         closeTradeAction(id, coin ? coin.current_price : 0).then(() => {
//           setTrades(prev => prev.filter(t => t._id !== id));
//         });
//       }
//       setSelectedHistoryTrade(null);
//     }
//   };

//   const allAvailableAssets = React.useMemo(() => {
//     // 1. Start with the database assets
//     const baseAssets = dbAssets.map(a => ({
//       id: a.symbol,
//       symbol: a.symbol,
//       name: a.name,
//       color: a.color
//     }));

//     // 2. Merge live CoinGecko quotes
//     if (availableQuotes.length > 0) {
//       availableQuotes.forEach(q => {
//         if (!baseAssets.find(a => a.symbol === q.symbol.toUpperCase())) {
//           baseAssets.push({
//             id: q.id,
//             symbol: q.symbol.toUpperCase(),
//             name: q.name,
//             color: q.category === 'crypto' ? "#f59e0b" : q.category === 'memes' ? "#ec4899" : "#3b82f6"
//           });
//         }
//       });
//     }

//     // 3. Keep the active coin
//     if (coin) {
//       if (!baseAssets.find(a => a.symbol === coin.symbol.toUpperCase())) {
//         baseAssets.unshift({
//           id: coin.id,
//           symbol: coin.symbol.toUpperCase(),
//           name: coin.name,
//           color: "#f59e0b"
//         });
//       }
//     }

//     return baseAssets;
//   }, [dbAssets, availableQuotes, coin]);

//   // 👇 These were missing (causing TS2304 / TS7006). Defined before JSX.
//   const filteredAssets = allAvailableAssets.filter((asset: any) =>
//     (asset.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
//     (asset.symbol || "").toLowerCase().includes(searchQuery.toLowerCase())
//   );

//   const filteredHistory = activeTradesList.filter((t: any) =>
//     (t.baseAsset || t.symbol || "").toLowerCase().includes(historySearch.toLowerCase())
//   );

//   return (
//     <div className="flex flex-col h-full bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-2xl border border-lime-500/20 dark:border-lime-500/10 rounded-3xl shadow-[0_8px_32px_0_rgba(132,204,22,0.15)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] overflow-hidden relative">

//       {/* HEADER */}
//       <div id="tour-terminal-header" className="flex items-center justify-between p-3 border-b border-lime-500/10 bg-white/40 dark:bg-[#121A14]/60 backdrop-blur-md shrink-0">
//         <button
//           onClick={() => { setIsSelectingPair(true); setSelectionStep("base"); setSearchQuery(""); }}
//           className="flex items-center gap-2 bg-white/50 dark:bg-[#050806]/80 px-3 py-1.5 rounded-lg border border-lime-500/20 hover:border-lime-500 cursor-pointer transition-colors"
//         >
//           <span className="text-sm font-bold uppercase tracking-wider text-lime-950 dark:text-[#ecfdf5]">
//             {baseAsset} / {quoteAsset}
//           </span>
//           <ChevronDown size={14} className="text-lime-600 dark:text-lime-400" />
//         </button>

//         <div className={`text-xs font-bold px-2 py-1 rounded ${isMarketOpen ? "bg-green-500/10 text-green-600 dark:text-green-500" : "bg-red-500/10 text-red-600 dark:text-red-500"}`}>
//           {isMarketOpen ? "MARKET OPEN" : "MARKET CLOSED"}
//         </div>
//       </div>

//       {/* EXPANDED CHART AREA */}
//       <div className="flex-1 flex flex-col relative overflow-hidden">

//         <div className="flex items-center justify-between gap-2 p-2 bg-white/30 dark:bg-[#121A14]/50 border-b border-lime-500/10 backdrop-blur z-10">
//           <button
//             id="tour-terminal-tools"
//             onClick={() => { setShowToolsModal(!showToolsModal); setShowTimeframeModal(false); }}
//             className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-colors shadow-sm ${showToolsModal ? "bg-lime-600 text-white border-lime-600" : "bg-white/50 dark:bg-[#050806]/80 border-lime-500/20 text-lime-800 dark:text-lime-200 hover:border-lime-500/50"}`}
//           >
//             <Settings2 size={16} />
//             <span className="text-[11px] font-bold uppercase tracking-wider">Tools</span>
//           </button>

//           <button
//             id="tour-terminal-timeframe"
//             onClick={() => { setShowTimeframeModal(!showTimeframeModal); setShowToolsModal(false); }}
//             className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-colors shadow-sm ${showTimeframeModal ? "bg-lime-600 text-white border-lime-600" : "bg-white/50 dark:bg-[#050806]/80 border-lime-500/20 text-lime-800 dark:text-lime-200 hover:border-lime-500/50"}`}
//           >
//             <Clock size={14} className={showTimeframeModal ? "text-white" : "text-lime-600 dark:text-lime-400"} />
//             <span className="text-[11px] font-bold font-mono tracking-wider">{TIMEFRAMES[timeframe].label}</span>
//             <ChevronDown size={14} className={showTimeframeModal ? "text-white" : "text-lime-600 dark:text-lime-400"} />
//           </button>
//         </div>

//         <div
//           id="tour-terminal-chart"
//           ref={chartContainerRef}
//           className="flex-1 w-full h-full cursor-crosshair bg-transparent relative"
//           onWheel={(e) => {
//             if (e.deltaY > 0) setZoom(z => Math.max(0.5, z / 1.1));
//             else setZoom(z => Math.min(10, z * 1.1));
//           }}
//           onMouseMove={handleMouseMove}
//           onMouseLeave={handleMouseLeave}
//           onMouseDown={handleMouseDown}
//           onMouseUp={handleMouseUp}
//         >
//           <svg ref={svgRef} className="w-full h-full block" />

//           {/* CROSSHAIR TOOLTIP */}
//           {pinnedInfo && (
//             <div
//               className="absolute z-30 bg-[#0a0f0b]/90 border border-lime-500/30 text-white text-[10px] font-mono p-2 rounded-lg shadow-xl pointer-events-none flex flex-col gap-1 backdrop-blur-md"
//               style={{
//                 left: pinnedInfo.x > (chartContainerRef.current!.clientWidth / 2) ? pinnedInfo.x - 100 : pinnedInfo.x + 15,
//                 top: pinnedInfo.y - 40
//               }}
//             >
//               <div className="text-lime-400 font-bold">{currencySymbol}{pinnedInfo.price.toFixed(2)}</div>
//               <div className="text-gray-400">{new Date(pinnedInfo.time).toLocaleTimeString()}</div>
//             </div>
//           )}

//           {mousePos && !pinnedInfo && (
//             <div
//               className="absolute z-20 bg-[#0a0f0b]/80 border border-lime-500/20 text-white text-[10px] font-mono p-1.5 rounded-lg shadow-lg pointer-events-none flex flex-col opacity-80"
//               style={{ left: mousePos.x + 15, top: mousePos.y - 30 }}
//             >
//               <div>{currencySymbol}{mousePos.price.toFixed(2)}</div>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* BOTTOM ALLOWANCE: HISTORY TRIGGER */}
//       <div className="shrink-0 p-3 bg-white/40 dark:bg-[#121A14]/60 backdrop-blur-md border-t border-lime-500/10">
//         <button
//           id="tour-terminal-history"
//           onClick={() => setShowHistoryModal(true)}
//           className="w-full flex items-center justify-between bg-white/50 dark:bg-[#050806]/80 border border-lime-500/20 rounded-xl px-4 py-3 hover:border-lime-500/50 transition-colors group"
//         >
//           <div className="flex items-center gap-2 text-lime-800 dark:text-lime-200 font-bold text-sm">
//             <History size={16} className="text-lime-600 dark:text-lime-400" />
//             Trade History
//           </div>
//           <div className="flex items-center gap-2 text-xs font-mono text-lime-600 dark:text-lime-400">
//             {activeTradesList.length} Trades
//             <ChevronDown size={14} className="group-hover:translate-y-0.5 transition-transform" />
//           </div>
//         </button>
//       </div>

//       {/* HISTORY MODAL */}
//       <AnimatePresence>
//         {showHistoryModal && (
//           <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm">
//             <motion.div
//               initial={{ opacity: 0, scale: 0.95, y: 20 }}
//               animate={{ opacity: 1, scale: 1, y: 0 }}
//               exit={{ opacity: 0, scale: 0.95, y: 20 }}
//               className="relative w-full max-w-lg bg-[#f4fbf5]/95 dark:bg-[#0a0f0b]/95 backdrop-blur-2xl border border-lime-500/30 dark:border-lime-500/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
//             >
//               <div className="p-4 border-b border-lime-500/10 flex justify-between items-center bg-white/40 dark:bg-[#121A14]/60 shrink-0">
//                 <h2 className="text-lg font-bold text-lime-950 dark:text-white flex items-center gap-2">
//                   <History size={18} className="text-lime-500" /> Trade History
//                 </h2>
//                 <button onClick={() => setShowHistoryModal(false)} className="p-1.5 rounded-lg hover:bg-lime-500/10 text-lime-600 dark:text-lime-400 transition-colors">
//                   <X size={18} />
//                 </button>
//               </div>

//               <div className="p-3 shrink-0">
//                 <div className="relative">
//                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-lime-600/50 dark:text-lime-400/50" size={16} />
//                   <input
//                     type="text"
//                     placeholder="Search history..."
//                     value={historySearch}
//                     onChange={(e) => setHistorySearch(e.target.value)}
//                     className="w-full bg-white/50 dark:bg-[#050806]/80 border border-lime-500/20 rounded-full py-2 pl-9 pr-4 text-sm text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 transition-colors"
//                   />
//                 </div>
//               </div>

//               <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
//                 {filteredHistory.map((t) => (
//                   <div
//                     key={t._id || t.id}
//                     className={`p-3 rounded-2xl border transition-colors flex flex-col gap-2 cursor-pointer ${
//                       activeTradeId === (t._id || t.id)
//                         ? "border-lime-500 bg-lime-500/10"
//                         : "border-lime-500/20 dark:border-lime-500/10 bg-white/50 dark:bg-[#121A14]/50 hover:border-lime-500/50"
//                     }`}
//                     onClick={() => setActiveTradeId(t._id || t.id)}
//                   >
//                     <div className="flex justify-between items-center">
//                       <div className="flex items-center gap-2">
//                         <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${t.side === 'buy' ? 'bg-green-500/20 text-green-600' : 'bg-red-500/20 text-red-600'}`}>
//                           {t.side?.toUpperCase() || "BUY"}
//                         </span>
//                         <span className="font-bold text-sm text-lime-950 dark:text-white">
//                           {t.baseAsset || t.symbol}/{t.quoteAsset || "USD"}
//                         </span>
//                       </div>
//                       <span className={`font-mono text-sm font-bold ${t.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
//                         {t.pnl >= 0 ? "+" : ""}{currencySymbol}{(t.pnl || 0).toFixed(2)}
//                       </span>
//                     </div>

//                     <div className="flex justify-between items-center text-xs font-mono text-lime-800/60 dark:text-lime-200/50">
//                       <div>Qty: {t.amount || t.lots} @ ${t.entryPrice || t.entry}</div>
//                       <div className="flex gap-1">
//                         <button onClick={(e) => { e.stopPropagation(); setSelectedHistoryTrade(t); }} className="p-1.5 bg-lime-500/10 text-lime-600 rounded hover:bg-lime-500/20" title="View Details"><Eye size={14} /></button>
//                         <button onClick={(e) => { e.stopPropagation(); handleDeleteHistory(t._id || t.id); }} className="p-1.5 bg-red-500/10 text-red-600 rounded hover:bg-red-500/20" title="Delete Record"><Trash2 size={14} /></button>

//                         <button
//                           onClick={(e) => { e.stopPropagation(); handleCloseOrForfeit(t); }}
//                           className={`px-2 py-1 rounded font-bold text-[10px] transition-colors ${
//                             (t.pnl || 0) > 0
//                               ? "bg-green-500/10 text-green-600 hover:bg-green-500/20"
//                               : "bg-red-500/10 text-red-600 hover:bg-red-500/20"
//                           }`}
//                         >
//                           {(t.pnl || 0) > 0 ? "Take Profit" : "Close & Forfeit"}
//                         </button>
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//                 {filteredHistory.length === 0 && (
//                   <div className="text-center text-xs text-lime-800/60 dark:text-lime-200/50 py-8">
//                     No trade history found.
//                   </div>
//                 )}
//               </div>
//             </motion.div>
//           </div>
//         )}
//       </AnimatePresence>

//       {/* DETAILS SUB-MODAL */}
//       <AnimatePresence>
//         {selectedHistoryTrade && (
//           <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm">
//             <motion.div
//               initial={{ opacity: 0, scale: 0.95 }}
//               animate={{ opacity: 1, scale: 1 }}
//               exit={{ opacity: 0, scale: 0.95 }}
//               className="relative w-full max-w-sm bg-[#f4fbf5]/95 dark:bg-[#0a0f0b]/95 border border-lime-500/30 rounded-3xl p-6 shadow-2xl flex flex-col gap-4"
//             >
//               <div className="flex justify-between items-center border-b border-lime-500/10 pb-3">
//                 <h3 className="font-bold text-lime-950 dark:text-white">Trade Details</h3>
//                 <button onClick={() => setSelectedHistoryTrade(null)} className="text-gray-500 hover:text-red-500"><X size={16} /></button>
//               </div>
//               <div className="space-y-2 text-sm font-mono">
//                 <div className="flex justify-between"><span className="text-gray-500">Asset:</span> <span className="font-bold text-lime-950 dark:text-white">{selectedHistoryTrade.baseAsset || selectedHistoryTrade.symbol}</span></div>
//                 <div className="flex justify-between"><span className="text-gray-500">Side:</span> <span className={`font-bold uppercase ${selectedHistoryTrade.side === 'buy' ? 'text-green-500' : 'text-red-500'}`}>{selectedHistoryTrade.side}</span></div>
//                 <div className="flex justify-between"><span className="text-gray-500">Entry Price:</span> <span className="text-lime-950 dark:text-white">${selectedHistoryTrade.entryPrice || selectedHistoryTrade.entry}</span></div>
//                 <div className="flex justify-between"><span className="text-gray-500">Quantity:</span> <span className="text-lime-950 dark:text-white">{selectedHistoryTrade.amount || selectedHistoryTrade.lots}</span></div>
//                 <div className="flex justify-between"><span className="text-gray-500">PnL:</span> <span className={`font-bold ${selectedHistoryTrade.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>{selectedHistoryTrade.pnl >= 0 ? "+" : ""}{currencySymbol}{(selectedHistoryTrade.pnl || 0).toFixed(2)}</span></div>
//               </div>
//               <button onClick={() => setSelectedHistoryTrade(null)} className="mt-4 w-full py-2 bg-lime-600 text-white font-bold rounded-xl hover:bg-lime-700 transition-colors">Close Details</button>
//             </motion.div>
//           </div>
//         )}
//       </AnimatePresence>

//       {/* TIMEFRAME MODAL */}
//       <AnimatePresence>
//         {showTimeframeModal && (
//           <motion.div
//             initial={{ opacity: 0, y: 10, scale: 0.95 }}
//             animate={{ opacity: 1, y: 0, scale: 1 }}
//             exit={{ opacity: 0, y: 10, scale: 0.95 }}
//             className="absolute top-28 right-2 z-50 p-3 bg-white/95 dark:bg-[#121A14]/95 backdrop-blur-xl border border-lime-500/30 dark:border-lime-500/20 rounded-2xl shadow-2xl w-56"
//           >
//             <div className="flex items-center justify-between mb-3 px-1">
//               <span className="text-[10px] font-bold text-lime-800/60 dark:text-lime-200/50 uppercase tracking-widest">Timeframes</span>
//               <button onClick={() => setShowTimeframeModal(false)} className="text-red-500 hover:bg-red-500/10 p-1 rounded-full transition-colors"><X size={14} /></button>
//             </div>

//             <div className="grid grid-cols-3 gap-1.5 max-h-64 overflow-y-auto custom-scrollbar">
//               {Object.entries(TIMEFRAMES).map(([key, tf]) => (
//                 <button
//                   key={key}
//                   onClick={() => { setTimeframe(key); setShowTimeframeModal(false); }}
//                   className={`py-2 rounded-lg text-[11px] font-bold font-mono transition-all flex items-center justify-center ${
//                     timeframe === key
//                       ? "bg-lime-600 text-white shadow-md"
//                       : "text-lime-800 dark:text-lime-200 bg-lime-500/5 hover:bg-lime-500/15"
//                   }`}
//                 >
//                   {tf.label}
//                 </button>
//               ))}
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       {/* TOOLS MODAL */}
//       <AnimatePresence>
//         {showToolsModal && (
//           <motion.div
//             initial={{ opacity: 0, y: 10, scale: 0.95 }}
//             animate={{ opacity: 1, y: 0, scale: 1 }}
//             exit={{ opacity: 0, y: 10, scale: 0.95 }}
//             className="absolute top-28 left-2 z-50 p-2 bg-white/95 dark:bg-[#121A14]/95 backdrop-blur-xl border border-lime-500/30 dark:border-lime-500/20 rounded-2xl shadow-2xl flex flex-col gap-1 w-14"
//           >
//             <button onClick={() => setShowToolsModal(false)} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-md hover:bg-red-600"><X size={12} /></button>

//             <button onClick={() => { setActiveTool("cursor"); setShowToolsModal(false); }} className={`p-2 rounded-xl flex justify-center transition-colors ${activeTool === "cursor" ? "bg-lime-600 text-white shadow-md" : "text-lime-800 dark:text-lime-200 hover:bg-lime-500/10"}`} title="Cursor"><Crosshair size={20} /></button>
//             <button onClick={() => { setActiveTool("line"); setShowToolsModal(false); }} className={`p-2 rounded-xl flex justify-center transition-colors ${activeTool === "line" ? "bg-lime-600 text-white shadow-md" : "text-lime-800 dark:text-lime-200 hover:bg-lime-500/10"}`} title="Trend Line"><PenTool size={20} /></button>
//             <button onClick={() => { setActiveTool("hline"); setShowToolsModal(false); }} className={`p-2 rounded-xl flex justify-center transition-colors ${activeTool === "hline" ? "bg-lime-600 text-white shadow-md" : "text-lime-800 dark:text-lime-200 hover:bg-lime-500/10"}`} title="Horizontal Line"><Minus size={20} /></button>
//             <button onClick={() => { setActiveTool("ray"); setShowToolsModal(false); }} className={`p-2 rounded-xl flex justify-center transition-colors ${activeTool === "ray" ? "bg-lime-600 text-white shadow-md" : "text-lime-800 dark:text-lime-200 hover:bg-lime-500/10"}`} title="Ray"><MoveUpRight size={20} /></button>
//             <button onClick={() => { setActiveTool("rect"); setShowToolsModal(false); }} className={`p-2 rounded-xl flex justify-center transition-colors ${activeTool === "rect" ? "bg-lime-600 text-white shadow-md" : "text-lime-800 dark:text-lime-200 hover:bg-lime-500/10"}`} title="Rectangle"><Square size={20} /></button>
//             <button onClick={() => { setActiveTool("fib"); setShowToolsModal(false); }} className={`p-2 rounded-xl flex justify-center transition-colors ${activeTool === "fib" ? "bg-lime-600 text-white shadow-md" : "text-lime-800 dark:text-lime-200 hover:bg-lime-500/10"}`} title="Fibonacci"><AlignEndHorizontal size={20} /></button>

//             <div className="h-px w-full bg-lime-500/20 my-1" />

//             <button onClick={deleteSelected} disabled={selectedDrawingIds.length === 0} className={`p-2 rounded-xl flex justify-center transition-colors ${selectedDrawingIds.length > 0 ? "text-red-500 hover:bg-red-500/10" : "text-lime-500/30 dark:text-lime-200/20 cursor-not-allowed"}`} title="Delete Selected"><Trash2 size={20} /></button>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       {/* PAIR SELECTOR MODAL */}
//       <AnimatePresence>
//         {isSelectingPair && (
//           <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm">
//             <motion.div
//               initial={{ opacity: 0, scale: 0.95, y: 20 }}
//               animate={{ opacity: 1, scale: 1, y: 0 }}
//               exit={{ opacity: 0, scale: 0.95, y: 20 }}
//               className="relative w-full max-w-md bg-[#f4fbf5]/95 dark:bg-[#0a0f0b]/95 backdrop-blur-2xl border border-lime-500/30 dark:border-lime-500/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
//             >
//               <div className="p-4 border-b border-lime-500/10 flex justify-between items-center bg-white/40 dark:bg-[#121A14]/60 shrink-0">
//                 <h2 className="text-lg font-bold text-lime-950 dark:text-white">
//                   Select {selectionStep === "base" ? "Base Asset" : "Quote Asset"}
//                 </h2>
//                 <button onClick={() => setIsSelectingPair(false)} className="p-1.5 rounded-lg hover:bg-lime-500/10 text-lime-600 dark:text-lime-400 transition-colors">
//                   <X size={18} />
//                 </button>
//               </div>

//               <div className="p-3 shrink-0">
//                 <div className="relative">
//                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-lime-600/50 dark:text-lime-400/50" size={16} />
//                   <input
//                     type="text"
//                     placeholder="Search assets..."
//                     value={searchQuery}
//                     onChange={(e) => setSearchQuery(e.target.value)}
//                     className="w-full bg-white/50 dark:bg-[#050806]/80 border border-lime-500/20 rounded-full py-2 pl-9 pr-4 text-sm text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 transition-colors"
//                   />
//                 </div>
//               </div>

//               <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
//                 {filteredAssets.map((asset) => (
//                   <button
//                     key={asset.id}
//                     onClick={() => {
//                       if (selectionStep === "base") {
//                         setBaseAsset(asset.symbol);
//                         setSelectionStep("quote");
//                         setSearchQuery("");
//                       } else {
//                         if (asset.symbol === baseAsset) return;
//                         setQuoteAsset(asset.symbol);
//                         setIsSelectingPair(false);
//                       }
//                     }}
//                     className={`w-full p-3 rounded-2xl border flex items-center justify-between transition-colors ${baseAsset === asset.symbol && selectionStep === "quote" ? "opacity-50 cursor-not-allowed border-lime-500/10 bg-white/30 dark:bg-[#121A14]/30" : "border-lime-500/20 dark:border-lime-500/10 bg-white/50 dark:bg-[#121A14]/50 hover:border-lime-500/50 hover:bg-white/80 dark:hover:bg-[#121A14]/80"}`}
//                   >
//                     <div className="flex items-center gap-3">
//                       <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-black shadow-sm" style={{ background: asset.color || "#84cc16" }}>
//                         {asset.symbol[0]}
//                       </div>
//                       <div className="text-left">
//                         <div className="font-bold text-sm text-lime-950 dark:text-white uppercase">{asset.symbol}</div>
//                         <div className="text-xs text-lime-800/60 dark:text-lime-200/50">{asset.name}</div>
//                       </div>
//                     </div>
//                     <div className="text-right">
//                       <div className="font-mono text-sm font-bold text-lime-950 dark:text-white">
//                         {asset.symbol === coin?.symbol?.toUpperCase() ? `$${coin.current_price.toFixed(2)}` : `$${(COMMODITIES[asset.symbol]?.base || 0).toFixed(2)}`}
//                       </div>
//                       <div className="text-[10px] font-bold text-green-500 flex items-center justify-end">
//                         <ArrowUpRight size={10} className="mr-1"/> +2.4%
//                       </div>
//                     </div>
//                   </button>
//                 ))}
//               </div>

//               <div className="p-3 border-t border-lime-500/10 bg-white/40 dark:bg-[#121A14]/60 shrink-0">
//                 <button
//                   onClick={() => {
//                     setIsSelectingPair(false);
//                     router.push("/markets");
//                   }}
//                   className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-lime-500/10 hover:bg-lime-500/20 border border-lime-500/20 text-lime-700 dark:text-lime-300 font-bold text-sm transition-colors"
//                 >
//                   <LayoutGrid size={16} />
//                   {selectionStep === "base" ? "Explore All Base Markets" : "Explore All Markets"}
//                 </button>
//               </div>
//             </motion.div>
//           </div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// }