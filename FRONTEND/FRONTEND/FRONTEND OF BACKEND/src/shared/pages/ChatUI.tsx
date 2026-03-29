import { useState, useRef, useEffect } from 'react';
import { 
  Menu, X, Send, Paperclip,
  Plus, ChevronDown
} from 'lucide-react';
import { clsx } from 'clsx';

// Simulated delay
const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
};

export function ChatUI() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'How can I help you today?',
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [inputValue]);

  const handleSend = async () => {
    if (!inputValue.trim() || isThinking) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: inputValue.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsThinking(true);

    // Simulate network delay / thinking
    await delay(800);

    const aiMsgId = (Date.now() + 1).toString();
    setMessages((prev) => [...prev, { id: aiMsgId, role: 'assistant', content: '', isStreaming: true }]);
    setIsThinking(false);

    // Simulate ChatGPT-like streaming (chunks, not single words)
    const responseText = "Here is the information you requested based on the latest data.\n\nThe current outstanding ledger balance requires immediate attention, specifically regarding the last 3 sales orders. Would you like me to draft a summary report?";
    
    // Split into small chunks simulating tokens
    const chunks = responseText.match(/.{1,4}/g) || [];
    
    for (let i = 0; i < chunks.length; i++) {
      await delay(Math.random() * 30 + 10); // Random delay between 10-40ms
      setMessages((prev) => prev.map((msg) => 
        msg.id === aiMsgId 
          ? { ...msg, content: msg.content + chunks[i] } 
          : msg
      ));
      if (i % 5 === 0) scrollToBottom();
    }

    setMessages((prev) => prev.map((msg) => 
      msg.id === aiMsgId ? { ...msg, isStreaming: false } : msg
    ));
    scrollToBottom();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-screen bg-white text-[#0d0d0d] overflow-hidden font-['Söhne',system-ui,-apple-system,sans-serif]">
      {/* Sidebar Overlay (Mobile) */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - ChatGPT Style */}
      <aside className={clsx(
        'fixed md:static inset-y-0 left-0 z-50 w-[260px] bg-[#f9f9f9] flex flex-col',
        'transform transition-transform duration-300 ease-in-out',
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      )}>
        <div className="flex items-center justify-between p-3">
          <button className="flex-1 flex items-center gap-2 px-3 py-2 hover:bg-[#ececec] rounded-lg transition-colors text-sm font-medium">
            <div className="w-7 h-7 bg-white border border-[#e5e5e5] rounded-full flex items-center justify-center shadow-sm">
              <Plus size={16} />
            </div>
            New chat
          </button>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 rounded-lg hover:bg-[#ececec] text-[#0d0d0d]">
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-6">
          <div>
            <h3 className="px-2 text-xs font-semibold text-[#666666] mb-2">Today</h3>
            <div className="space-y-[2px]">
              {['Inventory discrepancy', 'Monthly report generation'].map((chat, i) => (
                <button key={i} className="w-full text-left px-2 py-2 rounded-lg text-sm text-[#0d0d0d] hover:bg-[#ececec] transition-colors truncate">
                  {chat}
                </button>
              ))}
            </div>
          </div>
          <div>
            <h3 className="px-2 text-xs font-semibold text-[#666666] mb-2">Previous 7 Days</h3>
            <div className="space-y-[2px]">
              {['Dealer API integration', 'Explain ledger rules'].map((chat, i) => (
                <button key={i} className="w-full text-left px-2 py-2 rounded-lg text-sm text-[#0d0d0d] hover:bg-[#ececec] transition-colors truncate">
                  {chat}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-3">
          <button className="flex items-center gap-3 px-3 py-3 w-full rounded-lg hover:bg-[#ececec] transition-colors text-sm font-medium">
            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs">
              AK
            </div>
            Anas Khan
          </button>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-white relative">
        
        {/* Header */}
        <header className="h-14 flex items-center justify-between px-4 sticky top-0 bg-white z-30">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsSidebarOpen(true)} 
              className="md:hidden p-2 -ml-2 rounded-lg hover:bg-[#f3f3f3]"
            >
              <Menu size={20} />
            </button>
            <button className="flex items-center gap-2 text-lg font-semibold text-[#0d0d0d] hover:bg-[#f3f3f3] px-3 py-1.5 rounded-xl transition-colors">
              ChatGPT
              <ChevronDown size={16} className="text-[#8e8ea0]" />
            </button>
          </div>
        </header>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-0 py-6 scroll-smooth">
          <div className="max-w-[48rem] mx-auto space-y-6 pb-20">
            {messages.length === 0 && !isThinking ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[50vh] text-center space-y-6">
                <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd" d="M20.6548 10.3725C20.8415 9.77663 20.8927 9.14175 20.8037 8.51996C20.7147 7.89817 20.4883 7.30752 20.1423 6.79727C19.6457 6.06836 18.9416 5.5038 18.1189 5.17409C17.2961 4.84438 16.3912 4.76356 15.5186 4.94273C15.1189 4.31649 14.5824 3.79374 13.9482 3.41214C13.3139 3.03053 12.5979 2.80003 11.8519 2.73693C10.979 2.66164 10.0898 2.87274 9.30906 3.33917C8.52834 3.8056 7.89473 4.50369 7.49509 5.33709C6.88372 5.25056 6.2612 5.31215 5.67439 5.51694C5.08759 5.72172 4.55167 6.06456 4.10629 6.51996C3.46506 7.18243 3.06411 8.04617 2.96443 8.97103C2.86475 9.89589 3.07222 10.8281 3.5539 11.6192C3.36725 12.2151 3.31602 12.85 3.40502 13.4718C3.49403 14.0936 3.72036 14.6842 4.06644 15.1945C4.56302 15.9234 5.26707 16.488 6.08984 16.8177C6.9126 17.1474 7.81755 17.2282 8.69018 17.049C9.08987 17.6753 9.62638 18.198 10.2606 18.5796C10.8949 18.9612 11.6109 19.1917 12.3569 19.2548C13.2298 19.3301 14.119 19.119 14.8997 18.6526C15.6804 18.1862 16.314 17.4881 16.7137 16.6547C17.3251 16.7412 17.9476 16.6796 18.5344 16.4748C19.1212 16.27 19.6571 15.9272 20.1025 15.4718C20.7437 14.8093 21.1447 13.9456 21.2443 13.0207C21.344 12.0959 21.1365 11.1636 20.6548 10.3725ZM16.3725 11.1192L11.5186 13.9427L11.5186 19.049L10.3569 19.049L10.3569 13.2548L15.2109 10.4313L15.792 11.4376L16.3725 11.1192ZM18.2902 13.8413L13.4363 16.6648L8.58237 13.8413L8.58237 12.6796L14.0186 15.8413L18.8725 13.0178L18.2902 13.8413ZM20.0824 10.4313L15.2284 7.60783L10.3745 10.4313L10.9557 11.4376L15.8096 8.61414L20.6635 11.4376L20.0824 10.4313ZM15.5186 4.94273L15.5186 10.049L10.6647 12.8725L10.0836 11.8662L14.9375 9.04273L15.5186 4.94273ZM5.67439 10.8725L10.5283 8.04901L15.3822 10.8725L15.3822 12.0342L9.94605 8.87254L5.09212 11.696L5.67439 10.8725ZM3.89216 13.5608L8.74609 16.3843L13.6001 13.5608L13.0189 12.5545L8.16503 15.378L3.3111 12.5545L3.89216 13.5608Z" fill="white"/>
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold mb-2">How can I help you?</h2>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={clsx(
                  "w-full px-4 sm:px-0 py-2",
                  msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'
                )}>
                  <div className={clsx(
                    "flex gap-4 sm:gap-6",
                    msg.role === 'user' ? 'max-w-[75%]' : 'w-full'
                  )}>
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full border border-[#e5e5e5] bg-white flex items-center justify-center shrink-0">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" clipRule="evenodd" d="M20.6548 10.3725C20.8415 9.77663 20.8927 9.14175 20.8037 8.51996C20.7147 7.89817 20.4883 7.30752 20.1423 6.79727C19.6457 6.06836 18.9416 5.5038 18.1189 5.17409C17.2961 4.84438 16.3912 4.76356 15.5186 4.94273C15.1189 4.31649 14.5824 3.79374 13.9482 3.41214C13.3139 3.03053 12.5979 2.80003 11.8519 2.73693C10.979 2.66164 10.0898 2.87274 9.30906 3.33917C8.52834 3.8056 7.89473 4.50369 7.49509 5.33709C6.88372 5.25056 6.2612 5.31215 5.67439 5.51694C5.08759 5.72172 4.55167 6.06456 4.10629 6.51996C3.46506 7.18243 3.06411 8.04617 2.96443 8.97103C2.86475 9.89589 3.07222 10.8281 3.5539 11.6192C3.36725 12.2151 3.31602 12.85 3.40502 13.4718C3.49403 14.0936 3.72036 14.6842 4.06644 15.1945C4.56302 15.9234 5.26707 16.488 6.08984 16.8177C6.9126 17.1474 7.81755 17.2282 8.69018 17.049C9.08987 17.6753 9.62638 18.198 10.2606 18.5796C10.8949 18.9612 11.6109 19.1917 12.3569 19.2548C13.2298 19.3301 14.119 19.119 14.8997 18.6526C15.6804 18.1862 16.314 17.4881 16.7137 16.6547C17.3251 16.7412 17.9476 16.6796 18.5344 16.4748C19.1212 16.27 19.6571 15.9272 20.1025 15.4718C20.7437 14.8093 21.1447 13.9456 21.2443 13.0207C21.344 12.0959 21.1365 11.1636 20.6548 10.3725Z" fill="black"/>
                        </svg>
                      </div>
                    )}
                    
                    <div className={clsx(
                      "text-base leading-7 whitespace-pre-wrap flex-1",
                      msg.role === 'user' 
                        ? 'bg-[#f4f4f4] text-[#0d0d0d] px-5 py-3 rounded-3xl'
                        : 'text-[#0d0d0d] py-1'
                    )}>
                      {msg.content}
                      {msg.isStreaming && (
                        <span className="inline-block w-2.5 h-4 ml-1 align-middle bg-black rounded-sm animate-pulse" />
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}

            {isThinking && (
              <div className="w-full px-4 sm:px-0 py-2 flex justify-start">
                <div className="flex gap-4 sm:gap-6 w-full">
                  <div className="w-8 h-8 rounded-full border border-[#e5e5e5] bg-white flex items-center justify-center shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" clipRule="evenodd" d="M20.6548 10.3725C20.8415 9.77663 20.8927 9.14175 20.8037 8.51996C20.7147 7.89817 20.4883 7.30752 20.1423 6.79727C19.6457 6.06836 18.9416 5.5038 18.1189 5.17409C17.2961 4.84438 16.3912 4.76356 15.5186 4.94273C15.1189 4.31649 14.5824 3.79374 13.9482 3.41214C13.3139 3.03053 12.5979 2.80003 11.8519 2.73693C10.979 2.66164 10.0898 2.87274 9.30906 3.33917C8.52834 3.8056 7.89473 4.50369 7.49509 5.33709C6.88372 5.25056 6.2612 5.31215 5.67439 5.51694C5.08759 5.72172 4.55167 6.06456 4.10629 6.51996C3.46506 7.18243 3.06411 8.04617 2.96443 8.97103C2.86475 9.89589 3.07222 10.8281 3.5539 11.6192C3.36725 12.2151 3.31602 12.85 3.40502 13.4718C3.49403 14.0936 3.72036 14.6842 4.06644 15.1945C4.56302 15.9234 5.26707 16.488 6.08984 16.8177C6.9126 17.1474 7.81755 17.2282 8.69018 17.049C9.08987 17.6753 9.62638 18.198 10.2606 18.5796C10.8949 18.9612 11.6109 19.1917 12.3569 19.2548C13.2298 19.3301 14.119 19.119 14.8997 18.6526C15.6804 18.1862 16.314 17.4881 16.7137 16.6547C17.3251 16.7412 17.9476 16.6796 18.5344 16.4748C19.1212 16.27 19.6571 15.9272 20.1025 15.4718C20.7437 14.8093 21.1447 13.9456 21.2443 13.0207C21.344 12.0959 21.1365 11.1636 20.6548 10.3725Z" fill="black"/>
                    </svg>
                  </div>
                  <div className="flex items-center gap-1.5 py-1 text-black">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-black/40 animate-[bounce_1s_infinite_0ms]" />
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-black/40 animate-[bounce_1s_infinite_200ms]" />
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-black/40 animate-[bounce_1s_infinite_400ms]" />
                  </div>
                </div>
              </div>
            )}
            
            <div ref={endOfMessagesRef} className="h-2" />
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 sm:p-6 bg-gradient-to-t from-white via-white to-white/0 shrink-0 absolute bottom-0 left-0 right-0">
          <div className="max-w-[48rem] mx-auto relative">
            
            <div className="relative bg-[#f4f4f4] border border-transparent rounded-[26px] overflow-hidden flex flex-col focus-within:bg-white focus-within:border-[#e5e5e5] focus-within:shadow-[0_0_15px_rgba(0,0,0,0.05)] transition-all duration-200">
              
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message ChatGPT..."
                className="w-full max-h-[200px] min-h-[52px] px-5 py-[14px] bg-transparent resize-none focus:outline-none text-base placeholder:text-[#8e8ea0] scrollbar-thin relative z-10"
                rows={1}
              />
              
              <div className="flex items-center justify-between px-3 pb-3 relative z-10">
                <div className="flex items-center gap-1 text-[#0d0d0d]">
                  <button className="p-2 rounded-full hover:bg-black/5 transition-colors" title="Attach file">
                    <Paperclip size={20} className="text-[#0d0d0d]" />
                  </button>
                </div>
                
                <button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isThinking}
                  className={clsx(
                    'flex items-center justify-center h-8 w-8 rounded-full transition-all duration-200',
                    inputValue.trim() && !isThinking
                      ? 'bg-black text-white hover:bg-[#333]'
                      : 'bg-[#e5e5e5] text-white cursor-not-allowed'
                  )}
                >
                  <Send size={14} className={clsx(inputValue.trim() && !isThinking ? '' : 'translate-x-[-1px]')} />
                </button>
              </div>
            </div>

            <div className="text-center mt-2 hidden sm:block">
              <span className="text-xs text-[#666666]">
                ChatGPT can make mistakes. Consider verifying important information.
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}