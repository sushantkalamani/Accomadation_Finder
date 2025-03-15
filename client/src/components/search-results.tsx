import { Accommodation } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface SearchResultsProps {
  results: Accommodation[];
  onResultClick: (accommodation: Accommodation) => void;
  onClose: () => void;
}

export function SearchResults({ results, onResultClick, onClose }: SearchResultsProps) {
  return (
    <div className="absolute md:relative top-0 left-0 right-0 md:w-1/3 lg:w-1/4 bg-white shadow-md border-r border-neutral-200 p-4 overflow-y-auto z-10 h-[85vh] md:h-full max-h-screen">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-neutral-900">Search Results</h2>
        <div className="flex items-center">
          <span className="text-sm text-neutral-500 mr-2">{results.length} accommodations</span>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 hover:bg-gray-100" 
            onClick={onClose}
            aria-label="Close search results"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Clear Search Button */}
      <div className="mb-4 flex">
        <Button 
          variant="outline" 
          size="sm"
          className="text-xs h-7 border-neutral-300 text-neutral-700 w-full"
          onClick={onClose}
        >
          <X className="h-3 w-3 mr-1" />
          Clear Search
        </Button>
      </div>
      
      {results.length === 0 ? (
        <div className="text-center py-8 text-neutral-500 pb-16 md:pb-0">
          <div className="mb-2 text-3xl">🏠</div>
          <p className="font-medium">No accommodations found</p>
          <p className="text-sm mt-2">Try adjusting your filters or searching a different location.</p>
        </div>
      ) : (
        <div className="space-y-4 pb-20 md:pb-4">
          {results.map((accommodation) => (
            <div 
              key={accommodation.id}
              className="bg-white rounded-lg border border-neutral-200 p-4 cursor-pointer hover:border-[#FF5A5F] transition-colors hover:shadow-md"
              onClick={() => onResultClick(accommodation)}
            >
              <h3 className="font-medium text-neutral-900">{accommodation.name}</h3>
              <p className="text-sm text-neutral-500 mt-1">{accommodation.address}</p>
              <div className="flex justify-between items-center mt-3">
                <div className="text-[#FF5A5F] font-medium">₹{accommodation.price.toLocaleString('en-IN')} / month</div>
                <div className="text-sm text-neutral-500">{accommodation.rooms} {accommodation.rooms === 1 ? 'room' : 'rooms'}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Mobile View Button - Fixed at bottom */}
      <div className="md:hidden fixed bottom-4 left-0 right-0 flex justify-center">
        <Button 
          onClick={onClose}
          className="bg-[#FF5A5F] hover:bg-[#E00B41] px-6 py-2 rounded-full text-white shadow-lg"
        >
          View Map
        </Button>
      </div>
    </div>
  );
}
