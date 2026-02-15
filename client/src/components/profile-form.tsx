import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const formSchema = z.object({
  creditScoreRange: z.string().min(1, "Required"),
  totalRevolvingLimit: z.coerce.number().min(0),
  totalBalances: z.coerce.number().min(0),
  inquiries: z.coerce.number().min(0),
  derogatoryAccounts: z.coerce.number().min(0),
});

export function CreditProfileForm() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      creditScoreRange: user?.creditScoreRange || "",
      totalRevolvingLimit: user?.totalRevolvingLimit || 0,
      totalBalances: user?.totalBalances || 0,
      inquiries: user?.inquiries || 0,
      derogatoryAccounts: user?.derogatoryAccounts || 0,
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    updateUser(values);
    toast({
      title: "Profile Updated",
      description: "Your credit profile data has been saved.",
    });
  }

  return (
    <Card className="bg-white border-[#E5E7EB] shadow-sm">
      <CardHeader>
        <CardTitle className="text-[#1A1A1A]">Credit Profile Data</CardTitle>
        <CardDescription className="text-[#666]">Enter your current credit statistics for accurate analysis.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="creditScoreRange"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#333]">Credit Score Range</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-white border-[#E5E7EB] text-[#1A1A1A]">
                        <SelectValue placeholder="Select range" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="750+">750+ (Excellent)</SelectItem>
                      <SelectItem value="700-749">700-749 (Good)</SelectItem>
                      <SelectItem value="650-699">650-699 (Fair)</SelectItem>
                      <SelectItem value="600-649">600-649 (Poor)</SelectItem>
                      <SelectItem value="<600">Below 600</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="totalRevolvingLimit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#333]">Total Revolving Limits ($)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} className="bg-white border-[#E5E7EB] text-[#1A1A1A] font-mono" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="totalBalances"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#333]">Total Balances ($)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} className="bg-white border-[#E5E7EB] text-[#1A1A1A] font-mono" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="inquiries"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#333]">Hard Inquiries (Last 6mo)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} className="bg-white border-[#E5E7EB] text-[#1A1A1A] font-mono" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="derogatoryAccounts"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#333]">Derogatory Accounts</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} className="bg-white border-[#E5E7EB] text-[#1A1A1A] font-mono" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" className="w-full bg-[#2E7D32] text-white hover:bg-[#256d29] font-medium">
              Save Profile Data
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
