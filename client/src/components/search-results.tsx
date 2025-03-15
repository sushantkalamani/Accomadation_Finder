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
    <div className="md:w-1/3 lg:w-1/4 bg-white shadow-md border-r border-neutral-200 p-4 overflow-y-auto z-10 h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-neutral-900">Search Results</h2>
        <div className="flex items-center">
          <span className="text-sm text-neutral-500 mr-2">{results.length} accommodations</span>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 md:hidden" 
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {results.length === 0 ? (
        <div className="text-center py-8 text-neutral-500">
          No accommodations found matching your search criteria.
        </div>
      ) : (
        <div className="space-y-4">
          {results.map((accommodation) => (
            <div 
              key={accommodation.id}
              className="bg-white rounded-lg border border-neutral-200 p-3 cursor-pointer hover:border-[#FF5A5F] transition-colors"
              onClick={() => onResultClick(accommodation)}
            >
              <h3 className="font-medium text-neutral-900">{accommodation.name}</h3>
              <p className="text-sm text-neutral-500">{accommodation.address}</p>
              <div className="flex justify-between items-center mt-2">
                <div className="text-[#FF5A5F] font-medium">${accommodation.price.toFixed(2)} / night</div>
                <div className="text-sm text-neutral-500">{accommodation.rooms} {accommodation.rooms === 1 ? 'room' : 'rooms'}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
