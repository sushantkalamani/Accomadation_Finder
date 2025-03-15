import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertAccommodationSchema, Accommodation } from "@shared/schema";
import { useAccommodations } from "@/hooks/use-accommodations";
import { useAuth } from "@/hooks/use-auth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, X } from "lucide-react";

interface AccommodationFormProps {
  accommodation?: Accommodation | null;
  initialLocation?: { lat: number, lng: number } | null;
  onClose: () => void;
}

// Create form schema based on accommodation schema with additional validation
const formSchema = insertAccommodationSchema.omit({ 
  id: true, 
  userId: true 
}).extend({
  // Add Indian phone number validation (10 digits)
  phone: z.string()
    .min(10, "Phone number must be at least 10 digits")
    .max(10, "Phone number must be exactly 10 digits")
    .regex(/^[0-9]{10}$/, "Phone number must be 10 digits")
    .refine((value) => /^[6-9][0-9]{9}$/.test(value), {
      message: "Phone number must be a valid Indian mobile number starting with 6, 7, 8, or 9"
    })
});

type FormValues = z.infer<typeof formSchema>;

export function AccommodationForm({ 
  accommodation, 
  initialLocation, 
  onClose 
}: AccommodationFormProps) {
  const { user } = useAuth();
  const { createAccommodationMutation, updateAccommodationMutation } = useAccommodations();
  
  const isEditing = !!accommodation;
  
  // Initialize form with existing data or defaults
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: isEditing ? {
      name: accommodation.name,
      address: accommodation.address,
      rooms: accommodation.rooms,
      price: accommodation.price,
      phone: accommodation.phone,
      description: accommodation.description || "",
      latitude: accommodation.latitude,
      longitude: accommodation.longitude,
    } : {
      name: "",
      address: "",
      rooms: 1,
      price: 0,
      phone: "",
      description: "",
      latitude: initialLocation?.lat || 0,
      longitude: initialLocation?.lng || 0,
    },
  });
  
  const onSubmit = (data: FormValues) => {
    if (!user) return;
    
    if (isEditing && accommodation) {
      updateAccommodationMutation.mutate({
        id: accommodation.id,
        accommodation: {
          ...data,
          userId: user.id
        }
      }, {
        onSuccess: onClose
      });
    } else {
      createAccommodationMutation.mutate({
        ...data,
        userId: user.id
      }, {
        onSuccess: onClose
      });
    }
  };
  
  const isPending = createAccommodationMutation.isPending || updateAccommodationMutation.isPending;
  
  return (
    <Dialog open={true} onOpenChange={() => !isPending && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-xl font-bold">
            {isEditing ? "Edit Accommodation" : "Add New Accommodation"}
          </DialogTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute top-2 right-2" 
            onClick={onClose}
            disabled={isPending}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Accommodation Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Luxury Apartment" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input placeholder="Full address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="rooms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Rooms</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={1} 
                        placeholder="e.g. 2" 
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 1)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price per Month (₹)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={0} 
                        step={0.01}
                        placeholder="e.g. 120" 
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 9876543210" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe the accommodation..." 
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="latitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Latitude</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="any" 
                        readOnly={!!initialLocation}
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="longitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Longitude</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="any" 
                        readOnly={!!initialLocation}
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#FF5A5F] hover:bg-[#E00B41] text-white"
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {isEditing ? "Update" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
