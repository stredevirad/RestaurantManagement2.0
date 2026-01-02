import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingCart, Star, Clock, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useState } from "react";

export default function POSPage() {
  const { menu, processSale, inventory, submitRating } = useStore();
  const [ratingItem, setRatingItem] = useState<string | null>(null);
  const [hoveredStar, setHoveredStar] = useState<number>(0);
  const [customizingItem, setCustomizingItem] = useState<string | null>(null);
  const [mods, setMods] = useState<{remove: string[], add: string[]}>({remove: [], add: []});
  const [aiMessage, setAiMessage] = useState<string>("Welcome! I'm your ShelfSense AI. Need help choosing a dish based on current stock?");

  const categories = Array.from(new Set(menu.map(item => item.category)));

  const handleOrder = (itemId: string) => {
    processSale(itemId, mods);
    setCustomizingItem(null);
    setMods({remove: [], add: []});
  };

  const askAi = () => {
    const lowStock = inventory.filter(i => i.quantity < i.threshold).map(i => i.name);
    if (lowStock.length > 0) {
      setAiMessage(`I recommend the ${menu.find(m => !m.ingredients.some(ing => lowStock.includes(inventory.find(inv => inv.id === ing.inventoryId)?.name || '')) )?.name || 'Crispy Fries'}. We are a bit low on ${lowStock[0]}, so this choice helps our kitchen stay efficient!`);
    } else {
      setAiMessage("All ingredients are perfectly stocked. Our Chef suggests the Double Smash Burger today!");
    }
  };

  return (
    <div className="space-y-8 h-full pb-20">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-4xl font-black tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Point of Sale</h2>
          <p className="text-muted-foreground mt-2">Precision inventory subtraction for every gourmet order.</p>
        </div>
        <div className="flex gap-4">
          <Card className="bg-primary/5 border-primary/20 p-4 rounded-2xl flex items-center gap-4 max-w-md">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center animate-pulse">
              <Zap className="text-black h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-primary">ShelfSense AI Agent</p>
              <p className="text-xs font-bold text-white line-clamp-2">{aiMessage}</p>
            </div>
            <Button size="sm" variant="ghost" onClick={askAi} className="hover:bg-primary/20">Ask</Button>
          </Card>
          <Button variant="outline" className="gap-2 rounded-full border-primary/20 hover:bg-primary/10 self-center">
            <ShoppingCart className="h-4 w-4" /> View Current Order
          </Button>
        </div>
      </motion.div>

      <Tabs defaultValue={categories[0]} className="w-full">
        <TabsList className="w-full justify-start h-auto p-1 bg-muted/20 mb-10 border border-white/5 rounded-2xl">
          {categories.map(category => (
            <TabsTrigger 
              key={category} 
              value={category}
              className="px-8 py-4 capitalize text-sm font-bold tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl transition-all duration-300"
            >
              {category}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {categories.map(category => (
          <TabsContent key={category} value={category} className="mt-0 outline-none">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              <AnimatePresence mode="popLayout">
                {menu.filter(item => item.category === category).map((item, index) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ y: -5 }}
                  >
                    <Card className="flex flex-col h-full bg-card/40 backdrop-blur-xl border-white/5 hover:border-primary/50 transition-all duration-500 rounded-3xl overflow-hidden group shadow-2xl">
                      <CardHeader className="p-6">
                        <div className="flex justify-between items-start gap-4">
                          <CardTitle className="text-2xl font-bold tracking-tight group-hover:text-primary transition-colors">{item.name}</CardTitle>
                          <Badge variant="secondary" className="font-mono text-lg py-1 px-3 bg-primary/10 text-primary border border-primary/20 rounded-xl">
                            ${item.price.toFixed(2)}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="px-6 flex-1 space-y-6">
                        <p className="text-sm text-muted-foreground/80 leading-relaxed font-medium line-clamp-3">{item.description}</p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 rounded-full border border-yellow-500/20">
                            <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                            <span className="font-bold text-yellow-500 text-sm">{item.rating.toFixed(1)}</span>
                            <span className="text-yellow-500/60 text-[10px] font-bold">({item.ratingCount})</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground font-mono text-xs">
                            <Clock className="h-4 w-4 text-primary" />
                            {item.prepTime}
                          </div>
                        </div>

                        <div className="pt-4 border-t border-white/5 flex flex-wrap gap-2">
                          {item.ingredients.map(ing => {
                            const invName = inventory.find(inv => inv.id === ing.inventoryId)?.name || 'Unknown';
                            return (
                              <Badge key={ing.inventoryId} variant="outline" className="text-[10px] uppercase tracking-tighter py-0.5 px-2 bg-white/5 border-white/10 opacity-60">
                                {invName}
                              </Badge>
                            );
                          })}
                        </div>
                      </CardContent>
                      <CardFooter className="p-6 bg-white/5 flex gap-3">
                        <Dialog open={customizingItem === item.id} onOpenChange={(open) => setCustomizingItem(open ? item.id : null)}>
                          <DialogTrigger asChild>
                            <Button 
                              className="flex-1 h-12 rounded-2xl font-bold tracking-widest text-xs uppercase shadow-lg shadow-primary/20 active:scale-95 transition-all"
                            >
                              Customize & Order
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="rounded-[2.5rem] bg-card/95 backdrop-blur-2xl border-white/10">
                            <DialogHeader>
                              <DialogTitle className="text-2xl font-black italic">CUSTOMIZE {item.name}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-6 py-4">
                              <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Remove Ingredients</Label>
                                <div className="flex flex-wrap gap-2">
                                  {item.ingredients.map(ing => {
                                    const name = inventory.find(inv => inv.id === ing.inventoryId)?.name || '';
                                    const isRemoved = mods.remove.includes(name);
                                    return (
                                      <Badge 
                                        key={ing.inventoryId}
                                        variant={isRemoved ? "destructive" : "outline"}
                                        className="cursor-pointer py-1.5 px-3 rounded-xl transition-all"
                                        onClick={() => {
                                          setMods(prev => ({
                                            ...prev,
                                            remove: isRemoved ? prev.remove.filter(n => n !== name) : [...prev.remove, name]
                                          }));
                                        }}
                                      >
                                        {isRemoved ? 'Removed ' : ''}{name}
                                      </Badge>
                                    );
                                  })}
                                </div>
                              </div>
                              <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Add Extra (+$2.00)</Label>
                                <div className="flex flex-wrap gap-2">
                                  {['Extra Sauce', 'Jalapeños', 'Avocado', 'Bacon'].map(extra => {
                                    const isAdded = mods.add.includes(extra);
                                    return (
                                      <Badge 
                                        key={extra}
                                        variant={isAdded ? "default" : "outline"}
                                        className="cursor-pointer py-1.5 px-3 rounded-xl transition-all"
                                        onClick={() => {
                                          setMods(prev => ({
                                            ...prev,
                                            add: isAdded ? prev.add.filter(n => n !== extra) : [...prev.add, extra]
                                          }));
                                        }}
                                      >
                                        {isAdded ? 'Added ' : ''}{extra}
                                      </Badge>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button className="w-full h-12 rounded-2xl font-black" onClick={() => handleOrder(item.id)}>CONFIRM ORDER</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        
                        <Dialog open={ratingItem === item.id} onOpenChange={(open) => {
                          setRatingItem(open ? item.id : null);
                          setHoveredStar(0);
                        }}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl border-white/10 hover:bg-yellow-500/10 hover:text-yellow-500 hover:border-yellow-500/50">
                              <Star className="h-5 w-5" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="rounded-[2.5rem] bg-card/95 backdrop-blur-2xl border-white/10 max-w-sm">
                            <DialogHeader className="items-center text-center">
                              <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center mb-4">
                                <Star className="h-8 w-8 text-primary fill-primary" />
                              </div>
                              <DialogTitle className="text-3xl font-black italic">RATE IT</DialogTitle>
                              <p className="text-muted-foreground font-medium mt-1">Gourmet experience by {item.chef}</p>
                            </DialogHeader>
                            <div className="flex justify-center gap-2 py-10">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <motion.button
                                  key={star}
                                  whileHover={{ scale: 1.2, rotate: 15 }}
                                  whileTap={{ scale: 0.9 }}
                                  onMouseEnter={() => setHoveredStar(star)}
                                  onMouseLeave={() => setHoveredStar(0)}
                                  onClick={() => {
                                    submitRating(item.id, star);
                                    setRatingItem(null);
                                  }}
                                  className="p-1 focus:outline-none transition-colors"
                                >
                                  <Star 
                                    className={`h-10 w-10 transition-all duration-200 ${
                                      (hoveredStar >= star) 
                                        ? 'fill-yellow-500 text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]' 
                                        : 'text-muted-foreground/20 fill-none'
                                    }`} 
                                  />
                                </motion.button>
                              ))}
                            </div>
                            <DialogFooter className="justify-center sm:justify-center">
                              <p className="text-[10px] text-center font-bold tracking-widest uppercase text-muted-foreground/60 max-w-[200px]">
                                Your feedback optimizes our ingredient supply chain.
                              </p>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
