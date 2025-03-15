import { useState, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { MapView } from "@/components/map-view";
import { AccommodationForm } from "@/components/accommodation-form";
import { Navbar } from "@/components/ui/navbar";
import { useAccommodations } from "@/hooks/use-accommodations";
import { SearchResults } from "@/components/search-results";
import { Accommodation, SearchAccommodationParams } from "@shared/schema";
import { Loader2 } from "lucide-react";
import { Map } from "leaflet";

export default function HomePage() {
  const { user } = useAuth();
  const { accommodations, isLoading, searchAccommodations } = useAccommodations();
  
  const [searchResults, setSearchResults] = useState<Accommodation[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedAccommodation, setSelectedAccommodation] = useState<Accommodation | null>(null);
  const [showAccommodationForm, setShowAccommodationForm] = useState(false);
  const [clickedLocation, setClickedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [searchLocation, setSearchLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  const handleSearch = async (params: SearchAccommodationParams) => {
    const results = await searchAccommodations(params);
    setSearchResults(results);
    setShowSearchResults(true);
  };
  
  const handleResultClick = (accommodation: Accommodation) => {
    setSelectedAccommodation(accommodation);
  };
  
  const handleMapClick = (lat: number, lng: number) => {
    setClickedLocation({ lat, lng });
    setShowAccommodationForm(true);
  };
  
  const handleMarkerClick = (accommodation: Accommodation) => {
    setSelectedAccommodation(accommodation);
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
