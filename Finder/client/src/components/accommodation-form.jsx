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
import { Loader2, X, Plus, ImagePlus, Wifi, Droplet, HomeIcon, Trash } from "lucide-react";
import { useToast } from "@/hooks/use-toast.js";
import { Badge } from "@/components/ui/badge.jsx";

// Create form schema based on accommodation schema with additional validation
const formSchema = insertAccommodationSchema.omit({
  id: true,
  userId: true,
  images: true,
  features: true,
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

// Common features for suggestion
const COMMON_FEATURES = [
  "WiFi", "24/7 Water", "Power Backup", "Parking", "Security", 
  "Furnished", "Air Conditioner", "Geyser", "Washing Machine", "Refrigerator"
];

export function AccommodationForm({ 
  accommodation, 
  initialLocation, 
  onClose 
}) {
  const { user } = useAuth();
  const { createAccommodationMutation, updateAccommodationMutation } = useAccommodations();
  const { toast } = useToast();
  const [selectedImages, setSelectedImages] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);
  const [keepImages, setKeepImages] = useState([]);
  const [features, setFeatures] = useState([]);
  const [newFeature, setNewFeature] = useState("");
  
  const isEditing = !!accommodation;
  
  // Initialize form with values
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
      phone: user?.phone || "",  // Pre-fill with user's phone if available
      description: "",
      latitude: initialLocation?.lat || 0,
      longitude: initialLocation?.lng || 0,
    },
  });
  
  // Initialize features and images from existing accommodation
  useEffect(() => {
    if (isEditing && accommodation) {
      // Initialize features
      if (accommodation.features && Array.isArray(accommodation.features)) {
        setFeatures(accommodation.features);
      }
      
      // Initialize existing images to keep
      if (accommodation.images && Array.isArray(accommodation.images)) {
        setKeepImages(accommodation.images);
      }
    }
  }, [isEditing, accommodation]);
  
  // Handle image selection
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedImages(prev => [...prev, ...files]);
    
    // Create preview URLs for the selected images
    const newPreviewUrls = files.map(file => URL.createObjectURL(file));
    setPreviewImages(prev => [...prev, ...newPreviewUrls]);
  };
  
  // Remove a selected image before upload
  const removeSelectedImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    
    // Revoke the object URL to free memory
    URL.revokeObjectURL(previewImages[index]);
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
  };
  
  // Remove an existing image
  const removeExistingImage = (path) => {
    setKeepImages(prev => prev.filter(img => img !== path));
  };
  
  // Add a new feature
  const addFeature = () => {
    if (newFeature.trim() && !features.includes(newFeature.trim())) {
      setFeatures(prev => [...prev, newFeature.trim()]);
      setNewFeature("");
    }
  };
  
  // Add a suggested feature
  const addSuggestedFeature = (feature) => {
    if (!features.includes(feature)) {
      setFeatures(prev => [...prev, feature]);
    }
  };
  
  // Remove a feature
  const removeFeature = (index) => {
    setFeatures(prev => prev.filter((_, i) => i !== index));
  };
  
  const onSubmit = async (data) => { 
    if (!user) return;

    try {
      // Create FormData for file upload
      const formData = new FormData();
      
      // Ensure numbers are properly converted
      const formattedData = {
        ...data,
        price: Number(data.price),
        rooms: Number(data.rooms),
        latitude: Number(data.latitude),
        longitude: Number(data.longitude),
      };
      
      // Add form data as JSON - IMPORTANT: Include all required fields
      const jsonData = JSON.stringify({
        ...formattedData,
        features: features || [],
        keepImages: keepImages || [],
      });
      
      console.log("Submitting data:", jsonData);
      formData.append('data', jsonData);
      
      // Add selected images
      selectedImages.forEach(file => {
        formData.append('images', file);
      });
      
      if (isEditing && accommodation) {
        await updateAccommodationMutation.mutateAsync({
          id: accommodation._id || accommodation.id,
          accommodation: formData,
        });
      } else {
        await createAccommodationMutation.mutateAsync(formData);
      }
      
      onClose();
    } catch (error) {
      console.error("Error submitting form:", error);
      // Error is handled by mutation
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
            
            {/* Features Field */}
            <div className="space-y-2">
              <FormLabel>Features</FormLabel>
              <div className="flex flex-wrap gap-2">
                {features.map((feature, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1 py-1">
                    {feature}
                    <button 
                      type="button" 
                      onClick={() => removeFeature(index)}
                      className="ml-1 rounded-full h-4 w-4 flex items-center justify-center"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              
              <div className="flex gap-2">
                <Input 
                  placeholder="Add a feature" 
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={addFeature}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="mt-2">
                <p className="text-sm font-medium text-gray-500 mb-1">Suggestions:</p>
                <div className="flex flex-wrap gap-2">
                  {COMMON_FEATURES.filter(f => !features.includes(f)).slice(0, 5).map((feature, index) => (
                    <Badge 
                      key={index} 
                      variant="outline" 
                      className="cursor-pointer hover:bg-gray-100"
                      onClick={() => addSuggestedFeature(feature)}
                    >
                      {feature === "WiFi" && <Wifi className="h-3 w-3 mr-1" />}
                      {feature === "24/7 Water" && <Droplet className="h-3 w-3 mr-1" />}
                      {feature === "Furnished" && <HomeIcon className="h-3 w-3 mr-1" />}
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Image Upload Field */}
            <div className="space-y-2">
              <FormLabel>Images</FormLabel>
              
              {/* Existing Images (for editing) */}
              {keepImages && keepImages.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {keepImages.map((path, index) => (
                    <div key={index} className="relative group">
                      <img 
                        src={path} 
                        alt={`Existing ${index}`} 
                        className="h-24 w-full object-cover rounded-md border" 
                      />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(path)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1
                                  opacity-0 group-hover:opacity-100 transition"
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* New image previews */}
              {previewImages.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {previewImages.map((url, index) => (
                    <div key={index} className="relative group">
                      <img 
                        src={url} 
                        alt={`Preview ${index}`} 
                        className="h-24 w-full object-cover rounded-md border" 
                      />
                      <button
                        type="button"
                        onClick={() => removeSelectedImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1
                                  opacity-0 group-hover:opacity-100 transition"
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-4">
                <label className="flex flex-col items-center justify-center cursor-pointer w-full">
                  <ImagePlus className="h-8 w-8 text-gray-400" />
                  <span className="mt-2 text-sm text-gray-500">
                    Click to upload images
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                    disabled={selectedImages.length >= 5}
                  />
                </label>
              </div>
              <p className="text-xs text-gray-500">
                Upload up to 5 images (max 5MB each). Accepted formats: JPG, PNG, GIF
              </p>
            </div>
            
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
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditing ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  isEditing ? "Update" : "Create"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
