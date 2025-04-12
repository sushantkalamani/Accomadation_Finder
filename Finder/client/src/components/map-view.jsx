import { useEffect, useState, useRef } from "react";
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
  const mapInstance = useMap();
  
  useMapEvents({
    click: (e) => {
      if (onClick) onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// CenterMap component to adjust view when selected accommodation changes
function CenterMap({ accommodation }) {
  const mapInstance = useMap();
  
  useEffect(() => {
    if (accommodation && mapInstance && mapInstance._loaded) {
      try {
        mapInstance.setView([accommodation.latitude, accommodation.longitude], 15);
      } catch (error) {
        console.error("Error centering map:", error);
      }
    }
  }, [accommodation, mapInstance]);
  
  return null;
}

// SearchLocationMap component to adjust view to search location
function SearchLocationMap({ location }) {
  const mapInstance = useMap();
  
  useEffect(() => {
    if (location && mapInstance && mapInstance._loaded) {
      try {
        mapInstance.setView([location.lat, location.lng], 15);
      } catch (error) {
        console.error("Error centering map on search location:", error);
      }
    }
  }, [location, mapInstance]);
  
  return null;
}

// FitBounds component to adjust view to show all markers
function FitBounds({ accommodations }) {
  const mapInstance = useMap();
  
  useEffect(() => {
    if (accommodations.length > 0 && mapInstance && mapInstance._loaded) {
      try {
        const validCoordinates = accommodations
          .filter(acc => typeof acc.latitude === 'number' && !isNaN(acc.latitude) &&
                          typeof acc.longitude === 'number' && !isNaN(acc.longitude))
          .map(acc => [acc.latitude, acc.longitude]);
        
        if (validCoordinates.length > 0) {
          const bounds = L.latLngBounds(validCoordinates);
          if (bounds.isValid()) {
            mapInstance.fitBounds(bounds, { padding: [50, 50] });
          }
        }
      } catch (error) {
        console.error("Error fitting bounds:", error);
      }
    }
  }, [accommodations, mapInstance]);
  
  return null;
}

export function MapView({
  accommodations,
  selectedAccommodation,
  onMarkerClick,
  onMapClick,
  onAddAccommodation,
  searchLocation,
  userRole
}) {
  // State for details dialog
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [detailsAccommodation, setDetailsAccommodation] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef(null);
  
  // Default center position (Solapur, Maharashtra, India)
  const defaultPosition = [17.6599, 75.9064];
  
  // Process accommodations to ensure they have valid coordinates and id
  const validAccommodations = (accommodations || []).filter(acc => 
    acc && typeof acc.latitude === 'number' && !isNaN(acc.latitude) && 
    typeof acc.longitude === 'number' && !isNaN(acc.longitude)
  ).map(acc => ({
    ...acc,
    id: acc.id || acc._id // Use id if available, fall back to _id
  }));
  
  return (
    <div className="flex-1 relative">
      <MapContainer
        center={defaultPosition}
        zoom={12}
        style={{ height: "100%", width: "100%" }}
        className="z-0 rounded-lg shadow-md"
        zoomControl={false} // We'll add our custom zoom control position
        whenReady={() => setMapReady(true)}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ZoomControl position="bottomleft" />
        
        {/* Map event handlers - Only add them when map is ready */}
        {mapReady && onMapClick && <MapEvents onClick={onMapClick} />}
        {mapReady && selectedAccommodation && selectedAccommodation.latitude && selectedAccommodation.longitude && 
          <CenterMap accommodation={selectedAccommodation} />
        }
        {mapReady && !selectedAccommodation && searchLocation && searchLocation.lat && searchLocation.lng && 
          <SearchLocationMap location={searchLocation} />
        }
        {mapReady && validAccommodations.length > 0 && !selectedAccommodation && !searchLocation && 
          <FitBounds accommodations={validAccommodations} />
        }
        
        {/* Render accommodation markers */}
        {validAccommodations.map((accommodation) => (
          <Marker
            key={accommodation.id}
            position={[accommodation.latitude, accommodation.longitude]}
            icon={selectedAccommodation?.id === accommodation.id || selectedAccommodation?._id === accommodation.id 
              ? SelectedIcon : DefaultIcon}
            eventHandlers={{
              click: () => onMarkerClick && onMarkerClick(accommodation),
            }}
          >
            <Popup>
              <div className="p-1">
                {accommodation.images && accommodation.images.length > 0 && (
                  <div className="mb-2">
                    <img 
                      src={accommodation.images[0]} 
                      alt={accommodation.name} 
                      className="w-full h-24 object-cover rounded-sm"
                      onError={(e) => {
                        console.log("Image load error:", accommodation.images[0]);
                        e.target.src = "https://placehold.co/600x400?text=No+Image";
                        e.target.onerror = null; // Prevent infinite loops
                      }}
                    />
                  </div>
                )}
                <h3 className="font-medium text-sm">{accommodation.name}</h3>
                <p className="text-xs text-neutral-500">{accommodation.address}</p>
                <p className="text-xs text-[#FF5A5F] font-medium mt-1">
                  ₹{accommodation.price.toLocaleString('en-IN')} / month
                </p>
                
                {accommodation.features && accommodation.features.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {accommodation.features.slice(0, 3).map((feature, index) => (
                      <span key={index} className="text-[10px] bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded-full">
                        {feature}
                      </span>
                    ))}
                  </div>
                )}
                
                <Button 
                  size="sm" 
                  className="w-full mt-2 text-xs bg-[#FF5A5F] hover:bg-[#E00B41] text-white"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent marker click from firing
                    setDetailsAccommodation(accommodation);
                    setIsDetailsOpen(true);
                  }}
                >
                  More Info
                </Button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Add New Accommodation Button - Only show for owners */}
      {onAddAccommodation && userRole === "owner" && (
        <div className="absolute bottom-6 right-6 z-[1000]">
          <Button 
            onClick={onAddAccommodation}
            className="rounded-full h-14 w-14 p-0 bg-[#FF5A5F] hover:bg-[#E00B41]"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>
      )}
      
      {/* Map UI Overlay for Room Seekers */}
      {userRole === "tenant" && (
        <div className="absolute bottom-6 right-6 bg-white p-3 rounded-lg shadow-md z-[1000]">
          <p className="text-xs text-gray-500 mb-1">{validAccommodations.length} accommodations found</p>
          <div className="text-sm font-medium text-gray-800">Looking for a room?</div>
          <div className="text-xs text-gray-600 mt-1">Click on markers to see details and contact info</div>
        </div>
      )}
      
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
              {/* Image Gallery */}
              {detailsAccommodation.images && detailsAccommodation.images.length > 0 ? (
                <div className="relative overflow-hidden rounded-lg">
                  <div className="grid grid-cols-1 gap-2">
                    <img 
                      src={detailsAccommodation.images[0]} 
                      alt={detailsAccommodation.name} 
                      className="w-full h-48 object-cover rounded-lg"
                      onError={(e) => {
                        console.log("Detail image load error:", detailsAccommodation.images[0]);
                        e.target.src = "https://placehold.co/600x400?text=No+Image";
                        e.target.onerror = null;
                      }}
                    />
                    
                    {detailsAccommodation.images.length > 1 && (
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        {detailsAccommodation.images.slice(1, 4).map((img, i) => (
                          <img 
                            key={i} 
                            src={img} 
                            alt={`${detailsAccommodation.name} ${i+1}`}
                            className="w-full h-20 object-cover rounded-lg"
                            onError={(e) => {
                              e.target.src = "https://placehold.co/600x400?text=No+Image";
                              e.target.onerror = null;
                            }}
                          />
                        ))}
                        {detailsAccommodation.images.length > 4 && (
                          <div className="relative">
                            <img 
                              src={detailsAccommodation.images[4]} 
                              alt={`${detailsAccommodation.name} 5`}
                              className="w-full h-20 object-cover rounded-lg brightness-50"
                              onError={(e) => {
                                e.target.src = "https://placehold.co/600x400?text=No+Image";
                                e.target.onerror = null;
                              }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center text-white font-medium">
                              +{detailsAccommodation.images.length - 4}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-gray-100 h-48 flex items-center justify-center rounded-lg">
                  <Home className="h-12 w-12 text-gray-400" />
                  <p className="text-gray-500 text-sm mt-2">No images available</p>
                </div>
              )}
              
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
              
              {/* Features */}
              {detailsAccommodation.features && detailsAccommodation.features.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-neutral-500 mb-2">Features</h3>
                  <div className="flex flex-wrap gap-2">
                    {detailsAccommodation.features.map((feature, index) => (
                      <span 
                        key={index} 
                        className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
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
