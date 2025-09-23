import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function PetFriendlyTravel() {
  const [searchLocation, setSearchLocation] = useState("");
  const [activeFilter, setActiveFilter] = useState("Hotels");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: petFriendlyPlaces, isLoading } = useQuery({
    queryKey: ["/api/pet-friendly-places"],
  });

  const { data: userPets } = useQuery({
    queryKey: ["/api/user/pets"],
  });

  const searchMutation = useMutation({
    mutationFn: async (data: { location: string; petRequirements: string[] }) => {
      return await apiRequest("POST", "/api/pet-friendly-places/search", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pet-friendly-places"] });
      toast({
        title: "Search completed",
        description: "Found new pet-friendly places in your area!",
      });
    },
    onError: (error) => {
      toast({
        title: "Search failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSearch = () => {
    if (!searchLocation.trim()) {
      toast({
        title: "Location required",
        description: "Please enter a location to search.",
        variant: "destructive",
      });
      return;
    }

    const petRequirements = userPets?.map((pet: any) => `${pet.species} friendly`) || [];
    searchMutation.mutate({ location: searchLocation, petRequirements });
  };

  const filters = ["Hotels", "Restaurants", "Parks", "Veterinarians"];

  const filteredPlaces = petFriendlyPlaces?.filter((place: any) => {
    if (activeFilter === "Hotels") return place.type === "hotel";
    if (activeFilter === "Restaurants") return place.type === "restaurant";
    if (activeFilter === "Parks") return place.type === "park";
    if (activeFilter === "Veterinarians") return place.type === "veterinary";
    return true;
  }) || [];

  const getPlaceholderImage = (type: string) => {
    switch (type) {
      case 'hotel':
        return 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=200';
      case 'restaurant':
        return 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=200';
      case 'park':
        return 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=200';
      default:
        return 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=200';
    }
  };

  return (
    <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 bg-card rounded-lg border border-border shadow-sm">
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-semibold mb-2">Nearby Pet-Friendly Places</h3>
          <p className="text-sm text-muted-foreground">
            Discover accommodations and services that welcome your pets
          </p>
        </div>
        <div className="p-6">
          {/* Search Bar */}
          <div className="mb-6">
            <div className="flex space-x-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Enter city or location..."
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  data-testid="input-search-location"
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={searchMutation.isPending}
                className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                data-testid="button-search-places"
              >
                {searchMutation.isPending ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Searching...
                  </>
                ) : (
                  <>
                    <i className="fas fa-search mr-2"></i>
                    Search
                  </>
                )}
              </button>
            </div>
            <div className="flex space-x-2 mt-3">
              {filters.map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    activeFilter === filter
                      ? "bg-primary text-primary-foreground"
                      : "border border-border hover:bg-accent"
                  }`}
                  data-testid={`filter-${filter.toLowerCase()}`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Place Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isLoading ? (
              [1, 2, 3, 4].map((i) => (
                <div key={i} className="border border-border rounded-lg overflow-hidden animate-pulse">
                  <div className="w-full h-32 bg-muted"></div>
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-muted rounded"></div>
                    <div className="h-3 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded"></div>
                    <div className="flex justify-between items-center">
                      <div className="h-4 bg-muted rounded w-20"></div>
                      <div className="h-6 bg-muted rounded w-16"></div>
                    </div>
                  </div>
                </div>
              ))
            ) : filteredPlaces.length > 0 ? (
              filteredPlaces.map((place: any) => (
                <div
                  key={place.id}
                  className="border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                  data-testid={`place-card-${place.id}`}
                >
                  <img
                    src={place.imageUrl || getPlaceholderImage(place.type)}
                    alt={`${place.name} exterior view`}
                    className="w-full h-32 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = getPlaceholderImage(place.type);
                    }}
                  />
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold" data-testid={`text-place-name-${place.id}`}>
                        {place.name}
                      </h4>
                      {place.rating && (
                        <div className="flex items-center text-amber-500">
                          <i className="fas fa-star text-sm"></i>
                          <span className="text-sm ml-1" data-testid={`text-rating-${place.id}`}>
                            {place.rating}
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2" data-testid={`text-location-${place.id}`}>
                      {place.location}
                    </p>
                    <p className="text-sm mb-3" data-testid={`text-description-${place.id}`}>
                      {place.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold" data-testid={`text-price-${place.id}`}>
                        {place.priceRange || "Price on request"}
                      </span>
                      <button 
                        className="bg-primary text-primary-foreground px-3 py-1 rounded text-sm hover:bg-primary/90 transition-colors"
                        data-testid={`button-details-${place.id}`}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-2 text-center py-8 text-muted-foreground">
                <div className="bg-muted rounded-full w-16 h-16 mx-auto flex items-center justify-center mb-4">
                  <i className="fas fa-map-marker-alt text-2xl"></i>
                </div>
                <p className="text-lg font-medium mb-2">No places found</p>
                <p className="text-sm">
                  Try searching for a different location or filter type
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions & Travel Profile */}
      <div className="space-y-6">
        <div className="bg-card rounded-lg border border-border shadow-sm">
          <div className="p-6 border-b border-border">
            <h3 className="font-semibold mb-2">Travel Profile</h3>
            <p className="text-sm text-muted-foreground">
              Personalize your pet travel preferences
            </p>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Pet Information</label>
              <div className="space-y-2">
                {userPets && userPets.length > 0 ? (
                  userPets.map((pet: any) => (
                    <div
                      key={pet.id}
                      className="flex items-center space-x-3 p-3 bg-muted rounded-lg"
                      data-testid={`pet-info-${pet.id}`}
                    >
                      <div className="bg-primary text-primary-foreground rounded-full p-2">
                        <i className={`text-sm ${pet.species === 'dog' ? 'fas fa-dog' : pet.species === 'cat' ? 'fas fa-cat' : 'fas fa-paw'}`}></i>
                      </div>
                      <div>
                        <p className="text-sm font-medium" data-testid={`text-pet-name-${pet.id}`}>
                          {pet.name}
                        </p>
                        <p className="text-xs text-muted-foreground" data-testid={`text-pet-details-${pet.id}`}>
                          {pet.breed ? `${pet.breed}, ` : ''}{pet.age ? `${pet.age} years` : ''}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <p className="text-sm">No pets added yet</p>
                  </div>
                )}
                <button 
                  className="w-full text-sm text-primary border border-primary rounded-lg py-2 hover:bg-primary/10 transition-colors"
                  data-testid="button-add-pet"
                >
                  <i className="fas fa-plus mr-2"></i>Add Another Pet
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Preferred Amenities</label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input type="checkbox" defaultChecked className="mr-2" data-testid="checkbox-pet-sitting" />
                  <span className="text-sm">Pet sitting service</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" defaultChecked className="mr-2" data-testid="checkbox-dog-park" />
                  <span className="text-sm">Dog park nearby</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" data-testid="checkbox-pet-grooming" />
                  <span className="text-sm">Pet grooming</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border shadow-sm">
          <div className="p-6 border-b border-border">
            <h3 className="font-semibold mb-2">Quick Actions</h3>
          </div>
          <div className="p-6 space-y-3">
            <button className="w-full flex items-center space-x-3 p-3 text-left border border-border rounded-lg hover:bg-accent transition-colors" data-testid="button-plan-trip">
              <div className="bg-blue-100 text-blue-600 rounded p-2">
                <i className="fas fa-calendar text-sm"></i>
              </div>
              <div>
                <p className="text-sm font-medium">Plan Trip</p>
                <p className="text-xs text-muted-foreground">Create itinerary with pet stops</p>
              </div>
            </button>

            <button className="w-full flex items-center space-x-3 p-3 text-left border border-border rounded-lg hover:bg-accent transition-colors" data-testid="button-saved-places">
              <div className="bg-green-100 text-green-600 rounded p-2">
                <i className="fas fa-bookmark text-sm"></i>
              </div>
              <div>
                <p className="text-sm font-medium">Saved Places</p>
                <p className="text-xs text-muted-foreground">View your favorites</p>
              </div>
            </button>

            <button className="w-full flex items-center space-x-3 p-3 text-left border border-border rounded-lg hover:bg-accent transition-colors" data-testid="button-trip-history">
              <div className="bg-purple-100 text-purple-600 rounded p-2">
                <i className="fas fa-route text-sm"></i>
              </div>
              <div>
                <p className="text-sm font-medium">Trip History</p>
                <p className="text-xs text-muted-foreground">Review past travels</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
