import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertAccommodationSchema } from "@shared/schema.js";
import { useAccommodations } from "@/hooks/use-accommodations.jsx";
import { useAuth } from "@/hooks/use-auth.jsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Textarea } from "@/components/ui/textarea.jsx";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form.jsx";
import { Loader2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast.js";

// Create form schema based on accommodation schema with additional validation
const formSchema = insertAccommodationSchema.omit({
  id: true,
  userId: true,
  // photos: true // No longer needed
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

export function AccommodationForm({ 
  accommodation, 
  initialLocation, 
  onClose 
}) {
  const { user } = useAuth();
  const { createAccommodationMutation, updateAccommodationMutation } = useAccommodations();
  const { toast } = useToast();
  // const [selectedFiles, setSelectedFiles] = useState([]); // Remove file state
  
  const isEditing = !!accommodation;
  
  const form = useForm({
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

  // Remove handleFileChange
  // const handleFileChange = ...
  
  // Revert onSubmit to send plain JSON
  const onSubmit = (data) => { 
    if (!user) return;

    // Remove FormData logic
    // const formData = ...
    // Object.keys(data).forEach ...
    // if (!isEditing) { selectedFiles.forEach ... }
    
    if (isEditing && accommodation) {
      updateAccommodationMutation.mutate({
        id: accommodation.id,
        accommodation: data 
      }, {
        onSuccess: onClose
      });
    } else {
      // Send plain JS object for creation, including userId
      createAccommodationMutation.mutate({ 
        ...data, 
        // Assuming useAuth provides user._id correctly here
        // If not, adjust based on actual user object structure
        userId: user?._id // Add userId directly if needed by backend/mutation hook
      }, { 
        onSuccess: onClose
      });
    }
  };
  
  const isPending = createAccommodationMutation.isPending || updateAccommodationMutation.isPending;
  
  return (
    <Dialog open={true} onOpenChange={() => !isPending && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
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
            
            {/* --- Remove Photo Upload Field --- */}
            {/* {!isEditing && ( ... remove entire block ... )} */}
            
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
            
            <DialogFooter className="pt-4">
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
