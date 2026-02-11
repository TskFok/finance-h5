import { useEffect, useMemo, useRef, useState } from 'react';
import { aiApi } from '../services/api';
import BottomNav from '../components/BottomNav';
import type { AIModel, AIAnalysisHistoryItem, AIChatHistoryItem } from '../types';
import { formatDate } from '../utils/format';

type TabKey = 'chat' | 'analysis';

const todayStr = () => formatDate(new Date().toISOString());
const monthStartStr = () => {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth(), 1);
  return formatDate(d.toISOString());
};

function prettyJson(obj: any) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

function extractPreview(item: any, kind?: 'chat' | 'analysis'): string {
  // 聊天历史优先使用 ai_text
  if (kind === 'chat' && item?.ai_text) {
    return item.ai_text;
  }
  // 分析历史优先使用 content 或 result
  if (kind === 'analysis') {
    return item?.content || item?.result || item?.answer || prettyJson(item);
  }
  // 通用回退
  return (
    item?.ai_text ||
    item?.content ||
    item?.answer ||
    item?.message ||
    item?.prompt ||
    item?.result ||
    item?.response ||
    prettyJson(item)
  );
}

export default function AI() {
  const [tab, setTab] = useState<TabKey>('chat');
  const [models, setModels] = useState<AIModel[]>([]);
  const [modelId, setModelId] = useState<number | null>(null);

  // Chat
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([]);
  const [chatStreaming, setChatStreaming] = useState(false);
  const chatAbortRef = useRef<null | (() => void)>(null);

  // Analysis
  const [startDate, setStartDate] = useState(monthStartStr());
  const [endDate, setEndDate] = useState(todayStr());
  const [analysisText, setAnalysisText] = useState('');
  const [analysisStreaming, setAnalysisStreaming] = useState(false);
  const analysisAbortRef = useRef<null | (() => void)>(null);

  // History
  const [chatHistory, setChatHistory] = useState<AIChatHistoryItem[]>([]);
  const [analysisHistory, setAnalysisHistory] = useState<AIAnalysisHistoryItem[]>([]);
  const [chatPage, setChatPage] = useState(1);
  const [analysisPage, setAnalysisPage] = useState(1);
  const [chatTotal, setChatTotal] = useState(0);
  const [analysisTotal, setAnalysisTotal] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await aiApi.getModels();
        if (res.code === 200 && Array.isArray(res.data)) {
          setModels(res.data);
          if (res.data.length > 0) setModelId(res.data[0].id);
        } else {
          setError(res.message || '获取AI模型失败');
        }
      } catch (e: any) {
        setError(e?.response?.data?.message || '获取AI模型失败');
      }
    })();
  }, []);

  const selectedModel = useMemo(() => models.find((m) => m.id === modelId) || null, [models, modelId]);

  const loadHistory = async (kind: 'chat' | 'analysis', page: number) => {
    if (!modelId) return;
    setHistoryLoading(true);
    setError('');
    try {
      if (kind === 'chat') {
        const res = await aiApi.getChatHistory({ model_id: modelId, page, page_size: 20 });
        if (res.code === 200 && res.data) {
          setChatHistory(res.data.list || []);
          setChatTotal(res.data.total || 0);
        } else setError(res.message || '获取聊天历史失败');
      } else {
        const res = await aiApi.getAnalysisHistory({ model_id: modelId, page, page_size: 20 });
        if (res.code === 200 && res.data) {
          setAnalysisHistory(res.data.list || []);
          setAnalysisTotal(res.data.total || 0);
        } else setError(res.message || '获取分析历史失败');
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || '获取历史失败');
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (!modelId) return;
    setChatPage(1);
    setAnalysisPage(1);
    loadHistory('chat', 1);
    loadHistory('analysis', 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelId]);

  const stopChat = () => {
    chatAbortRef.current?.();
    chatAbortRef.current = null;
    setChatStreaming(false);
  };

  const stopAnalysis = () => {
    analysisAbortRef.current?.();
    analysisAbortRef.current = null;
    setAnalysisStreaming(false);
  };

  const sendChat = async () => {
    if (!modelId) return;
    const msg = chatInput.trim();
    if (!msg) return;

    setError('');
    setChatInput('');
    setChatMessages((prev) => [...prev, { role: 'user', text: msg }, { role: 'assistant', text: '' }]);
    setChatStreaming(true);

    chatAbortRef.current = aiApi.streamChat(
      { model_id: modelId, message: msg },
      {
        onDelta: (t) => {
          setChatMessages((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last?.role === 'assistant') {
              last.text = (last.text || '') + t;
            }
            return next;
          });
        },
        onDone: () => {
          setChatStreaming(false);
          chatAbortRef.current = null;
          loadHistory('chat', 1);
        },
        onError: (m) => {
          setChatStreaming(false);
          chatAbortRef.current = null;
          setError(m);
        }
      }
    );
  };

  const runAnalysis = async () => {
    if (!modelId) return;
    if (!startDate || !endDate) {
      setError('请选择开始/结束日期');
      return;
    }
    setError('');
    setAnalysisText('');
    setAnalysisStreaming(true);

    analysisAbortRef.current = aiApi.streamAnalysis(
      { model_id: modelId, start_time: startDate, end_time: endDate },
      {
        onDelta: (t) => setAnalysisText((prev) => prev + t),
        onDone: () => {
          setAnalysisStreaming(false);
          analysisAbortRef.current = null;
          loadHistory('analysis', 1);
        },
        onError: (m) => {
          setAnalysisStreaming(false);
          analysisAbortRef.current = null;
          setError(m);
        }
      }
    );
  };

  const deleteHistory = async (kind: 'chat' | 'analysis', id: number) => {
    setError('');
    try {
      if (kind === 'chat') {
        const res = await aiApi.deleteChatHistory(id);
        if (res.code === 200) loadHistory('chat', chatPage);
        else setError(res.message || '删除失败');
      } else {
        const res = await aiApi.deleteAnalysisHistory(id);
        if (res.code === 200) loadHistory('analysis', analysisPage);
        else setError(res.message || '删除失败');
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || '删除失败');
    }
  };

  const renderHistoryItem = (kind: 'chat' | 'analysis', item: any) => {
    const key = `${kind}-${item?.id}`;
    const expanded = expandedKey === key;
    const preview = extractPreview(item, kind);
    const created = item?.created_at || item?.createdAt || '';
    
    // 格式化日期时间
    const formatCreatedAt = (dateStr?: string) => {
      if (!dateStr) return '';
      try {
        const date = new Date(dateStr);
        return date.toLocaleString('zh-CN', { 
          year: 'numeric', 
          month: '2-digit', 
          day: '2-digit', 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      } catch {
        return dateStr;
      }
    };

    return (
      <div key={key} className="list-item" style={{ width: '100%' }}>
        <div className="list-item-header">
          <div className="list-item-title" style={{ fontSize: '1.25rem' }}>
            #{item?.id} {created ? `· ${formatCreatedAt(created)}` : ''}
          </div>
          <button className="btn" onClick={() => deleteHistory(kind, item.id)} style={{ color: 'var(--expense-color)', padding: '10px 14px' }}>
            删除
          </button>
        </div>
        
        {/* 聊天历史：显示用户问题和AI回答 */}
        {kind === 'chat' && item?.user_text && (
          <div style={{ marginTop: 12, marginBottom: 12 }}>
            <div style={{ fontWeight: 700, marginBottom: 6, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
              💬 你的问题：
            </div>
            <div style={{ 
              padding: 12, 
              borderRadius: 12, 
              background: 'var(--bg-tertiary)', 
              fontSize: '1rem',
              whiteSpace: 'pre-wrap',
              lineHeight: 1.5,
              border: '1px solid var(--border-color)'
            }}>
              {item.user_text}
            </div>
          </div>
        )}
        
        {/* AI回答内容 */}
        <div style={{ marginTop: kind === 'chat' ? 0 : 6 }}>
          {kind === 'chat' && (
            <div style={{ fontWeight: 700, marginBottom: 6, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
              🤖 AI回答：
            </div>
          )}
          <div style={{ 
            color: 'var(--text-secondary)', 
            fontSize: '1rem', 
            whiteSpace: 'pre-wrap',
            lineHeight: 1.5,
            padding: kind === 'chat' ? 12 : 0,
            borderRadius: kind === 'chat' ? 12 : 0,
            background: kind === 'chat' ? 'var(--income-bg)' : 'transparent',
            border: kind === 'chat' ? '1px solid var(--income-border)' : 'none'
          }}>
            {expanded ? preview : `${preview}`.slice(0, 200)}
            {!expanded && preview.length > 200 ? '…' : ''}
          </div>
        </div>
        
        {preview.length > 200 && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
            <button className="btn" onClick={() => setExpandedKey(expanded ? null : key)} style={{ padding: '10px 14px' }}>
              {expanded ? '收起' : '展开'}
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="page" style={{ padding: '0', width: '100%', paddingBottom: '110px' }}>
      <div className="app-bg-texture" />
      <div className="app-bg-gradient" />
      <div style={{ width: '100%', maxWidth: '100%', padding: '20px 20px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div className="card" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="font-display" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>AI 助手</div>
          <div className="font-tech" style={{ color: 'var(--text-muted)', marginTop: 8, fontSize: '0.9rem' }}>
            选择模型后，可进行 <b>AI聊天</b> 或 <b>AI分析</b>（均为流式输出）
          </div>
          <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
            <div>
              <label className="input-label">AI模型</label>
              <select
                className="select"
                value={modelId ?? ''}
                onChange={(e) => setModelId(Number(e.target.value))}
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} (#{m.id})
                  </option>
                ))}
              </select>
              {selectedModel?.base_url && (
                <div className="font-tech" style={{ marginTop: 8, fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                  Base URL：{selectedModel.base_url}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="btn"
                onClick={() => setTab('chat')}
                style={{
                  flex: 1,
                  background: tab === 'chat' ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                  color: tab === 'chat' ? 'var(--text-primary)' : 'var(--text-muted)',
                  border: tab === 'chat' ? '1px solid var(--border-subtle)' : '1px solid var(--border-color)'
                }}
              >
                <i className="fa-solid fa-comment" style={{ marginRight: '8px' }} />AI聊天
              </button>
              <button
                className="btn"
                onClick={() => setTab('analysis')}
                style={{
                  flex: 1,
                  background: tab === 'analysis' ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                  color: tab === 'analysis' ? 'var(--text-primary)' : 'var(--text-muted)',
                  border: tab === 'analysis' ? '1px solid var(--border-subtle)' : '1px solid var(--border-color)'
                }}
              >
                <i className="fa-solid fa-brain" style={{ marginRight: '8px' }} />AI分析
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="card">
            <div className="error-message">
              <i className="fa-solid fa-circle-exclamation" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Chat Tab */}
        {tab === 'chat' && (
          <>
            <div className="card">
              <div className="font-tech" style={{ fontSize: '1rem', fontWeight: 700, letterSpacing: '0.05em', marginBottom: 12, color: 'var(--text-muted)' }}>对话</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {chatMessages.length === 0 ? (
                    <div style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
                      试试问：我这个月消费结构怎么样？我有哪些可以优化的支出？
                    </div>
                  ) : (
                    chatMessages.map((m, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: 14,
                          borderRadius: 12,
                          background: m.role === 'user' ? 'var(--bg-tertiary)' : 'var(--income-bg)',
                          border: '1px solid var(--border-color)'
                        }}
                      >
                        <div className="font-display" style={{ fontWeight: 600, marginBottom: 6, fontSize: '1rem', color: 'var(--text-secondary)' }}>
                          {m.role === 'user' ? '你' : 'AI'}
                        </div>
                        <div style={{ whiteSpace: 'pre-wrap', fontSize: '1rem', lineHeight: 1.5, color: 'var(--text-primary)' }}>
                          {m.text || (m.role === 'assistant' && chatStreaming ? '…' : '')}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <textarea
                  className="textarea"
                  placeholder="输入你想问的问题…"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  rows={3}
                />
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn btn-primary metal-shimmer" style={{ flex: 1 }} onClick={sendChat} disabled={chatStreaming || !modelId}>
                    {chatStreaming ? '生成中…' : '发送'}
                  </button>
                  <button className="btn" style={{ flex: 1 }} onClick={stopChat} disabled={!chatStreaming}>
                    停止
                  </button>
                </div>
              </div>
            </div>

            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div className="font-tech" style={{ fontSize: '1rem', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-muted)' }}>聊天历史</div>
                <button className="btn btn-primary" style={{ padding: '10px 14px', fontSize: '0.9rem' }} onClick={() => loadHistory('chat', chatPage)} disabled={historyLoading || !modelId}>
                  {historyLoading ? '加载中…' : '刷新'}
                </button>
              </div>
              {chatHistory.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>暂无聊天历史（发送一次聊天后会自动保存）</div>
              ) : (
                <>
                  {chatHistory.map((it) => renderHistoryItem('chat', it))}
                  <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                    <button
                      className="btn"
                      onClick={() => {
                        const next = Math.max(1, chatPage - 1);
                        setChatPage(next);
                        loadHistory('chat', next);
                      }}
                      disabled={chatPage <= 1 || historyLoading}
                    >
                      上一页
                    </button>
                    <button
                      className="btn"
                      onClick={() => {
                        const next = chatPage + 1;
                        setChatPage(next);
                        loadHistory('chat', next);
                      }}
                      disabled={historyLoading || chatHistory.length < 20}
                    >
                      下一页
                    </button>
                    <div style={{ marginLeft: 'auto', color: 'var(--text-secondary)', fontSize: '1rem', alignSelf: 'center' }}>
                      第 {chatPage} 页 / 共 {chatTotal} 条
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {/* Analysis Tab */}
        {tab === 'analysis' && (
          <>
            <div className="card">
              <div className="font-tech" style={{ fontSize: '1rem', fontWeight: 700, letterSpacing: '0.05em', marginBottom: 12, color: 'var(--text-muted)' }}>消费AI分析</div>
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

              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                <button className="btn btn-success" style={{ flex: 1 }} onClick={runAnalysis} disabled={analysisStreaming || !modelId}>
                  {analysisStreaming ? '分析中…' : '开始分析'}
                </button>
                <button className="btn" style={{ flex: 1 }} onClick={stopAnalysis} disabled={!analysisStreaming}>
                  停止
                </button>
              </div>

              <div style={{ marginTop: 14 }}>
                <div className="font-tech" style={{ fontSize: '0.9rem', fontWeight: 700, letterSpacing: '0.05em', marginBottom: 10, color: 'var(--text-muted)' }}>分析结果（流式）</div>
                <div
                  style={{
                    padding: 14,
                    borderRadius: 12,
                    background: 'var(--income-bg)',
                    border: '1px solid var(--income-border)',
                    minHeight: 120,
                    whiteSpace: 'pre-wrap',
                    fontSize: '1rem',
                    lineHeight: 1.55,
                    color: 'var(--text-primary)'
                  }}
                >
                  {analysisText || (analysisStreaming ? '…' : '点击“开始分析”后，这里会显示AI对消费的分析建议。')}
                </div>
              </div>
            </div>

            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div className="font-tech" style={{ fontSize: '1rem', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-muted)' }}>分析历史</div>
                <button className="btn btn-primary" style={{ padding: '10px 14px', fontSize: '0.9rem' }} onClick={() => loadHistory('analysis', analysisPage)} disabled={historyLoading || !modelId}>
                  {historyLoading ? '加载中…' : '刷新'}
                </button>
              </div>
              {analysisHistory.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>暂无分析历史（分析完成后会自动保存）</div>
              ) : (
                <>
                  {analysisHistory.map((it) => renderHistoryItem('analysis', it))}
                  <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                    <button
                      className="btn"
                      onClick={() => {
                        const next = Math.max(1, analysisPage - 1);
                        setAnalysisPage(next);
                        loadHistory('analysis', next);
                      }}
                      disabled={analysisPage <= 1 || historyLoading}
                    >
                      上一页
                    </button>
                    <button
                      className="btn"
                      onClick={() => {
                        const next = analysisPage + 1;
                        setAnalysisPage(next);
                        loadHistory('analysis', next);
                      }}
                      disabled={historyLoading || analysisHistory.length < 20}
                    >
                      下一页
                    </button>
                    <div style={{ marginLeft: 'auto', color: 'var(--text-secondary)', fontSize: '1rem', alignSelf: 'center' }}>
                      第 {analysisPage} 页 / 共 {analysisTotal} 条
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>

      <BottomNav active="ai" />
    </div>
  );
}

