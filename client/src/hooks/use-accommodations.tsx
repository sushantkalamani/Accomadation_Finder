import { useMutation, useQuery } from "@tanstack/react-query";
import { InsertAccommodation, Accommodation, SearchAccommodationParams } from "@shared/schema";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function useAccommodations() {
  const { toast } = useToast();

  const { data: accommodations = [], isLoading, error } = useQuery<Accommodation[]>({
    queryKey: ["/api/accommodations"],
  });

  const searchAccommodations = (params: SearchAccommodationParams) => {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params.query) queryParams.set("query", params.query);
    if (params.priceMin !== undefined) queryParams.set("priceMin", params.priceMin.toString());
    if (params.priceMax !== undefined) queryParams.set("priceMax", params.priceMax.toString());
    if (params.rooms !== undefined) queryParams.set("rooms", params.rooms.toString());

    return queryClient.fetchQuery<Accommodation[]>({
      queryKey: [`/api/accommodations/search?${queryParams.toString()}`],
    });
  };

  const createAccommodationMutation = useMutation({
    mutationFn: async (accommodation: InsertAccommodation) => {
      const res = await apiRequest("POST", "/api/accommodations", accommodation);
      return await res.json() as Accommodation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accommodations"] });
      toast({
        title: "Success",
        description: "Accommodation has been created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create accommodation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateAccommodationMutation = useMutation({
    mutationFn: async ({ id, accommodation }: { id: number, accommodation: Partial<InsertAccommodation> }) => {
      const res = await apiRequest("PUT", `/api/accommodations/${id}`, accommodation);
      return await res.json() as Accommodation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accommodations"] });
      toast({
        title: "Success",
        description: "Accommodation has been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update accommodation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteAccommodationMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/accommodations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accommodations"] });
      toast({
        title: "Success",
        description: "Accommodation has been deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete accommodation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    accommodations,
    isLoading,
    error,
    searchAccommodations,
    createAccommodationMutation,
    updateAccommodationMutation,
    deleteAccommodationMutation,
  };
}
