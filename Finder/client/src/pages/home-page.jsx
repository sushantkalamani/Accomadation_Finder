import { useState } from "react";
import { useAuth } from "@/hooks/use-auth.jsx";
import { MapView } from "@/components/map-view.jsx";
import { AccommodationForm } from "@/components/accommodation-form.jsx";
import { Navbar } from "@/components/ui/navbar.jsx";
import { useAccommodations } from "@/hooks/use-accommodations.jsx";
import { SearchResults } from "@/components/search-results.jsx";
import { Loader2 } from "lucide-react";
import { geocodeLocation } from "@/lib/utils.js";
import { Button } from "@/components/ui/button.jsx";
import { Search, Plus } from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();
  const { accommodations, isLoading, searchAccommodations } = useAccommodations();
  
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedAccommodation, setSelectedAccommodation] = useState(null);
  const [showAccommodationForm, setShowAccommodationForm] = useState(false);
  const [clickedLocation, setClickedLocation] = useState(null);
  const [searchLocation, setSearchLocation] = useState(null);
  
  const handleSearch = async (params, location) => {
    // setShowSearchResults(true); // Commented out to prevent sidebar from showing
    
    try {
      // Attempt to geocode from the search query if no location is provided
      let searchLoc = location;
      if (!searchLoc && params.query) {
        const geocoded = await geocodeLocation(params.query);
        if (geocoded) {
          searchLoc = geocoded;
        }
      }
      
      // Always update the search location if we have coordinates
      if (searchLoc) {
        setSearchLocation(searchLoc);
      }
      
      // Get and display search results
      const results = await searchAccommodations(params);
      setSearchResults(results);
      
      // Clear selected accommodation when searching
      setSelectedAccommodation(null);
    } catch (error) {
      console.error("Search error:", error);
    }
  };
  
  const handleResultClick = (accommodation) => {
    setSelectedAccommodation(accommodation);
    setSearchLocation(null); // Clear search location when selecting a specific accommodation
  };
  
  const handleMapClick = (lat, lng) => {
    setClickedLocation({ lat, lng });
    setShowAccommodationForm(true);
  };
  
  const handleMarkerClick = (accommodation) => {
    setSelectedAccommodation(accommodation);
    setSearchLocation(null); // Clear search location when clicking a marker
  };
  
  const handleAddAccommodation = () => {
    setSelectedAccommodation(null);
    setShowAccommodationForm(true);
  };
  
  const handleFormClose = () => {
    setShowAccommodationForm(false);
    setClickedLocation(null);
    setSelectedAccommodation(null);
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <Navbar 
        user={user} 
        onSearch={handleSearch} 
      />
      
      <main className="flex-1 flex flex-col md:flex-row relative">
        {/* Role-specific welcome panel - Display briefly and then auto-hide */}
        {!showSearchResults && !showAccommodationForm && !selectedAccommodation && (
          <div className="absolute top-4 left-4 z-10 bg-white p-4 rounded-lg shadow-md max-w-md">
            <div className={`py-1 px-3 text-xs font-medium rounded-full inline-block mb-2 ${
              user.role === "owner" 
                ? "bg-blue-100 text-blue-700"
                : "bg-green-100 text-green-700"
            }`}>
              {user.role === "owner" ? "PROPERTY OWNER" : "ROOM SEEKER"}
            </div>
            <h2 className="text-lg font-bold text-gray-800 mb-2">
              {user.role === "owner" 
                ? "Manage Your Properties" 
                : "Find Your Perfect Room"}
            </h2>
            <p className="text-sm text-gray-600 mb-2">
              {user.role === "owner"
                ? "You can add new properties by clicking on the map or using the + button in the bottom right corner."
                : "Browse available accommodations on the map. Click on markers to see details and contact property owners."}
            </p>
            <div className="flex space-x-2 mt-3">
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => setShowSearchResults(true)}
              >
                <Search className="h-4 w-4 mr-1" />
                Search Rooms
              </Button>
              {user.role === "owner" && (
                <Button 
                  size="sm" 
                  className="mt-2 bg-[#FF5A5F] hover:bg-[#E00B41] text-white"
                  onClick={handleAddAccommodation}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Property
                </Button>
              )}
            </div>
          </div>
        )}
        
        {showSearchResults && (
          <SearchResults 
            results={searchResults} 
            onResultClick={handleResultClick} 
            onClose={() => setShowSearchResults(false)} 
          />
        )}
        
        <MapView 
          accommodations={accommodations} 
          selectedAccommodation={selectedAccommodation}
          onMarkerClick={handleMarkerClick} 
          onMapClick={user.role === "owner" ? handleMapClick : null}
          onAddAccommodation={user.role === "owner" ? handleAddAccommodation : null}
          searchLocation={searchLocation}
          userRole={user.role}
        />
        
        {showAccommodationForm && user.role === "owner" && (
          <AccommodationForm 
            accommodation={selectedAccommodation}
            initialLocation={clickedLocation}
            onClose={handleFormClose}
          />
        )}
      </main>
    </div>
  );
}
