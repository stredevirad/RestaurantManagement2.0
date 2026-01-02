import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, X, Send, Bot, User, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: "Hello! I am THALLIPOLI AI. I'm connected to your kitchen's live data and can help you manage inventory, process sales, check finances, and provide strategic insights. Try asking me to 'restock beef' or 'what's low in stock?'" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [location, setLocation] = useLocation();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          conversationId,
        }),
      });

      const data = await response.json();
      
      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId);
      }

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || "I apologize, but I couldn't process that request.",
      };
      
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I encountered an error processing your request. Please try again.",
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="mb-4"
          >
            <Card className="w-[380px] h-[600px] flex flex-col shadow-2xl border-primary/20 bg-black/90 backdrop-blur-xl ring-1 ring-white/10">
              <CardHeader className="bg-gradient-to-r from-primary/20 to-transparent border-b border-white/10 p-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3 text-lg font-black tracking-tight text-white">
                    <div className="relative">
                      <Bot className="h-6 w-6 text-primary" />
                      <Sparkles className="h-3 w-3 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
                    </div>
                    THALLIPOLI AI
                  </CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8 hover:bg-white/10 text-white/70 hover:text-white" data-testid="button-close-chat">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-500">Powered by Gemini AI</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-0 overflow-hidden bg-black/50">
                <ScrollArea className="h-full p-4" ref={scrollRef}>
                  <div className="space-y-6">
                    {messages.map(msg => (
                      <div
                        key={msg.id}
                        className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        data-testid={`message-${msg.role}-${msg.id}`}
                      >
                        {msg.role === 'assistant' && (
                          <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center shrink-0 border border-primary/30 mt-1">
                            <Bot className="h-4 w-4 text-primary" />
                          </div>
                        )}
                        <div
                          className={`rounded-2xl px-4 py-3 max-w-[85%] text-sm leading-relaxed shadow-sm ${
                            msg.role === 'user'
                              ? 'bg-primary text-primary-foreground rounded-tr-sm'
                              : 'bg-white/10 text-white rounded-tl-sm border border-white/5'
                          }`}
                          data-testid={`text-message-${msg.role}`}
                        >
                          {msg.content}
                        </div>
                        {msg.role === 'user' && (
                          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 border border-white/10 mt-1">
                            <User className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </div>
                    ))}
                    {isTyping && (
                      <div className="flex gap-3 justify-start">
                        <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center shrink-0 border border-primary/30">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                         <div className="bg-white/5 rounded-2xl px-4 py-3 rounded-tl-sm border border-white/5 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce"></span>
                            <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce delay-75"></span>
                            <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce delay-150"></span>
                         </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
              <CardFooter className="p-3 border-t border-white/10 bg-black/40">
                <form 
                  onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                  className="flex w-full gap-2"
                >
                  <Input 
                    placeholder="Try: 'restock beef 20kg' or 'sell burger'" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="flex-1 bg-white/5 border-white/10 focus-visible:ring-primary/50 text-white placeholder:text-white/30"
                    data-testid="input-chat-message"
                  />
                  <Button 
                    type="submit" 
                    size="icon" 
                    disabled={!input.trim() || isTyping} 
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    data-testid="button-send-message"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </CardFooter>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-[0_0_40px_-10px_rgba(var(--primary),0.5)] flex items-center justify-center relative group border-2 border-white/10"
        data-testid="button-toggle-chat"
      >
        {isOpen ? <X className="h-7 w-7" /> : <Bot className="h-8 w-8" />}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-primary border-2 border-black"></span>
          </span>
        )}
      </motion.button>
    </div>
  );
}
