import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingCart, Star } from "lucide-react";

export default function POSPage() {
  const { menu, processSale } = useStore();

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
                <Card key={item.id} className="flex flex-col hover:border-primary/50 transition-colors cursor-pointer group" onClick={() => processSale(item.id)}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-xl">{item.name}</CardTitle>
                      <Badge variant="secondary" className="font-mono text-base bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20">
                        ${item.price.toFixed(2)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="flex items-center gap-1 text-yellow-500 mb-2">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="font-medium">{item.rating.toFixed(1)}</span>
                      <span className="text-muted-foreground text-xs">({item.ratingCount} reviews)</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Ingredients: {item.ingredients.length} items
                    </div>
                  </CardContent>
                  <CardFooter className="bg-muted/30 border-t p-4">
                    <Button className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      Add to Order
                    </Button>
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
