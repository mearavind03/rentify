'use client';
import { useLoadScript, GoogleMap, MarkerF } from '@react-google-maps/api';
import { useState, useEffect, useMemo } from 'react';

const GOOGLE_MAPS_API_KEY = "AIzaSyDaDQrKclM1bD8qMsYUpGws-MWcXOezroY";

// Cache for storing geocoded coordinates
const geocodeCache = new Map();

const PropertyMap = ({ property }) => {
  const [coordinates, setCoordinates] = useState({ lat: 0, lng: 0 });
  const [isLoading, setIsLoading] = useState(true);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  });

  useEffect(() => {
    const geocodeAddress = async () => {
      if (!property.location) return;
      
      const address = `${property.location.street}, ${property.location.city}, ${property.location.state} ${property.location.zipcode}`;
      
      // Check if we already have the coordinates cached
      if (geocodeCache.has(address)) {
        setCoordinates(geocodeCache.get(address));
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`
        );
        const data = await response.json();
        
        if (data.results && data.results[0]) {
          const coords = {
            lat: data.results[0].geometry.location.lat,
            lng: data.results[0].geometry.location.lng
          };
          // Cache the coordinates
          geocodeCache.set(address, coords);
          setCoordinates(coords);
        }
      } catch (error) {
        console.error('Geocoding error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    geocodeAddress();
  }, [property.location?.street, property.location?.city, property.location?.state, property.location?.zipcode]);

  const mapOptions = useMemo(() => ({
    zoom: 15,
    center: coordinates,
    mapContainerClassName: "w-full h-full"
  }), [coordinates]);

  if (!isLoaded || isLoading) return <div>Loading...</div>;

  return (
    <div className="mt-4">
      <div className="font-bold text-xl mb-2">Property Location</div>
      <div className="h-[300px] w-full rounded-lg overflow-hidden">
        <GoogleMap
          {...mapOptions}
          mapContainerClassName="w-full h-full"
        >
          <MarkerF position={coordinates} />
        </GoogleMap>
      </div>
    </div>
  );
};

export default PropertyMap;