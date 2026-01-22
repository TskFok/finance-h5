type SSEHandlers = {
  onEvent?: (raw: any) => void;
  onDelta?: (content: string) => void;
  onDone?: () => void;
  onError?: (message: string) => void;
};

export type SSEAbort = () => void;

function getToken() {
  return localStorage.getItem('token');
}

function handleUnauthorized() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
}

/**
 * 使用 fetch + ReadableStream 解析 SSE（支持 Authorization header）
 * 约定：服务端按 "data: {\"type\":\"delta|done|error\", ...}" 输出
 */
export function postSSE(path: string, body: any, handlers: SSEHandlers): SSEAbort {
  const controller = new AbortController();
  const token = getToken();
  const base = `${import.meta.env.VITE_API_BASE_URL}/api/v1`;

  (async () => {
    try {
      const res = await fetch(`${base}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });

      if (res.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!res.ok || !res.body) {
        handlers.onError?.(`请求失败：${res.status}`);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // SSE 事件以空行分隔（\n\n）
        let idx: number;
        while ((idx = buffer.indexOf('\n\n')) !== -1) {
          const chunk = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);

          const lines = chunk.split('\n');
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) continue;
            const dataStr = trimmed.slice(5).trim();
            if (!dataStr) continue;

            try {
              const obj = JSON.parse(dataStr);
              handlers.onEvent?.(obj);
              if (obj?.type === 'delta' && typeof obj?.content === 'string') {
                handlers.onDelta?.(obj.content);
              } else if (obj?.type === 'done') {
                handlers.onDone?.();
              } else if (obj?.type === 'error') {
                handlers.onError?.(obj?.message || obj?.content || 'AI返回错误');
              }
            } catch {
              // 非JSON帧，作为普通文本增量
              handlers.onDelta?.(dataStr);
            }
          }
        }
      }
    } catch (e: any) {
      if (e?.name === 'AbortError') return;
      handlers.onError?.(e?.message || 'SSE连接异常');
    }
  })();

  return () => controller.abort();
}

