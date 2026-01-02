import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, X, Send, Bot, User, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import { useStore } from '@/lib/store';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: "Hello! I am THALLIPOLI AI ChatGPT. I'm connected to your kitchen's live data. Ask me about inventory, sales, or strategy!" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [location, setLocation] = useLocation();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Access store data for "Context-Aware" responses
  const { inventory, menu, operatingFunds, realtimeInsights, getLowStockItems, totalRevenue } = useStore();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const generateSmartResponse = (query: string) => {
    const lowerQ = query.toLowerCase();
    
    // 1. Inventory & Stock Queries
    if (lowerQ.includes('stock') || lowerQ.includes('inventory') || lowerQ.includes('have')) {
      const lowStock = getLowStockItems();
      if (lowerQ.includes('low') || lowerQ.includes('out')) {
         if (lowStock.length === 0) return "Inventory is healthy! No items are currently below the threshold.";
         return `⚠️ Critical: We are low on ${lowStock.map(i => `${i.name} (${i.quantity} ${i.unit})`).join(', ')}. Restock advised immediately.`;
      }
      // Check for specific item
      const foundItem = inventory.find(i => lowerQ.includes(i.name.toLowerCase()));
      if (foundItem) {
        return `We currently have ${foundItem.quantity} ${foundItem.unit} of ${foundItem.name}. (Threshold: ${foundItem.threshold} ${foundItem.unit})`;
      }
      return `Total Inventory Value: $${inventory.reduce((acc, i) => acc + (i.quantity * i.pricePerUnit), 0).toFixed(2)}. Low stock items: ${lowStock.length}.`;
    }

    // 2. Financials
    if (lowerQ.includes('money') || lowerQ.includes('funds') || lowerQ.includes('budget') || lowerQ.includes('revenue')) {
      return `💰 Operating Budget: $${operatingFunds.toFixed(2)} | Total Revenue Today: $${totalRevenue.toFixed(2)}. ${operatingFunds < 1000 ? "WARNING: Funds are low!" : "Financial status is stable."}`;
    }

    // 3. Strategy & Insights
    if (lowerQ.includes('strategy') || lowerQ.includes('insight') || lowerQ.includes('tip') || lowerQ.includes('advise')) {
      if (realtimeInsights.length > 0) {
        return `🧠 Latest AI Insight: "${realtimeInsights[0]}"`;
      }
      return "Strategy: Focus on high-margin items like the Vanilla Bean Shake and monitor the 'Bacon' stock levels as they are trending in sales.";
    }

    // 4. Menu
    if (lowerQ.includes('menu') || lowerQ.includes('price') || lowerQ.includes('sell')) {
      const foundDish = menu.find(m => lowerQ.includes(m.name.toLowerCase()));
      if (foundDish) {
        return `🍔 ${foundDish.name}: Selling for $${foundDish.price}. Rated ${foundDish.rating}⭐. Chef: ${foundDish.chef}.`;
      }
      return `We have ${menu.length} active items on the menu. Top rated: ${menu.sort((a,b) => b.rating - a.rating)[0].name}.`;
    }

    // 5. Navigation
    if (lowerQ.includes('go to') || lowerQ.includes('navigate') || lowerQ.includes('show')) {
        if (lowerQ.includes('pos')) { setLocation('/pos'); return "Opening Point of Sale..."; }
        if (lowerQ.includes('inventory')) { setLocation('/inventory'); return "Navigating to Inventory..."; }
        if (lowerQ.includes('kitchen')) { setLocation('/kitchen'); return "Opening Kitchen Display..."; }
        if (lowerQ.includes('analytics') || lowerQ.includes('dashboard')) { setLocation('/analytics'); return "Showing Analytics..."; }
    }

    // Default Fallback
    return "I can help with Inventory levels, Sales data, Financial status, or Menu details. Try asking 'What is low in stock?' or 'How much money do we have?'";
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate AI processing time
    setTimeout(() => {
      const response = generateSmartResponse(userMsg.content);
      const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: response };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 800);
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
                    THALLIPOLI AI ChatGPT
                  </CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8 hover:bg-white/10 text-white/70 hover:text-white">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-500">Connected to Store Data</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-0 overflow-hidden bg-black/50">
                <ScrollArea className="h-full p-4" ref={scrollRef}>
                  <div className="space-y-6">
                    {messages.map(msg => (
                      <div
                        key={msg.id}
                        className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
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
                    placeholder="Ask about stock, sales, or menu..." 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="flex-1 bg-white/5 border-white/10 focus-visible:ring-primary/50 text-white placeholder:text-white/30"
                  />
                  <Button type="submit" size="icon" disabled={!input.trim() || isTyping} className="bg-primary text-primary-foreground hover:bg-primary/90">
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
