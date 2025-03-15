import { useEffect } from "react";
import { Accommodation } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Plus, Home } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, DivIcon } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Create custom marker icons using HTML/CSS for better styling control
const createCustomIcon = (isSelected: boolean) => {
  return L.divIcon({
    className: "custom-marker-icon", // This avoids inheriting leaflet's styles
    html: `
      <div class="${isSelected ? 'w-8 h-8' : 'w-6 h-6'} bg-[#FF5A5F] rounded-full flex items-center justify-center shadow-md transform ${isSelected ? 'scale-125' : 'scale-100'} transition-transform">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
      </div>
    `,
    iconSize: [isSelected ? 32 : 24, isSelected ? 32 : 24],
    iconAnchor: [isSelected ? 16 : 12, isSelected ? 32 : 24],
    popupAnchor: [0, -20],
  });
};

// Default and selected icons
const DefaultIcon = createCustomIcon(false);
const SelectedIcon = createCustomIcon(true);

interface MapViewProps {
  accommodations: Accommodation[];
  selectedAccommodation: Accommodation | null;
  onMarkerClick: (accommodation: Accommodation) => void;
  onMapClick: (lat: number, lng: number) => void;
  onAddAccommodation: () => void;
}

// MapEvents component to handle map clicks
function MapEvents({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// CenterMap component to adjust view when selected accommodation changes
function CenterMap({ accommodation }: { accommodation: Accommodation | null }) {
  const map = useMap();
  
  useEffect(() => {
    if (accommodation) {
      map.setView([accommodation.latitude, accommodation.longitude], 15);
    }
  }, [accommodation, map]);
  
  return null;
}

// FitBounds component to adjust view to show all markers
function FitBounds({ accommodations }: { accommodations: Accommodation[] }) {
  const map = useMap();
  
  useEffect(() => {
    if (accommodations.length > 0) {
      const bounds = L.latLngBounds(accommodations.map(acc => [acc.latitude, acc.longitude]));
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [accommodations, map]);
  
  return null;
}

export function MapView({
  accommodations,
  selectedAccommodation,
  onMarkerClick,
  onMapClick,
  onAddAccommodation,
}: MapViewProps) {
  // Default center position (New York)
  const defaultPosition: [number, number] = [40.7128, -74.006];
  
  return (
    <div className="flex-1 relative">
      <MapContainer
        center={defaultPosition}
        zoom={12}
        style={{ height: "100%", width: "100%" }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Map event handlers */}
        <MapEvents onClick={onMapClick} />
        {selectedAccommodation && <CenterMap accommodation={selectedAccommodation} />}
        {accommodations.length > 0 && !selectedAccommodation && <FitBounds accommodations={accommodations} />}
        
        {/* Render accommodation markers */}
        {accommodations.map((accommodation) => (
          <Marker
            key={accommodation.id}
            position={[accommodation.latitude, accommodation.longitude]}
            icon={selectedAccommodation?.id === accommodation.id ? SelectedIcon : DefaultIcon}
            eventHandlers={{
              click: () => onMarkerClick(accommodation),
            }}
          >
            <Popup>
              <div className="p-1">
                <h3 className="font-medium text-sm">{accommodation.name}</h3>
                <p className="text-xs text-neutral-500">{accommodation.address}</p>
                <p className="text-xs text-[#FF5A5F] font-medium mt-1">
                  ${accommodation.price.toFixed(2)} / night
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Add New Accommodation Button */}
      <div className="absolute bottom-6 right-6 z-[1000]">
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
