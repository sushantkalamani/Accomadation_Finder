import { useEffect } from "react";
import { Accommodation } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Plus, Home } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, ZoomControl } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Create custom marker icons for accommodations
const markerHtmlStyles = (isSelected: boolean) => `
  background-color: #FF5A5F;
  width: ${isSelected ? '30px' : '24px'};
  height: ${isSelected ? '30px' : '24px'};
  display: block;
  left: 0;
  top: 0;
  position: relative;
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: 0 0 5px rgba(0,0,0,0.3);
  transform: ${isSelected ? 'scale(1.2)' : 'scale(1)'};
  transition: transform 0.2s;
`;

const createCustomIcon = (isSelected: boolean) => {
  return L.divIcon({
    className: "my-custom-pin",
    iconAnchor: [12, 12],
    popupAnchor: [0, -24],
    html: `<span style="${markerHtmlStyles(isSelected)}" />`
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
  // Default center position (Solapur, Maharashtra, India)
  const defaultPosition: [number, number] = [17.6599, 75.9064];
  
  return (
    <div className="flex-1 relative">
      <MapContainer
        center={defaultPosition}
        zoom={12}
        style={{ height: "100%", width: "100%" }}
        className="z-0 rounded-lg shadow-md"
        zoomControl={false} // We'll add our custom zoom control position
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ZoomControl position="bottomleft" />
        
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
                  ₹{accommodation.price.toLocaleString('en-IN')} / month
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
