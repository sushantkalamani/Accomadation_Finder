import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Home, Info, X, Phone } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, ZoomControl } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Create custom marker icons for accommodations
const markerHtmlStyles = (isSelected) => `
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

const createCustomIcon = (isSelected) => {
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

// MapEvents component to handle map clicks
function MapEvents({ onClick }) {
  useMapEvents({
    click: (e) => {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// CenterMap component to adjust view when selected accommodation changes
function CenterMap({ accommodation }) {
  const map = useMap();
  
  useEffect(() => {
    if (accommodation) {
      map.setView([accommodation.latitude, accommodation.longitude], 15);
    }
  }, [accommodation, map]);
  
  return null;
}

// SearchLocationMap component to adjust view to search location
function SearchLocationMap({ location }) {
  const map = useMap();
  
  useEffect(() => {
    if (location) {
      map.setView([location.lat, location.lng], 15);
    }
  }, [location, map]);
  
  return null;
}

// FitBounds component to adjust view to show all markers
function FitBounds({ accommodations }) {
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
  searchLocation,
}) {
  // State for details dialog
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [detailsAccommodation, setDetailsAccommodation] = useState(null);
  
  // Default center position (Solapur, Maharashtra, India)
  const defaultPosition = [17.6599, 75.9064];
  
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
        {!selectedAccommodation && searchLocation && <SearchLocationMap location={searchLocation} />}
        {accommodations.length > 0 && !selectedAccommodation && !searchLocation && <FitBounds accommodations={accommodations} />}
        
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
                <Button
                  variant="outline" 
                  size="sm"
                  className="w-full mt-2 text-xs h-7 flex items-center justify-center gap-1 border-[#FF5A5F] text-[#FF5A5F] hover:bg-[#FFF5F5]"
                  onClick={() => {
                    setDetailsAccommodation(accommodation);
                    setIsDetailsOpen(true);
                  }}
                >
                  <Info className="h-3 w-3" />
                  More Info
                </Button>
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
      
      {/* Accommodation Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-neutral-900">
              {detailsAccommodation?.name}
            </DialogTitle>
            <DialogDescription>
              Complete details about this accommodation
            </DialogDescription>
          </DialogHeader>
          
          {detailsAccommodation && (
            <div className="space-y-4 py-2">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-neutral-500 mb-1">Location</h3>
                <p className="text-neutral-900">{detailsAccommodation.address}</p>
                <div className="mt-2 text-xs text-neutral-500">
                  Coordinates: {detailsAccommodation.latitude.toFixed(6)}, {detailsAccommodation.longitude.toFixed(6)}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-neutral-500 mb-1">Price</h3>
                  <p className="text-lg font-semibold text-[#FF5A5F]">₹{detailsAccommodation.price.toLocaleString('en-IN')}</p>
                  <p className="text-xs text-neutral-500">per month</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-neutral-500 mb-1">Rooms</h3>
                  <p className="text-lg font-semibold text-neutral-900">{detailsAccommodation.rooms}</p>
                  <p className="text-xs text-neutral-500">{detailsAccommodation.rooms === 1 ? 'room' : 'rooms'}</p>
                </div>
              </div>
              
              {detailsAccommodation.description && (
                <div>
                  <h3 className="text-sm font-medium text-neutral-500 mb-1">Description</h3>
                  <p className="text-neutral-900 text-sm">{detailsAccommodation.description}</p>
                </div>
              )}
              
              <div>
                <h3 className="text-sm font-medium text-neutral-500 mb-1">Contact</h3>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-sm flex items-center justify-center gap-2"
                  onClick={() => window.open(`tel:${detailsAccommodation.phone}`)}
                >
                  <Phone className="h-4 w-4" />
                  {detailsAccommodation.phone}
                </Button>
              </div>
            </div>
          )}
          
          <div className="flex justify-end">
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
