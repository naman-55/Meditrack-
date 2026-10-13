import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Sparkles, 
  Send, 
  Paperclip, 
  FileText, 
  HelpCircle, 
  CheckCircle2, 
  ChevronRight,
  TrendingUp,
  Activity,
  Droplet,
  RotateCcw,
  Plus
} from 'lucide-react';
import { reportsService, HealthSnapshot, Measurement, SpecialtyGuidance } from '../../api/reports';
import { MarkdownMessage } from './MarkdownMessage';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  error?: boolean;
  retryable?: boolean;
}

interface MedicalAssistantPanelProps {
  snapshot: HealthSnapshot | null;
  guidances: SpecialtyGuidance[];
  measurements: Measurement[];
}

function getChatErrorMessage(err: any): string {
  if (err?.code === 'DATABASE_ERROR') {
    return "We couldn't retrieve your medical information. Please try again.";
  }
  if (err?.code === 'AI_PROVIDER_UNAVAILABLE') {
    return 'The AI assistant is temporarily unavailable.';
  }
  if (err?.code === 'REQUEST_INVALID') {
    return 'Please check your message and try again.';
  }
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

function canRetryChatError(err: any): boolean {
  return err?.status !== 401 && err?.status !== 403 &&
    err?.code !== 'AUTH_REQUIRED' && err?.code !== 'AUTH_TOKEN_EXPIRED' &&
    err?.code !== 'AUTH_TOKEN_INVALID' && err?.code !== 'REQUEST_INVALID';
}

export const MedicalAssistantPanel: React.FC<MedicalAssistantPanelProps> = ({
  snapshot,
  guidances,
  measurements
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'insights'>('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [clearError, setClearError] = useState('');
  const [isOnline, setIsOnline] = useState(true);
  const chatBodyRef = useRef<HTMLDivElement>(null);

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
    const chatBody = chatBodyRef.current;
    if (chatBody) {
      chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isSending]);

  const handleClearHistory = async () => {
    if (isSending || isClearing) return;
    setIsClearing(true);
    setClearError('');
    try {
      await reportsService.clearChatHistory();
      setMessages([]);
      setInputValue('');
    } catch (err) {
      console.warn('Failed to clear chat history:', err);
      setClearError('Could not start a new chat. Your conversation history could not be cleared.');
    } finally {
      setIsClearing(false);
    }
  };

  const handleRetry = async (errorMsgId: string) => {
    if (isSending || isClearing) return;
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
      const response = await reportsService.chatWithAI(lastUserText);
      if (typeof response?.message !== 'string' || !response.message.trim()) {
        throw new Error('The AI assistant returned an empty response.');
      }

      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: response.message,
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
        error: true,
        retryable: canRetryChatError(err)
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
      id: 'doctor-discussion',
      icon: Activity,
      iconBg: 'bg-purple-50 text-purple-500',
      text: 'What should I discuss with my doctor?'
    }
  ];

  const hasReports = (snapshot?.reportCount || 0) > 0 || measurements.length > 0;
  const hasCholesterolResults = measurements.some(m => /cholesterol|\bldl\b|\bhdl\b/i.test(m.parameter));
  const hasCardiologyRecommendation = guidances.some(g =>
    /cardio/i.test(`${g.domain} ${g.suggested_specialty}`)
  );
  const visibleSuggestedQuestions = suggestedQuestions.filter(q => {
    if (q.id === 'blood-report') return hasReports;
    if (q.id === 'why-cardio') return hasCardiologyRecommendation;
    if (q.id === 'compare-results') return (snapshot?.reportCount || 0) > 1;
    if (q.id === 'cholesterol-meaning') return hasCholesterolResults;
    return hasReports;
  });

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isSending || isClearing) return;
    setClearError('');

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
      const response = await reportsService.chatWithAI(text);
      if (typeof response?.message !== 'string' || !response.message.trim()) {
        throw new Error('The AI assistant returned an empty response.');
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.message,
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
        error: true,
        retryable: canRetryChatError(err)
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
    <div className="w-full bg-white dark:bg-[#0D1B2A] rounded-2xl border border-[#DCE5EC] dark:border-[#20364A] shadow-xs flex flex-col h-full min-h-0 shrink-0 overflow-hidden">
      {/* HEADER */}
      <div className="p-3.5 sm:p-4 border-b border-slate-100 dark:border-[#20364A] flex items-center justify-between gap-3 shrink-0 bg-white dark:bg-[#0D1B2A]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-50 dark:bg-[#081421] text-[#2563EB] dark:text-[#2684FF] flex items-center justify-center shrink-0 shadow-2xs border border-blue-100 dark:border-[#20364A]">
            <Bot className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#071B49] dark:text-[#F1F5FB] leading-tight">
                MediTrack AI Assistant
              </h3>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-blue-100/70 dark:bg-[#2684FF]/20 text-[#2563EB] dark:text-[#2684FF]">
                Beta
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 dark:bg-[#00D6B0]' : 'bg-slate-400'}`} />
              <p className="text-[11px] text-[#64748B] dark:text-[#8297B2] font-medium leading-none">
                {isOnline ? 'Online' : 'Unavailable'} · Your personal health assistant
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleClearHistory}
            disabled={isSending || isClearing}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-[#F1F5FB] bg-slate-100 dark:bg-[#081421] border border-slate-200 dark:border-[#20364A] hover:bg-slate-200 dark:hover:bg-[#14283B] disabled:opacity-50 transition-colors cursor-pointer"
            title="Start a new chat and clear this conversation history"
            aria-label="New chat; clears current conversation history"
          >
            <Plus className="w-3.5 h-3.5 text-slate-500 dark:text-[#8297B2]" />
            <span>{isClearing ? 'Starting…' : 'New Chat'}</span>
          </button>
        </div>
      </div>

      {clearError && (
        <p role="alert" className="px-4 py-2 text-xs text-rose-700 dark:text-[#FF5368] bg-rose-50 dark:bg-[#321B27] border-b border-rose-100 dark:border-[#7A3043]">
          {clearError}
        </p>
      )}

      {/* SEGMENTED CONTROL: Chat / Insights */}
      <div className="p-2.5 sm:p-3 border-b border-slate-100 dark:border-[#20364A] bg-[#F8FAFC] dark:bg-[#081421] shrink-0">
        <div className="grid grid-cols-2 p-1 bg-slate-200/60 dark:bg-[#0D1B2A] rounded-xl text-xs font-bold border border-transparent dark:border-[#20364A]">
          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'chat'
                ? 'bg-white text-[#00A884] shadow-xs dark:bg-[#062E2D] dark:text-[#00D6B0] dark:border dark:border-[#075E56] font-bold'
                : 'text-slate-600 dark:text-[#8297B2] hover:text-slate-900 dark:hover:text-[#F1F5FB]'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Chat</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('insights')}
            className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'insights'
                ? 'bg-white text-[#00A884] shadow-xs dark:bg-[#062E2D] dark:text-[#00D6B0] dark:border dark:border-[#075E56] font-bold'
                : 'text-slate-600 dark:text-[#8297B2] hover:text-slate-900 dark:hover:text-[#F1F5FB]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Insights</span>
          </button>
        </div>
      </div>

      {/* BODY CONTENT: Independently scrollable */}
      <div ref={chatBodyRef} className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {activeTab === 'chat' ? (
          messages.length === 0 ? (
            /* INITIAL STATE: Friendly Greeting & Suggested Questions */
            <div className="space-y-5 py-2">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-[#102033] text-[#2563EB] dark:text-[#00D6B0] flex items-center justify-center mx-auto border border-blue-100/70 dark:border-[#20364A] shadow-2xs">
                  <Bot className="w-7 h-7 stroke-[2]" />
                </div>
                <h4 className="text-base font-extrabold text-[#071B49] dark:text-[#F1F5FB] tracking-tight">
                  Hello, I'm your health assistant
                </h4>
                <p className="text-xs text-[#64748B] dark:text-[#8297B2] leading-relaxed max-w-xs mx-auto">
                  I can help you understand your reports, explain your results, and answer questions about your health and specialist recommendations.
                </p>
              </div>

              {/* CONTEXTUAL SUGGESTED QUESTIONS */}
              <div className="space-y-2 pt-1">
                {visibleSuggestedQuestions.map((q) => {
                  const QIcon = q.icon;
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => handleSendMessage(q.text)}
                      className="w-full text-left p-3 rounded-xl bg-white dark:bg-[#081421] border border-slate-200/80 dark:border-[#20364A] hover:border-slate-300 dark:hover:border-[#00D6B0]/40 hover:bg-slate-50 dark:hover:bg-[#14283B] transition-all shadow-2xs flex items-center justify-between gap-3 group cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${q.iconBg}`}>
                          <QIcon className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-semibold text-slate-800 dark:text-[#F1F5FB] truncate">
                          {q.text}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 dark:text-[#8297B2] group-hover:text-slate-700 dark:group-hover:text-[#F1F5FB] shrink-0 transition-transform group-hover:translate-x-0.5" />
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
                    className={`max-w-[90%] rounded-2xl p-3.5 text-xs leading-relaxed shadow-2xs ${
                      m.role === 'user'
                        ? 'bg-[#071B49] dark:bg-[#102033] dark:border dark:border-[#20364A] text-white dark:text-[#F1F5FB] rounded-br-xs'
                        : m.error
                        ? 'bg-rose-50 dark:bg-[#321B27] text-rose-800 dark:text-[#FF5368] border border-rose-200 dark:border-[#7A3043] rounded-bl-xs'
                        : 'bg-slate-50 dark:bg-[#081421] text-slate-800 dark:text-[#F1F5FB] border border-slate-200/80 dark:border-[#20364A] rounded-bl-xs'
                    }`}
                  >
                    {m.role === 'assistant' && !m.error ? (
                      <MarkdownMessage content={m.content} />
                    ) : (
                      <div className="whitespace-pre-wrap">{m.content}</div>
                    )}

                    {m.error && m.retryable !== false && (
                      <button
                        type="button"
                        onClick={() => handleRetry(m.id)}
                        className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-rose-700 dark:text-[#FF5368] bg-rose-100 dark:bg-[#FF5368]/20 hover:bg-rose-200 dark:hover:bg-[#FF5368]/30 rounded-lg transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Retry</span>
                      </button>
                    )}

                    <span className={`text-[10px] block mt-1.5 ${m.role === 'user' ? 'text-slate-300 dark:text-[#8297B2] text-right' : 'text-slate-400 dark:text-[#8297B2]'}`}>
                      {m.timestamp}
                    </span>
                  </div>
                </div>
              ))}

              {isSending && (
                <div className="flex items-start gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-[#081421] text-blue-600 dark:text-[#00D6B0] border border-blue-100 dark:border-[#20364A] flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-slate-50 dark:bg-[#081421] rounded-2xl p-3 border border-slate-200/80 dark:border-[#20364A] text-xs text-slate-500 dark:text-[#8297B2] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500 dark:bg-[#00D6B0] animate-pulse" />
                    <span>Preparing your response...</span>
                  </div>
                </div>
              )}
            </div>
          )
        ) : (
          /* INSIGHTS TAB */
          <div className="space-y-3 py-1">
            <div className="bg-blue-50/70 dark:bg-[#081421] border border-blue-100 dark:border-[#20364A] rounded-xl p-3.5 text-xs text-blue-900 dark:text-[#F1F5FB] space-y-1">
              <span className="font-bold block text-blue-900 dark:text-[#00D6B0]">Validated Medical Summary</span>
              <p className="text-[11px] text-blue-800/90 dark:text-[#8297B2] leading-relaxed">
                {snapshot
                  ? `Analysis based on ${snapshot.reportCount} reports and ${snapshot.parametersAnalyzed} unique parameters.`
                  : 'Health snapshot is unavailable.'}
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-400 dark:text-[#8297B2] uppercase tracking-wider block">
                Recommended Specialist Mappings
              </span>
              {guidances.length > 0 ? (
                guidances.map((g) => (
                  <div key={g.id} className="p-3 rounded-xl border border-slate-200 dark:border-[#20364A] bg-white dark:bg-[#081421] text-xs space-y-1 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-[#F1F5FB]">{g.suggested_specialty}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 dark:bg-[#102033] text-slate-700 dark:text-[#8297B2]">
                        {g.domain}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-[#8297B2] leading-tight">
                      {g.evidence && !g.evidence.startsWith('{')
                        ? g.evidence
                        : 'The saved analysis does not include an explanation for this recommendation.'}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 dark:text-[#8297B2] italic">No specialist mappings generated yet.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* FIXED CHAT COMPOSER AT BOTTOM */}
      <div className="p-3 sm:p-3.5 border-t border-slate-100 dark:border-[#20364A] bg-white dark:bg-[#0D1B2A] shrink-0 space-y-2">
        <div className="relative flex items-center bg-[#F8FAFC] dark:bg-[#081421] border border-slate-200 dark:border-[#20364A] rounded-xl focus-within:border-[#00D6B0] focus-within:ring-2 focus-within:ring-[#00D6B0]/20 transition-all">
          <button
            type="button"
            className="p-2.5 text-slate-400 dark:text-[#8297B2] hover:text-slate-600 dark:hover:text-[#F1F5FB] transition-colors"
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
            disabled={isSending || isClearing}
            placeholder="Ask a question about your health..."
            className="flex-1 bg-transparent py-2.5 px-1 text-xs sm:text-sm text-slate-800 dark:text-[#F1F5FB] placeholder-slate-400 dark:placeholder-[#8297B2] focus:outline-hidden"
          />

          <button
            type="button"
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim() || isSending || isClearing}
            className="m-1.5 p-2 rounded-xl bg-[#00A884] dark:bg-[#00D6B0] hover:bg-[#009272] dark:hover:bg-[#00A88F] disabled:opacity-40 text-white dark:text-[#050D18] dark:font-bold transition-colors shadow-2xs focus:outline-hidden cursor-pointer"
            aria-label="Send message"
          >
            <Send className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>

        {/* DISCLAIMER */}
        <p className="text-[10px] text-slate-400 dark:text-[#8297B2] text-center leading-tight">
          This AI assistant provides information only and is not a substitute for professional medical advice.
        </p>
      </div>
    </div>
  );
};
