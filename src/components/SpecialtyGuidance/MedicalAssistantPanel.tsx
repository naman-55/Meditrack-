import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Sparkles, 
  X, 
  Send, 
  Paperclip, 
  FileText, 
  HelpCircle, 
  CheckCircle2, 
  ChevronRight,
  TrendingUp,
  Activity,
  Droplet,
  RotateCcw
} from 'lucide-react';
import { reportsService, HealthSnapshot, SpecialtyGuidance } from '../../api/reports';
import { Skeleton } from '../common/Skeleton';
import { cn } from '../../utils/cn';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  error?: boolean;
}

interface MedicalAssistantPanelProps {
  onClose?: () => void;
  snapshot: HealthSnapshot | null;
  guidances: SpecialtyGuidance[];
  className?: string;
}

function getChatErrorMessage(err: any): string {
  const status = err?.status;
  if (status === 401 || status === 403) {
    return 'Your session has expired. Please sign in again.';
  }
  if (status === 429) {
    return 'Too many requests. Please wait before trying again.';
  }
  if (status === 503) {
    return 'The AI assistant is temporarily unavailable.';
  }
  const rawMsg = typeof err?.message === 'string' ? err.message : '';
  const lowerMsg = rawMsg.toLowerCase();

  if (
    lowerMsg.includes('failed to fetch') ||
    lowerMsg.includes('networkerror') ||
    lowerMsg.includes('network error') ||
    (!status && typeof navigator !== 'undefined' && !navigator.onLine)
  ) {
    return 'Unable to connect. Check your connection and try again.';
  }

  if (lowerMsg.includes("couldn't find") || lowerMsg.includes('no medical data') || lowerMsg.includes('no records')) {
    return "I couldn't find the medical information needed to answer that question.";
  }

  if (rawMsg && !rawMsg.includes('HTTP 500') && rawMsg !== 'Internal Server Error' && rawMsg !== 'Error') {
    return rawMsg;
  }

  return 'The AI assistant is temporarily unavailable.';
}

export const MedicalAssistantPanel: React.FC<MedicalAssistantPanelProps> = ({
  onClose,
  snapshot,
  guidances,
  className
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'insights'>('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Check backend AI status and load persistent chat history
  useEffect(() => {
    let isMounted = true;
    fetch('/api/ai/health')
      .then(res => res.json())
      .then(data => {
        if (isMounted) setIsOnline(data.status === 'CONFIGURED');
      })
      .catch(() => {
        if (isMounted) setIsOnline(true);
      });

    reportsService.getChatHistory()
      .then(history => {
        if (isMounted && Array.isArray(history) && history.length > 0) {
          setMessages(history.map(h => ({
            id: String(h.id || Math.random()),
            role: h.role as 'user' | 'assistant',
            content: h.content,
            timestamp: h.timestamp
              ? new Date(h.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
              : new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
          })));
        }
      })
      .catch(err => {
        console.warn('Failed to load chat history:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  const handleClearHistory = async () => {
    try {
      await reportsService.clearChatHistory();
      setMessages([]);
    } catch (err) {
      console.warn('Failed to clear chat history:', err);
    }
  };

  const handleRetry = async (errorMsgId: string) => {
    if (isSending) return;
    const errorIndex = messages.findIndex(m => m.id === errorMsgId);
    if (errorIndex < 0) return;

    let lastUserText = '';
    for (let i = errorIndex - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        lastUserText = messages[i].content;
        break;
      }
    }
    if (!lastUserText) return;

    // Filter out the failed message without duplicating the original user message
    const remainingMessages = messages.filter(m => m.id !== errorMsgId);
    setMessages(remainingMessages);
    setIsSending(true);

    try {
      const historyPayload = remainingMessages
        .filter(m => !m.error)
        .map(m => ({ role: m.role, content: m.content }));
      const response = await reportsService.chatWithAI(lastUserText, historyPayload);

      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: response.message || 'I have reviewed your clinical record.',
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('Chat retry error:', err);
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: getChatErrorMessage(err),
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        error: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
    }
  };

  const suggestedQuestions = [
    {
      id: 'blood-report',
      icon: FileText,
      iconBg: 'bg-rose-50 text-rose-500',
      text: 'Explain my latest blood report'
    },
    {
      id: 'why-cardio',
      icon: HelpCircle,
      iconBg: 'bg-blue-50 text-blue-500',
      text: 'Why was Cardiology recommended?'
    },
    {
      id: 'compare-results',
      icon: CheckCircle2,
      iconBg: 'bg-indigo-50 text-indigo-500',
      text: 'Compare my current and previous results'
    },
    {
      id: 'cholesterol-meaning',
      icon: Droplet,
      iconBg: 'bg-amber-50 text-amber-500',
      text: 'What does my cholesterol result mean?'
    },
    {
      id: 'improve-results',
      icon: Activity,
      iconBg: 'bg-purple-50 text-purple-500',
      text: 'How can I improve my test results?'
    }
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isSending) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    if (!textToSend) setInputValue('');
    setIsSending(true);

    try {
      const historyPayload = messages.map(m => ({ role: m.role, content: m.content }));
      const response = await reportsService.chatWithAI(text, historyPayload);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.message || 'I have reviewed your clinical record.',
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: getChatErrorMessage(err),
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        error: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={cn(
      "w-full bg-white dark:bg-[#081729] rounded-2xl border border-[#DCE5EC] dark:border-[#152A42] shadow-md flex flex-col h-full shrink-0 overflow-hidden",
      className
    )}>
      {/* HEADER */}
      <div className="p-4 sm:p-4.5 border-b border-slate-100 dark:border-[#152A42] flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-[#0B203E] text-[#2563EB] dark:text-[#2684FF] flex items-center justify-center shrink-0 shadow-2xs border border-blue-100 dark:border-[#1B4582]">
            <Bot className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#071B49] dark:text-white leading-tight">
                MediTrack AI Assistant
              </h3>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-blue-100/70 text-[#2563EB] dark:bg-[#081E3B] dark:text-[#2684FF] border border-transparent dark:border-[#1B4582]">
                Beta
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 dark:bg-[#00D6B0]' : 'bg-slate-400'}`} />
              <p className="text-[11px] text-[#64748B] dark:text-[#8297B2] font-medium leading-none">
                Your personal health assistant
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button
              type="button"
              onClick={handleClearHistory}
              className="p-1.5 rounded-lg text-slate-400 dark:text-[#647A96] hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#0D2038] transition-colors"
              title="Clear conversation history"
              aria-label="Clear conversation history"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 dark:text-[#647A96] hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#0D2038] transition-colors"
              aria-label="Close Assistant panel"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* SEGMENTED CONTROL: Chat / Insights */}
      <div className="p-3 border-b border-slate-100 dark:border-[#152A42] bg-[#F8FAFC] dark:bg-[#081729] shrink-0">
        <div className="grid grid-cols-2 p-1 bg-slate-200/60 dark:bg-[#050E1A] rounded-xl text-xs font-bold border border-transparent dark:border-[#152A42]">
          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'chat'
                ? 'bg-white text-[#00A884] shadow-xs dark:bg-[#042724] dark:border dark:border-[#00D6B0] dark:text-[#00D6B0]'
                : 'text-slate-600 hover:text-slate-900 dark:text-[#94A9C2] dark:hover:text-white'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Chat</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('insights')}
            className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'insights'
                ? 'bg-white text-[#00A884] shadow-xs dark:bg-[#042724] dark:border dark:border-[#00D6B0] dark:text-[#00D6B0]'
                : 'text-slate-600 hover:text-slate-900 dark:text-[#94A9C2] dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Insights</span>
          </button>
        </div>
      </div>

      {/* BODY CONTENT */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'chat' ? (
          messages.length === 0 ? (
            /* INITIAL STATE: Friendly Greeting & Suggested Questions */
            <div className="space-y-5 py-2">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#2563EB] flex items-center justify-center mx-auto border border-blue-100/70 shadow-2xs">
                  <Bot className="w-7 h-7 stroke-[2]" />
                </div>
                <h4 className="text-base font-extrabold text-[#071B49] tracking-tight">
                  Hello, I'm your health assistant
                </h4>
                <p className="text-xs text-[#64748B] leading-relaxed max-w-xs mx-auto">
                  I can help you understand your reports, explain your results, and answer questions about your health and specialist recommendations.
                </p>
              </div>

              {/* CONTEXTUAL SUGGESTED QUESTIONS */}
              <div className="space-y-2 pt-1">
                {suggestedQuestions.map((q) => {
                  const QIcon = q.icon;
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => handleSendMessage(q.text)}
                      className="w-full text-left p-3 rounded-xl bg-white border border-slate-200/80 hover:border-slate-300 hover:bg-slate-50 transition-all shadow-2xs flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${q.iconBg}`}>
                          <QIcon className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-semibold text-slate-800 truncate">
                          {q.text}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 shrink-0 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* CONVERSATION THREAD */
            <div className="space-y-3">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[88%] rounded-2xl p-3 text-xs leading-relaxed shadow-2xs ${
                      m.role === 'user'
                        ? 'bg-[#071B49] text-white rounded-br-xs'
                        : m.error
                        ? 'bg-rose-50 text-rose-800 border border-rose-200 rounded-bl-xs'
                        : 'bg-slate-50 text-slate-800 border border-slate-200/80 rounded-bl-xs'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{m.content}</div>
                    {m.error && (
                      <button
                        type="button"
                        onClick={() => handleRetry(m.id)}
                        className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-rose-700 bg-rose-100 hover:bg-rose-200 rounded-lg transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Retry</span>
                      </button>
                    )}
                    <span className={`text-[10px] block mt-1.5 ${m.role === 'user' ? 'text-slate-300 text-right' : 'text-slate-400'}`}>
                      {m.timestamp}
                    </span>
                  </div>
                </div>
              ))}

              {isSending && (
                <div className="flex items-start gap-2 animate-in fade-in">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/80 text-xs text-slate-500 space-y-2 w-64 max-w-[85%]">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                      <span className="font-medium text-slate-600">Analyzing your medical data...</span>
                    </div>
                    <div className="space-y-1.5 pt-0.5">
                      <Skeleton className="h-2.5 w-full rounded" />
                      <Skeleton className="h-2.5 w-4/5 rounded" />
                      <Skeleton className="h-2.5 w-3/5 rounded" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>
          )
        ) : (
          /* INSIGHTS TAB */
          <div className="space-y-3 py-1">
            <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-3.5 text-xs text-blue-900 space-y-1">
              <span className="font-bold block">Validated Medical Summary</span>
              <p className="text-[11px] text-blue-800/90 leading-relaxed">
                Analysis based on {snapshot?.reportCount || 0} reports and {snapshot?.parametersAnalyzed || 0} unique parameters.
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Recommended Specialist Mappings
              </span>
              {guidances.length > 0 ? (
                guidances.map((g) => (
                  <div key={g.id} className="p-3 rounded-xl border border-slate-200 bg-white text-xs space-y-1 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{g.suggested_specialty}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700">
                        {g.domain}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      {g.evidence && !g.evidence.startsWith('{')
                        ? g.evidence
                        : 'Routine monitoring based on validated laboratory findings.'}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic">No specialist mappings generated yet.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* FIXED CHAT COMPOSER AT BOTTOM */}
      <div className="p-3 sm:p-3.5 border-t border-slate-100 dark:border-[#152A42] bg-white dark:bg-[#081729] shrink-0 space-y-2">
        <div className="relative flex items-center bg-[#F8FAFC] dark:bg-[#0B1B30] border border-slate-200 dark:border-[#152A42] rounded-xl focus-within:border-[#00A884] focus-within:dark:border-[#00D6B0] focus-within:ring-2 focus-within:ring-[#00A884]/20 transition-all">
          <button
            type="button"
            className="p-2 text-slate-400 dark:text-[#647A96] hover:text-slate-600 dark:hover:text-white transition-colors"
            title="Attach health document"
            aria-label="Attach document"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSending}
            placeholder="Ask a question about your health..."
            className="flex-1 bg-transparent py-2.5 px-1 text-xs sm:text-sm text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-[#647A96] focus:outline-hidden"
          />

          <button
            type="button"
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim() || isSending}
            className="m-1.5 p-2 rounded-xl bg-[#00A884] dark:bg-[#00D6B0] hover:bg-[#009272] dark:hover:bg-[#00A88F] disabled:opacity-40 text-white dark:text-[#040D1A] transition-colors shadow-2xs focus:outline-hidden"
            aria-label="Send message"
          >
            <Send className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>

        {/* DISCLAIMER */}
        <p className="text-[10px] text-slate-400 dark:text-[#647A96] text-center leading-tight">
          This AI assistant provides information only and is not a substitute for professional medical advice.
        </p>
      </div>
    </div>
  );
};
