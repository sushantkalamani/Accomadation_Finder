import { useEffect, useRef, useState } from "react";
import { Accommodation } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface MapViewProps {
  accommodations: Accommodation[];
  selectedAccommodation: Accommodation | null;
  onMarkerClick: (accommodation: Accommodation) => void;
  onMapClick: (lat: number, lng: number) => void;
  onAddAccommodation: () => void;
}

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

export function MapView({
  accommodations,
  selectedAccommodation,
  onMarkerClick,
  onMapClick,
  onAddAccommodation,
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  
  // Initialize map
  useEffect(() => {
    // Check if Google Maps API is already loaded
    if (window.google && window.google.maps) {
      initializeMap();
    } else {
      // Define the callback function for the Google Maps API
      window.initMap = initializeMap;
      
      // Load Google Maps API
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.GOOGLE_MAPS_API_KEY || "AIzaSyA6GpUjTTW06nxS-LUNWjkZ6sXQHGvKO4g"}&callback=initMap`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
      
      return () => {
        // Clean up the script and global callback
        document.head.removeChild(script);
        delete window.initMap;
      };
    }
  }, []);
  
  // Function to initialize the map
  const initializeMap = () => {
    if (!mapRef.current) return;
    
    const newMap = new window.google.maps.Map(mapRef.current, {
      center: { lat: 40.7128, lng: -74.006 }, // Default to New York
      zoom: 12,
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }]
        }
      ]
    });
    
    // Add click listener to the map
    newMap.addListener("click", (event: google.maps.MapMouseEvent) => {
      if (event.latLng) {
        onMapClick(event.latLng.lat(), event.latLng.lng());
      }
    });
    
    setMap(newMap);
  };
  
  // Update markers when accommodations change
  useEffect(() => {
    if (!map) return;
    
    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    const newMarkers: google.maps.Marker[] = [];
    
    // Add markers for each accommodation
    accommodations.forEach(accommodation => {
      const marker = new window.google.maps.Marker({
        position: { lat: accommodation.latitude, lng: accommodation.longitude },
        map,
        title: accommodation.name,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: selectedAccommodation?.id === accommodation.id ? '#FC642D' : '#FF5A5F',
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: '#FFFFFF',
          scale: selectedAccommodation?.id === accommodation.id ? 10 : 8,
        },
        animation: selectedAccommodation?.id === accommodation.id ? 
          window.google.maps.Animation.BOUNCE : null
      });
      
      marker.addListener("click", () => {
        onMarkerClick(accommodation);
      });
      
      newMarkers.push(marker);
    });
    
    setMarkers(newMarkers);
    
    // If there's a selected accommodation, center the map on it
    if (selectedAccommodation) {
      map.setCenter({
        lat: selectedAccommodation.latitude,
        lng: selectedAccommodation.longitude
      });
      map.setZoom(15);
    } else if (accommodations.length > 0) {
      // Otherwise, fit bounds to show all markers
      const bounds = new window.google.maps.LatLngBounds();
      accommodations.forEach(acc => {
        bounds.extend({ lat: acc.latitude, lng: acc.longitude });
      });
      map.fitBounds(bounds);
    }
  }, [accommodations, selectedAccommodation, map]);

  return (
    <div className="flex-1 relative">
      <div ref={mapRef} className="absolute inset-0 z-0" />
      
      {/* Add New Accommodation Button */}
      <div className="absolute bottom-6 right-6 z-10">
        <Button 
          onClick={onAddAccommodation}
          className="rounded-full h-14 w-14 p-0 bg-[#FF5A5F] hover:bg-[#E00B41]"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}
