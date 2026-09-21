import { useEffect, useRef, useState } from 'react';
import { createChart, CandlestickSeries, LineStyle } from 'lightweight-charts';

export default function IntradayChart({ symbol, vwap, openingRangeHigh, openingRangeLow }) {
  const chartContainerRef = useRef();
  const chartInstance = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/company/${encodeURIComponent(symbol)}/chart?range=5d&interval=5m`);
        const json = await res.json();
        
        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Failed to fetch chart data');
        }

        const points = json.data?.points || [];
        // Format for lightweight-charts: { time, open, high, low, close }
        // Time must be a unix timestamp in seconds for lightweight-charts, sorted & deduplicated
        const seenTimes = new Set();
        const candlestickData = points
          .map(p => ({
            time: Math.floor((p.timestamp ? new Date(p.timestamp).getTime() : new Date(p.date).getTime()) / 1000),
            open: Number(p.open),
            high: Number(p.high),
            low: Number(p.low),
            close: Number(p.close),
          }))
          .filter(p => !isNaN(p.time) && !isNaN(p.open) && !isNaN(p.close))
          .sort((a, b) => a.time - b.time)
          .filter(p => {
            if (seenTimes.has(p.time)) return false;
            seenTimes.add(p.time);
            return true;
          });

        if (active) {
          renderChart(candlestickData);
          setLoading(false);
        }
      } catch (err) {
        if (active) {
          setError(err.message);
          setLoading(false);
        }
      }
    }

    function renderChart(data) {
      if (chartInstance.current) {
        chartInstance.current.remove();
        chartInstance.current = null;
      }

      if (!chartContainerRef.current) return;

      const chart = createChart(chartContainerRef.current, {
        width: chartContainerRef.current.clientWidth,
        height: 300,
        layout: {
          background: { type: 'solid', color: 'transparent' },
          textColor: '#A3A3A3',
        },
        grid: {
          vertLines: { color: 'rgba(42, 46, 57, 0.3)' },
          horzLines: { color: 'rgba(42, 46, 57, 0.3)' },
        },
        timeScale: {
          timeVisible: true,
          secondsVisible: false,
        },
      });

      const candlestickSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#22c55e',
        downColor: '#ef4444',
        borderVisible: false,
        wickUpColor: '#22c55e',
        wickDownColor: '#ef4444',
      });

      candlestickSeries.setData(data);

      // Add Price Lines
      if (vwap) {
        candlestickSeries.createPriceLine({
          price: Number(vwap),
          color: '#eab308',
          lineWidth: 2,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: 'VWAP',
        });
      }

      if (openingRangeHigh) {
        candlestickSeries.createPriceLine({
          price: Number(openingRangeHigh),
          color: '#3b82f6',
          lineWidth: 1,
          lineStyle: LineStyle.Dotted,
          axisLabelVisible: true,
          title: 'ORH',
        });
      }

      if (openingRangeLow) {
        candlestickSeries.createPriceLine({
          price: Number(openingRangeLow),
          color: '#3b82f6',
          lineWidth: 1,
          lineStyle: LineStyle.Dotted,
          axisLabelVisible: true,
          title: 'ORL',
        });
      }

      chart.timeScale().fitContent();
      chartInstance.current = chart;
    }

    loadData();

    const handleResize = () => {
      if (chartInstance.current && chartContainerRef.current) {
        chartInstance.current.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      active = false;
      window.removeEventListener('resize', handleResize);
      if (chartInstance.current) {
        chartInstance.current.remove();
        chartInstance.current = null;
      }
    };
  }, [symbol, vwap, openingRangeHigh, openingRangeLow]);

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '300px', marginTop: '1rem', marginBottom: '1rem' }}>
      {loading && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>Loading chart...</div>}
      {error && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>{error}</div>}
      <div ref={chartContainerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
