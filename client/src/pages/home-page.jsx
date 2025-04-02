import { useState } from "react";
import { useAuth } from "@/hooks/use-auth.jsx";
import { MapView } from "@/components/map-view.jsx";
import { AccommodationForm } from "@/components/accommodation-form.jsx";
import { Navbar } from "@/components/ui/navbar.jsx";
import { useAccommodations } from "@/hooks/use-accommodations.jsx";
import { SearchResults } from "@/components/search-results.jsx";
import { Loader2 } from "lucide-react";
import { geocodeLocation } from "@/lib/utils.js";

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
    setShowSearchResults(true); // Show results container immediately
    
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
          onMapClick={handleMapClick}
          onAddAccommodation={handleAddAccommodation}
          searchLocation={searchLocation}
        />
        
        {showAccommodationForm && (
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
