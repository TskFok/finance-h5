import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import { categoryApi, expenseApi } from '../services/api';
import type { ExpenseCategory, ExpenseDetailedStatistics } from '../types';
import { CategoryIcon } from '../utils/categoryIcons';
import { formatMoney } from '../utils/format';

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
      if (rangeType === 'month') {
        params.year_month = yearMonth;
      } else if (rangeType === 'year') {
        params.year = year;
      } else {
        params.start_time = startDate;
        params.end_time = endDate;
      }
      if (selectedCategories.length > 0) {
        params.categories = selectedCategories.join(',');
      }
      const res = await expenseApi.getDetailedStatistics(params);
      if (res.code === 200) {
        setData(res.data);
      } else {
        setError(res.message || '获取统计失败');
      }
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
    const sorted = [...stats].sort((a, b) => b.total - a.total);
    return sorted;
  }, [data]);

  const pieOption = useMemo(() => {
    const seriesData = chartSource.map((s) => ({
      name: s.category,
      value: s.total
    }));
    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
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
        textStyle: { color: '#2C3E50', fontSize: 14 }
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
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            // 关闭扇区上的文字，避免显示“类别\\n百分比”
            show: false
          },
          labelLine: {
            show: false
          },
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
        formatter: (params: any) => {
          const p0 = params?.[0];
          const p1 = params?.[1];
          const name = p0?.axisValue ?? '';
          const amount = p0?.data ?? 0;
          const count = p1?.data ?? 0;
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
          color: '#2C3E50',
          fontSize: 12
        }
      },
      yAxis: [
        {
          type: 'value',
          axisLabel: {
            color: '#7F8C8D',
            formatter: (v: number) => `${v}`
          }
        },
        {
          type: 'value',
          axisLabel: { color: '#7F8C8D' }
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
                { offset: 0, color: '#66D9A3' },
                { offset: 1, color: '#2FBF71' }
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
          lineStyle: { width: 3, color: '#4A90E2' },
          itemStyle: { color: '#4A90E2' }
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
      <div style={{ width: '100%', maxWidth: '100%', padding: '20px 16px', margin: '0 auto' }}>
        {/* 顶部栏 */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
          <button
            onClick={() => navigate('/home')}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '2rem',
              cursor: 'pointer',
              color: 'white',
              marginRight: '12px',
              padding: '8px',
              minWidth: '44px',
              minHeight: '44px'
            }}
          >
            ←
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ color: 'white', fontSize: '1.75rem', fontWeight: 800 }}>统计</div>
            <div style={{ color: 'rgba(255,255,255,0.9)', marginTop: 6, fontSize: '1rem' }}>{rangeTitle}</div>
          </div>
          <button
            onClick={fetchStats}
            className="btn"
            style={{
              background: 'rgba(255,255,255,0.18)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.25)',
              padding: '10px 14px',
              borderRadius: 12,
              fontSize: '1rem'
            }}
          >
            {loading ? '刷新中…' : '刷新'}
          </button>
        </div>

        {/* 时间范围选择 */}
        <div className="card" style={{ background: 'rgba(255,255,255,0.95)' }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            {([
              { key: 'month', label: '按月' },
              { key: 'year', label: '按年' },
              { key: 'custom', label: '自定义' }
            ] as { key: RangeType; label: string }[]).map((t) => (
              <button
                key={t.key}
                onClick={() => setRangeType(t.key)}
                className="btn"
                style={{
                  flex: 1,
                  background: rangeType === t.key ? 'linear-gradient(135deg, #66D9A3, #2FBF71)' : 'var(--card-bg)',
                  color: rangeType === t.key ? 'white' : 'var(--text-primary)',
                  border: rangeType === t.key ? 'none' : '2px solid var(--border-color)',
                  padding: '12px 0',
                  borderRadius: 14
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
              <input
                type="number"
                className="input"
                value={year}
                min={2000}
                max={2100}
                onChange={(e) => setYear(e.target.value)}
              />
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
        <div className="card" style={{ background: 'rgba(255,255,255,0.95)', marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>消费类别（可多选）</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={selectAll}
                style={{
                  background: 'var(--card-bg)',
                  border: '2px solid var(--border-color)',
                  padding: '8px 12px',
                  borderRadius: 12,
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                全选
              </button>
              <button
                onClick={clearAll}
                style={{
                  background: 'var(--card-bg)',
                  border: '2px solid var(--border-color)',
                  padding: '8px 12px',
                  borderRadius: 12,
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                清空
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {categories.map((c) => {
              const active = selectedCategories.includes(c.name);
              return (
                <button
                  key={c.id}
                  onClick={() => toggleCategory(c.name)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '12px 12px',
                    borderRadius: 14,
                    border: active ? '2px solid rgba(47,191,113,0.9)' : '2px solid var(--border-color)',
                    background: active ? 'rgba(47,191,113,0.10)' : 'var(--card-bg)',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <div className="category-icon" style={{ background: active ? 'rgba(47,191,113,0.18)' : 'rgba(74, 144, 226, 0.12)' }}>
                    <CategoryIcon categoryName={c.name} size={22} />
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>{c.name}</div>
                </button>
              );
            })}
          </div>

          <button
            onClick={fetchStats}
            className="btn btn-primary btn-block"
            style={{ marginTop: 16 }}
            disabled={loading}
          >
            {loading ? '生成中…' : '生成统计'}
          </button>
        </div>

        {/* 汇总卡片 */}
        <div className="card" style={{ background: 'rgba(255,255,255,0.95)', marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: 6 }}>总金额</div>
              <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#2FBF71' }}>
                {formatMoney(data?.total_amount ?? 0)}
              </div>
            </div>
            <div style={{ flex: 1, textAlign: 'right' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: 6 }}>总笔数</div>
              <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#4A90E2' }}>{data?.total_count ?? 0}</div>
            </div>
          </div>
          {error && (
            <div className="error-message" style={{ marginTop: 12 }}>
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* 图表 */}
        <div className="card" style={{ background: 'rgba(255,255,255,0.95)', marginTop: 16 }}>
          <div style={{ fontSize: '1.35rem', fontWeight: 900, marginBottom: 12 }}>饼图：分类占比</div>
          <ReactECharts style={{ height: 380, width: '100%' }} option={pieOption as any} notMerge lazyUpdate />
        </div>

        <div className="card" style={{ background: 'rgba(255,255,255,0.95)', marginTop: 16, marginBottom: 24 }}>
          <div style={{ fontSize: '1.35rem', fontWeight: 900, marginBottom: 12 }}>柱状图：分类金额（折线：笔数）</div>
          <ReactECharts style={{ height: 420, width: '100%' }} option={barOption as any} notMerge lazyUpdate />
        </div>
      </div>

      {/* 底部导航（与首页保持一致，避免进入统计后底栏消失） */}
      <div className="bottom-nav">
        <button
          className="nav-item"
          onClick={() => navigate('/home')}
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <div className="nav-item-icon">💸</div>
          <div>明细</div>
        </button>
        <button
          className="nav-item active"
          onClick={() => navigate('/stats')}
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <div className="nav-item-icon">📊</div>
          <div>统计</div>
        </button>
      </div>
    </div>
  );
}

