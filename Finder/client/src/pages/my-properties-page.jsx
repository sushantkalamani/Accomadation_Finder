import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth.jsx";
import { useAccommodations } from "@/hooks/use-accommodations.jsx";
import { Navbar } from "@/components/ui/navbar.jsx";
import { AccommodationForm } from "@/components/accommodation-form.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Loader2, Edit, Trash2, Plus, Home as HomeIcon, MapPin, Phone } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog.jsx";
import { useToast } from "@/hooks/use-toast.js";
import { useLocation } from "wouter";

export default function MyPropertiesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  const { 
    accommodations, 
    isLoading,
    error,
    deleteAccommodationMutation
  } = useAccommodations();
  
  // Component state
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAccommodation, setEditingAccommodation] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [accommodationToDelete, setAccommodationToDelete] = useState(null);
  
  // Make sure only owners can access this page
  useEffect(() => {
    if (user && user.role !== "owner") {
      navigate("/");
      toast({
        title: "Access Denied",
        description: "Only property owners can access this page.",
        variant: "destructive"
      });
    }
  }, [user, navigate, toast]);
  
  // Filter for only user's properties
  const userAccommodations = accommodations?.filter(acc => 
    acc.userId === user?._id || (typeof acc.userId === 'object' && acc.userId?._id === user?._id)
  ) || [];
  
  // Handle edit accommodation
  const handleEdit = (accommodation) => {
    setEditingAccommodation(accommodation);
    setShowAddForm(true);
  };
  
  // Handle delete accommodation
  const handleDelete = (accommodation) => {
    setAccommodationToDelete(accommodation);
    setShowDeleteConfirm(true);
  };
  
  // Confirm deletion
  const confirmDelete = async () => {
    if (!accommodationToDelete) return;
    
    try {
      await deleteAccommodationMutation.mutateAsync(accommodationToDelete._id || accommodationToDelete.id);
      setShowDeleteConfirm(false);
      setAccommodationToDelete(null);
      toast({
        title: "Success",
        description: "Property deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete property. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Close the add/edit form
  const handleFormClose = () => {
    setShowAddForm(false);
    setEditingAccommodation(null);
  };
  
  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar user={user} />
      
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Properties</h1>
            <p className="text-gray-600 font-medium"><span className="text-blue-700">PROPERTY OWNER</span> | Manage Your Properties</p>
          </div>
          
          <Button 
            className="bg-[#FF5A5F] hover:bg-[#E00B41] text-white"
            onClick={() => setShowAddForm(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Property
          </Button>
        </div>
        
        {/* Property Owner Instructions Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h2 className="font-bold text-blue-800 mb-1">Property Owner Dashboard</h2>
          <p className="text-blue-700 mb-2">
            You can add new properties by clicking on the "Add New Property" button above. 
            All your listed properties will appear below.
          </p>
          <p className="text-blue-700 text-sm">
            <span className="font-semibold">Note:</span> Make sure to add clear photos and accurate details to attract more tenants.
          </p>
        </div>
        
        {/* Property listing */}
        {userAccommodations.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center shadow-sm border">
            <HomeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-medium text-gray-900 mb-2">No Properties Listed</h2>
            <p className="text-gray-600 mb-4">You haven't listed any properties yet. Add your first property to get started.</p>
            <Button 
              className="bg-[#FF5A5F] hover:bg-[#E00B41] text-white"
              onClick={() => setShowAddForm(true)}
            >
              Add Your First Property
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userAccommodations.map((accommodation) => (
              <div 
                key={accommodation._id || accommodation.id}
                className="bg-white rounded-lg overflow-hidden shadow-sm border hover:shadow-md transition-shadow"
              >
                {/* Property thumbnail */}
                <div className="h-48 bg-gray-200 relative">
                  {accommodation.images && accommodation.images.length > 0 ? (
                    <img 
                      src={accommodation.images[0]}
                      alt={accommodation.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <HomeIcon className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                  
                  {/* Price tag */}
                  <div className="absolute top-4 right-4 bg-[#FF5A5F] text-white px-3 py-1 rounded-full text-sm font-medium">
                    ₹{accommodation.price.toLocaleString('en-IN')}/mo
                  </div>
                </div>
                
                {/* Property details */}
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1 text-gray-900">{accommodation.name}</h3>
                  <div className="flex items-start mb-2">
                    <MapPin className="h-4 w-4 text-gray-500 mt-0.5 mr-1 flex-shrink-0" />
                    <p className="text-sm text-gray-600 line-clamp-2">{accommodation.address}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-gray-50 rounded p-2 text-center">
                      <p className="text-xs text-gray-500">Rooms</p>
                      <p className="font-medium">{accommodation.rooms}</p>
                    </div>
                    <div className="bg-gray-50 rounded p-2 text-center">
                      <p className="text-xs text-gray-500">Contact</p>
                      <p className="font-medium text-sm">{accommodation.phone}</p>
                    </div>
                  </div>
                  
                  {/* Features tags */}
                  {accommodation.features && accommodation.features.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {accommodation.features.slice(0, 3).map((feature, i) => (
                        <span key={i} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                          {feature}
                        </span>
                      ))}
                      {accommodation.features.length > 3 && (
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                          +{accommodation.features.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                  
                  {/* Action buttons */}
                  <div className="flex space-x-2 mt-3">
                    <Button 
                      variant="outline" 
                      className="flex-1 text-sm h-9"
                      onClick={() => handleEdit(accommodation)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1 text-sm h-9 border-red-200 text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(accommodation)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Add/Edit Property Form */}
      {showAddForm && (
        <AccommodationForm
          accommodation={editingAccommodation}
          onClose={handleFormClose}
        />
      )}
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{accommodationToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex space-x-2 justify-end">
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteConfirm(false)}
              disabled={deleteAccommodationMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteAccommodationMutation.isPending}
            >
              {deleteAccommodationMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Delete Property
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 