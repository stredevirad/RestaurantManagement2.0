import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingCart, Star, Clock, Info, Zap, Trash2, Plus, Minus, CreditCard } from "lucide-react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { useState } from "react";

// Add-on configuration based on category
const ADD_ONS: Record<string, string[]> = {
  main: ['Extra Cheese', 'Bacon', 'Avocado', 'Jalapeños', 'Fried Egg'],
  appetizer: ['Extra Sauce', 'Cheese Sauce', 'Bacon Bits'],
  dessert: ['Whipped Cream', 'Rainbow Sprinkles', 'Chocolate Sauce', 'Cherry'],
  drink: ['Whipped Cream', 'Extra Shot', 'Caramel Drizzle'],
};

export default function POSPage() {
  const { menu, processSale, inventory, submitRating, cart, addToCart, removeFromCart, checkout, clearCart } = useStore();
  const [ratingItem, setRatingItem] = useState<string | null>(null);
  const [hoveredStar, setHoveredStar] = useState<number>(0);
  const [customizingItem, setCustomizingItem] = useState<string | null>(null);
  const [mods, setMods] = useState<{remove: string[], add: string[]}>({remove: [], add: []});
  const [aiMessage, setAiMessage] = useState<string>("Welcome! I'm your THALLIPOLI AI. Need help choosing a dish based on current stock?");

  const categories = Array.from(new Set(menu.map(item => item.category)));

  const handleAddToCart = (itemId: string) => {
    addToCart(itemId, mods);
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

  const cartTotal = cart.reduce((total, cartItem) => {
    const menuItem = menu.find(m => m.id === cartItem.menuItemId);
    if (!menuItem) return total;
    const extrasCost = cartItem.modifications.add.length * 2.00;
    return total + menuItem.price + extrasCost;
  }, 0);

  return (
    <div className="h-full flex gap-6 pb-20">
      {/* Main Menu Area */}
      <div className="flex-1 space-y-8 overflow-hidden flex flex-col">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between shrink-0"
        >
          <div>
            <h2 className="text-4xl font-black tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Point of Sale</h2>
            <p className="text-muted-foreground mt-2">Precision inventory subtraction for every gourmet order.</p>
          </div>
          <Card className="bg-primary/5 border-primary/20 p-4 rounded-2xl flex items-center gap-4 max-w-md">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center animate-pulse">
              <Zap className="text-black h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-primary">THALLIPOLI AI Agent</p>
              <p className="text-xs font-bold text-white line-clamp-2">{aiMessage}</p>
            </div>
            <Button size="sm" variant="ghost" onClick={askAi} className="hover:bg-primary/20">Ask</Button>
          </Card>
        </motion.div>

        <Tabs defaultValue={categories[0]} className="w-full flex-1 flex flex-col overflow-hidden">
          <TabsList className="w-full justify-start h-auto p-1 bg-muted/20 mb-6 border border-white/5 rounded-2xl shrink-0">
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
          
          <div className="flex-1 overflow-y-auto pr-2">
            {categories.map(category => (
              <TabsContent key={category} value={category} className="mt-0 outline-none h-full">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 pb-10">
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
                        <Card className="flex flex-col h-full bg-card/40 backdrop-blur-xl border-white/5 hover:border-primary/50 transition-all duration-500 rounded-3xl overflow-hidden group shadow-2xl min-h-[420px]">
                          <CardHeader className="p-6 pb-2">
                            <div className="flex flex-col gap-2">
                              <CardTitle className="text-2xl font-bold tracking-tight group-hover:text-primary transition-colors line-clamp-1" title={item.name}>{item.name}</CardTitle>
                              <div className="flex items-center justify-between">
                                <Badge variant="secondary" className="font-mono text-lg py-1 px-3 bg-primary/10 text-primary border border-primary/20 rounded-xl whitespace-nowrap">
                                  ${item.price.toFixed(2)}
                                </Badge>
                                <div className="flex items-center gap-1.5 text-muted-foreground font-mono text-xs">
                                  <Clock className="h-4 w-4 text-primary" />
                                  {item.prepTime}
                                </div>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="px-6 flex-1 space-y-6 flex flex-col">
                            <ScrollArea className="h-[80px]">
                              <p className="text-sm text-muted-foreground/90 leading-relaxed font-medium">{item.description}</p>
                            </ScrollArea>
                            
                            <div className="flex items-center justify-between mt-auto">
                              <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 rounded-full border border-yellow-500/20">
                                <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                                <span className="font-bold text-yellow-500 text-sm">{item.rating.toFixed(1)}</span>
                                <span className="text-yellow-500/60 text-[10px] font-bold">({item.ratingCount})</span>
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
                          <CardFooter className="p-6 bg-white/5 flex gap-3 mt-auto">
                            <Dialog open={customizingItem === item.id} onOpenChange={(open) => setCustomizingItem(open ? item.id : null)}>
                              <DialogTrigger asChild>
                                <Button 
                                  className="flex-1 h-12 rounded-2xl font-bold tracking-widest text-xs uppercase shadow-lg shadow-primary/20 active:scale-95 transition-all"
                                >
                                  Customize & Add
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
                                      {(ADD_ONS[item.category] || ADD_ONS['main']).map(extra => {
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
                                  <Button className="w-full h-12 rounded-2xl font-black" onClick={() => handleAddToCart(item.id)}>ADD TO CART</Button>
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
          </div>
        </Tabs>
      </div>

      {/* Cart Sidebar */}
      <div className="w-96 shrink-0 flex flex-col bg-card/30 border-l border-white/5 h-full rounded-l-3xl p-6 backdrop-blur-md">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-black tracking-tight flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            Current Order
          </h3>
          <Badge variant="outline" className="font-mono text-xs">{cart.length} items</Badge>
        </div>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-4">
            <AnimatePresence initial={false}>
              {cart.map((cartItem) => {
                const menuItem = menu.find(m => m.id === cartItem.menuItemId);
                if (!menuItem) return null;
                const extrasCost = cartItem.modifications.add.length * 2.00;
                
                return (
                  <motion.div
                    key={cartItem.id}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <Card className="bg-card border-white/10 overflow-hidden group">
                      <CardContent className="p-4 relative">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="absolute right-2 top-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10"
                          onClick={() => removeFromCart(cartItem.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                        <div className="flex justify-between items-start pr-6">
                          <div>
                            <p className="font-bold text-sm">{menuItem.name}</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {cartItem.modifications.remove.map(r => (
                                <span key={r} className="text-[10px] text-destructive px-1 bg-destructive/10 rounded">-{r}</span>
                              ))}
                              {cartItem.modifications.add.map(a => (
                                <span key={a} className="text-[10px] text-primary px-1 bg-primary/10 rounded">+{a}</span>
                              ))}
                            </div>
                          </div>
                          <p className="font-mono text-sm font-medium">
                            ${(menuItem.price + extrasCost).toFixed(2)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {cart.length === 0 && (
              <div className="text-center py-20 text-muted-foreground/40 border-2 border-dashed border-white/5 rounded-3xl">
                <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm font-bold uppercase tracking-widest">Cart is empty</p>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="mt-6 pt-6 border-t border-white/10 space-y-4">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Subtotal</span>
            <span className="font-mono">${cartTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Tax (8%)</span>
            <span className="font-mono">${(cartTotal * 0.08).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xl font-black">
            <span>Total</span>
            <span className="font-mono text-primary">${(cartTotal * 1.08).toFixed(2)}</span>
          </div>
          
          <Button 
            className="w-full h-14 rounded-2xl font-black text-lg shadow-lg shadow-primary/20"
            disabled={cart.length === 0}
            onClick={checkout}
          >
            <CreditCard className="mr-2 h-5 w-5" />
            PAY NOW
          </Button>
          <Button variant="ghost" className="w-full text-muted-foreground text-xs" onClick={clearCart} disabled={cart.length === 0}>
            Clear Cart
          </Button>
        </div>
      </div>
    </div>
  );
}
