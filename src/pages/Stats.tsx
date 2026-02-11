import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import { categoryApi, expenseApi } from '../services/api';
import type { ExpenseCategory, ExpenseDetailedStatistics } from '../types';
import { CategoryIcon } from '../utils/categoryIcons';
import { formatMoney } from '../utils/format';
import BottomNav from '../components/BottomNav';

type RangeType = 'month' | 'year' | 'custom';

const pad2 = (n: number) => String(n).padStart(2, '0');
const formatLocalDate = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

export default function Stats() {
  const navigate = useNavigate();

  const now = useMemo(() => new Date(), []);
  const defaultYear = String(now.getFullYear());
  const defaultYearMonth = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}`;

  const [rangeType, setRangeType] = useState<RangeType>('month');
  const [year, setYear] = useState(defaultYear);
  const [yearMonth, setYearMonth] = useState(defaultYearMonth);
  const [startDate, setStartDate] = useState(formatLocalDate(new Date(now.getFullYear(), now.getMonth(), 1)));
  const [endDate, setEndDate] = useState(formatLocalDate(now));

  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<ExpenseDetailedStatistics | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await categoryApi.getList();
        if (res.code === 200 && Array.isArray(res.data)) {
          setCategories(res.data);
        }
      } catch {
        // ignore
      }
    })();
  }, []);

  const toggleCategory = (name: string) => {
    setSelectedCategories((prev) => (prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name]));
  };

  const selectAll = () => setSelectedCategories(categories.map((c) => c.name));
  const clearAll = () => setSelectedCategories([]);

  const fetchStats = async () => {
    setError('');
    setLoading(true);
    try {
      const params: any = { range_type: rangeType };
      if (rangeType === 'month') params.year_month = yearMonth;
      else if (rangeType === 'year') params.year = year;
      else {
        params.start_time = startDate;
        params.end_time = endDate;
      }
      if (selectedCategories.length > 0) {
        params.categories = selectedCategories.join(',');
      }
      const res = await expenseApi.getDetailedStatistics(params);
      if (res.code === 200) setData(res.data);
      else setError(res.message || '获取统计失败');
    } catch (e: any) {
      setError(e?.response?.data?.message || '获取统计失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeType]);

  const chartSource = useMemo(() => {
    const stats = data?.category_stats ?? [];
    return [...stats].sort((a, b) => b.total - a.total);
  }, [data]);

  const pieOption = useMemo(() => {
    const seriesData = chartSource.map((s) => ({ name: s.category, value: s.total }));
    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(15,15,15,0.95)',
        borderColor: '#333',
        textStyle: { color: '#d1d5db' },
        formatter: (p: any) => {
          const name = p?.name ?? '';
          const value = p?.value ?? 0;
          const percent = p?.percent ?? 0;
          const item = chartSource.find((x) => x.category === name);
          const count = item?.count ?? 0;
          return `${name}<br/>金额：${formatMoney(Number(value))}<br/>笔数：${count}<br/>占比：${percent}%`;
        }
      },
      legend: {
        type: 'scroll',
        bottom: 0,
        textStyle: { color: '#9ca3af', fontSize: 12 }
      },
      series: [
        {
          name: '分类占比',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['50%', '45%'],
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#0f0f0f',
            borderWidth: 2
          },
          label: { show: false },
          labelLine: { show: false },
          data: seriesData
        }
      ]
    };
  }, [chartSource]);

  const barOption = useMemo(() => {
    const x = chartSource.map((s) => s.category);
    const yAmount = chartSource.map((s) => s.total);
    const yCount = chartSource.map((s) => s.count);
    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: 'rgba(15,15,15,0.95)',
        borderColor: '#333',
        textStyle: { color: '#d1d5db' },
        formatter: (params: any) => {
          const p0 = params?.[0];
          const name = p0?.axisValue ?? '';
          const amount = p0?.data ?? 0;
          const count = params?.[1]?.data ?? 0;
          return `${name}<br/>金额：${formatMoney(Number(amount))}<br/>笔数：${count}`;
        }
      },
      grid: { left: 12, right: 12, top: 24, bottom: 60, containLabel: true },
      xAxis: {
        type: 'category',
        data: x,
        axisLabel: {
          interval: 0,
          rotate: x.length > 6 ? 30 : 0,
          color: '#9ca3af',
          fontSize: 11
        },
        axisLine: { lineStyle: { color: '#333' } }
      },
      yAxis: [
        {
          type: 'value',
          axisLabel: { color: '#6b7280' },
          splitLine: { lineStyle: { color: '#222' } }
        },
        {
          type: 'value',
          axisLabel: { color: '#6b7280' },
          splitLine: { show: false }
        }
      ],
      series: [
        {
          name: '金额',
          type: 'bar',
          data: yAmount,
          yAxisIndex: 0,
          barWidth: 18,
          itemStyle: {
            borderRadius: [10, 10, 0, 0],
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: '#4ade80' },
                { offset: 1, color: '#22c55e' }
              ]
            }
          }
        },
        {
          name: '笔数',
          type: 'line',
          data: yCount,
          yAxisIndex: 1,
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: { width: 3, color: '#f3f4f6' },
          itemStyle: { color: '#f3f4f6' }
        }
      ]
    };
  }, [chartSource]);

  const rangeTitle = useMemo(() => {
    if (rangeType === 'month') return `${yearMonth} 月`;
    if (rangeType === 'year') return `${year} 年`;
    return `${startDate} ~ ${endDate}`;
  }, [rangeType, yearMonth, year, startDate, endDate]);

  return (
    <div className="page" style={{ padding: '0', width: '100%', paddingBottom: '110px' }}>
      <div className="app-bg-texture" />
      <div className="app-bg-gradient" />

      <div style={{ width: '100%', maxWidth: '100%', padding: '20px 20px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* 顶部栏 */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
          <button
            onClick={() => navigate('/home')}
            className="btn"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '10px 14px', minWidth: '44px', minHeight: '44px' }}
          >
            <i className="fa-solid fa-arrow-left" style={{ color: 'var(--text-primary)' }} />
          </button>
          <div style={{ flex: 1, marginLeft: '16px' }}>
            <div className="font-display" style={{ color: 'var(--text-primary)', fontSize: '1.5rem', fontWeight: 600 }}>统计</div>
            <div className="font-tech" style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: '0.9rem' }}>{rangeTitle}</div>
          </div>
          <button
            onClick={fetchStats}
            className="btn"
            style={{ padding: '10px 14px', fontSize: '0.9rem' }}
            disabled={loading}
          >
            {loading ? '刷新中…' : '刷新'}
          </button>
        </div>

        {/* 时间范围 */}
        <div className="card">
          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            {([
              { key: 'month' as RangeType, label: '按月' },
              { key: 'year' as RangeType, label: '按年' },
              { key: 'custom' as RangeType, label: '自定义' }
            ]).map((t) => (
              <button
                key={t.key}
                onClick={() => setRangeType(t.key)}
                className="btn"
                style={{
                  flex: 1,
                  background: rangeType === t.key ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                  color: rangeType === t.key ? 'var(--text-primary)' : 'var(--text-muted)',
                  border: rangeType === t.key ? '1px solid var(--border-subtle)' : '1px solid var(--border-color)',
                  padding: '12px 0',
                  borderRadius: 12
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {rangeType === 'month' && (
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">选择月份</label>
              <input type="month" className="input" value={yearMonth} onChange={(e) => setYearMonth(e.target.value)} />
            </div>
          )}

          {rangeType === 'year' && (
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">选择年份</label>
              <input type="number" className="input" value={year} min={2000} max={2100} onChange={(e) => setYear(e.target.value)} />
            </div>
          )}

          {rangeType === 'custom' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">开始日期</label>
                <input type="date" className="input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">结束日期</label>
                <input type="date" className="input" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
          )}
        </div>

        {/* 类别多选 */}
        <div className="card" style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div className="font-tech" style={{ fontSize: '0.9rem', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-muted)' }}>消费类别（可多选）</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={selectAll} className="btn" style={{ padding: '8px 12px', fontSize: '0.9rem' }}>全选</button>
              <button onClick={clearAll} className="btn" style={{ padding: '8px 12px', fontSize: '0.9rem' }}>清空</button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {categories.map((c) => {
              const active = selectedCategories.includes(c.name);
              return (
                <button
                  key={c.id}
                  onClick={() => toggleCategory(c.name)}
                  className="btn"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '12px',
                    borderRadius: 12,
                    border: active ? '1px solid var(--income-border)' : '1px solid var(--border-color)',
                    background: active ? 'var(--income-bg)' : 'var(--bg-secondary)',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <div className="category-icon" style={{ background: active ? 'rgba(34,197,94,0.2)' : 'var(--bg-tertiary)' }}>
                    <CategoryIcon categoryName={c.name} size={20} />
                  </div>
                  <div className="font-display" style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{c.name}</div>
                </button>
              );
            })}
          </div>

          <button onClick={fetchStats} className="btn btn-primary btn-block metal-shimmer" style={{ marginTop: 16 }} disabled={loading}>
            {loading ? '生成中…' : '生成统计'}
          </button>
        </div>

        {/* 汇总 */}
        <div className="card" style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div className="font-tech" style={{ color: 'var(--text-dim)', fontSize: '0.8rem', marginBottom: 6 }}>总金额</div>
              <div className="font-display" style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--income-color)' }}>
                {formatMoney(data?.total_amount ?? 0)}
              </div>
            </div>
            <div style={{ flex: 1, textAlign: 'right' }}>
              <div className="font-tech" style={{ color: 'var(--text-dim)', fontSize: '0.8rem', marginBottom: 6 }}>总笔数</div>
              <div className="font-display" style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>{data?.total_count ?? 0}</div>
            </div>
          </div>
          {error && (
            <div className="error-message" style={{ marginTop: 12 }}>
              <i className="fa-solid fa-circle-exclamation" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* 图表 */}
        <div className="card" style={{ marginTop: 16 }}>
          <div className="font-tech" style={{ fontSize: '0.9rem', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 12 }}>饼图：分类占比</div>
          <ReactECharts style={{ height: 380, width: '100%' }} option={pieOption as any} notMerge lazyUpdate />
        </div>

        <div className="card" style={{ marginTop: 16, marginBottom: 24 }}>
          <div className="font-tech" style={{ fontSize: '0.9rem', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 12 }}>柱状图：分类金额（折线：笔数）</div>
          <ReactECharts style={{ height: 420, width: '100%' }} option={barOption as any} notMerge lazyUpdate />
        </div>
      </div>

      <BottomNav active="stats" />
    </div>
  );
}
