import { useState } from "react";
import { useForm } from "react-hook-form";
import { User } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { geocodeLocation } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown, Search, Loader2 } from "lucide-react";

const searchSchema = z.object({
  query: z.string().optional(),
  priceMin: z.number().optional(),
  priceMax: z.number().optional(),
  rooms: z.number().optional(),
});

type SearchValues = z.infer<typeof searchSchema>;

interface NavbarProps {
  user: User;
  onSearch: (values: SearchValues, location?: { lat: number, lng: number }) => void;
}

export function Navbar({ user, onSearch }: NavbarProps) {
  const { logoutMutation } = useAuth();
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  const form = useForm<SearchValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      query: "",
      priceMin: undefined,
      priceMax: undefined,
      rooms: undefined,
    },
  });
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  const onSubmit = async (data: SearchValues) => {
    setIsSearching(true);
    let location = null;
    
    // If there's a search query, try to geocode it
    if (data.query) {
      location = await geocodeLocation(data.query);
    }
    
    onSearch(data, location);
    setIsSearching(false);
    setShowFilters(false);
  };
  
  const resetFilters = () => {
    form.reset({
      query: form.getValues("query"),
      priceMin: undefined,
      priceMax: undefined,
      rooms: undefined,
    });
  };
  
  const userInitials = user.name
    .split(" ")
    .map(part => part[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
  
  return (
    <header className="bg-white shadow-sm z-20">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-xl font-bold text-[#FF5A5F] mr-4">RoomFinder</h1>
          
          <Form {...form}>
            <div className="relative hidden md:block">
              <FormField
                control={form.control}
                name="query"
                render={({ field }) => (
                  <FormItem className="m-0">
                    <FormControl>
                      <div className="flex items-center border border-neutral-200 rounded-full px-4 py-2 bg-white shadow-sm">
                        <Input
                          className="border-0 focus-visible:ring-0 focus-visible:outline-none px-0 shadow-none"
                          placeholder="Search location, price, or facilities..."
                          {...field}
                          onFocus={() => setShowFilters(true)}
                        />
                        <Button
                          type="button"
                          onClick={form.handleSubmit(onSubmit)}
                          className="ml-2 p-1 rounded-full bg-[#FF5A5F] hover:bg-[#E00B41] h-8 w-8"
                          disabled={isSearching}
                        >
                          {isSearching ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Search className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />
              
              {showFilters && (
                <div className="absolute mt-2 bg-white rounded-lg shadow-lg p-4 w-full">
                  <h3 className="text-neutral-900 font-medium mb-3">Filters</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-500 mb-1">
                        Price Range
                      </label>
                      <div className="flex space-x-2">
                        <FormField
                          control={form.control}
                          name="priceMin"
                          render={({ field }) => (
                            <FormItem className="m-0 flex-1">
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="Min"
                                  className="text-sm"
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                  value={field.value === undefined ? "" : field.value}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="priceMax"
                          render={({ field }) => (
                            <FormItem className="m-0 flex-1">
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="Max"
                                  className="text-sm"
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                  value={field.value === undefined ? "" : field.value}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-500 mb-1">
                        Rooms
                      </label>
                      <FormField
                        control={form.control}
                        name="rooms"
                        render={({ field }) => (
                          <FormItem className="m-0">
                            <FormControl>
                              <select
                                className="w-full p-2 border rounded-md text-sm"
                                {...field}
                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                                value={field.value === undefined ? "" : field.value}
                              >
                                <option value="">Any</option>
                                <option value="1">1+</option>
                                <option value="2">2+</option>
                                <option value="3">3+</option>
                                <option value="4">4+</option>
                              </select>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      className="mr-2 text-sm h-8"
                      onClick={resetFilters}
                    >
                      Reset
                    </Button>
                    <Button
                      type="button"
                      className="text-sm h-8 bg-[#FF5A5F] hover:bg-[#E00B41]"
                      onClick={form.handleSubmit(onSubmit)}
                      disabled={isSearching}
                    >
                      {isSearching ? (
                        <span className="flex items-center">
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          Searching...
                        </span>
                      ) : (
                        "Apply"
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Form>
        </div>
        
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden mr-4 text-neutral-500"
            onClick={() => setShowMobileSearch(!showMobileSearch)}
          >
            <Search className="h-5 w-5" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-1 text-neutral-900 hover:text-[#FF5A5F]">
                <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center">
                  <span className="text-sm font-medium">{userInitials}</span>
                </div>
                <span className="hidden md:inline text-sm font-medium">{user.name}</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem>My Profile</DropdownMenuItem>
              <DropdownMenuItem>My Accommodations</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600" onClick={handleLogout}>
                Log Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Mobile Search */}
      {showMobileSearch && (
        <div className="md:hidden px-4 pb-3">
          <Form {...form}>
            <div className="flex items-center border border-neutral-200 rounded-full px-4 py-2 bg-white shadow-sm">
              <FormField
                control={form.control}
                name="query"
                render={({ field }) => (
                  <FormItem className="m-0 flex-1">
                    <FormControl>
                      <Input
                        className="border-0 focus-visible:ring-0 focus-visible:outline-none px-0 shadow-none"
                        placeholder="Search location, price, or facilities..."
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button
                type="button"
                onClick={form.handleSubmit(onSubmit)}
                className="ml-2 p-1 rounded-full bg-[#FF5A5F] hover:bg-[#E00B41] h-8 w-8"
                disabled={isSearching}
              >
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
          </Form>
        </div>
      )}
    </header>
  );
}
