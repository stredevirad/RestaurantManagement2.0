import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingCart, Star, Clock, Info } from "lucide-react";
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

  const categories = Array.from(new Set(menu.map(item => item.category)));

  return (
    <div className="space-y-8 h-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Point of Sale</h2>
          <p className="text-muted-foreground">Process customer orders and deduct inventory automatically.</p>
        </div>
        <Button variant="outline" className="gap-2">
          <ShoppingCart className="h-4 w-4" /> View Current Order
        </Button>
      </div>

      <Tabs defaultValue={categories[0]} className="w-full">
        <TabsList className="w-full justify-start h-auto p-1 bg-muted/50 mb-6">
          {categories.map(category => (
            <TabsTrigger 
              key={category} 
              value={category}
              className="px-8 py-3 capitalize text-md data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              {category}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {categories.map(category => (
          <TabsContent key={category} value={category} className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {menu.filter(item => item.category === category).map(item => (
                <Card key={item.id} className="flex flex-col hover:border-primary/50 transition-colors cursor-pointer group">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-xl">{item.name}</CardTitle>
                      <Badge variant="secondary" className="font-mono text-base bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20">
                        ${item.price.toFixed(2)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-4" onClick={() => processSale(item.id)}>
                    <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-yellow-500">
                        <Star className="h-4 w-4 fill-current" />
                        <span className="font-medium">{item.rating.toFixed(1)}</span>
                        <span className="text-muted-foreground text-xs">({item.ratingCount})</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground text-xs">
                        <Clock className="h-3 w-3" />
                        {item.prepTime}
                      </div>
                    </div>

                    <div className="pt-2 border-t flex flex-wrap gap-1">
                      {item.ingredients.map(ing => {
                        const invName = inventory.find(inv => inv.id === ing.inventoryId)?.name || 'Unknown';
                        return (
                          <Badge key={ing.inventoryId} variant="outline" className="text-[10px] py-0 px-1 opacity-70">
                            {invName}
                          </Badge>
                        );
                      })}
                    </div>
                  </CardContent>
                  <CardFooter className="bg-muted/30 border-t p-4 flex gap-2">
                    <Button 
                      className="flex-1 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                      onClick={() => processSale(item.id)}
                    >
                      Order
                    </Button>
                    
                    <Dialog open={ratingItem === item.id} onOpenChange={(open) => setRatingItem(open ? item.id : null)}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="icon" title="Rate this dish">
                          <Star className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Rate {item.name}</DialogTitle>
                          <p className="text-sm text-muted-foreground">Cooked by {item.chef}</p>
                        </DialogHeader>
                        <div className="flex justify-center gap-4 py-8">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Button
                              key={star}
                              variant="ghost"
                              size="lg"
                              className="text-yellow-500 hover:scale-110"
                              onClick={() => {
                                submitRating(item.id, star);
                                setRatingItem(null);
                              }}
                            >
                              <Star className={`h-8 w-8 ${star <= Math.round(item.rating) ? 'fill-current' : ''}`} />
                            </Button>
                          ))}
                        </div>
                        <DialogFooter className="text-xs text-muted-foreground text-center">
                          High ratings increase ingredient stock thresholds to meet demand.
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
