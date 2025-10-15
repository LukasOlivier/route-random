"use client";

import { useState, useEffect, useRef } from "react";
import { MapPin, Search } from "lucide-react";
import { searchLocations, LocationResult } from "../services/locationService";

interface LocationSearchProps {
  onLocationSelect: (location: {
    lat: number;
    lon: number;
    address: string;
  }) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function LocationSearch({
  onLocationSelect,
  placeholder = "Search for a location...",
  disabled = false,
}: LocationSearchProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<LocationResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const skipSearchRef = useRef(false);

  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (skipSearchRef.current) {
        skipSearchRef.current = false;
        return;
      }

      if (query.length >= 3) {
        setIsLoading(true);
        const results = await searchLocations(query);
        setSuggestions(results);
        setShowSuggestions(true);
        setIsLoading(false);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setSelectedIndex(-1);
  };

  const handleLocationSelect = (location: LocationResult) => {
    skipSearchRef.current = true;

    setQuery(location.display_name);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    setSuggestions([]);
    onLocationSelect({
      lat: parseFloat(location.lat),
      lon: parseFloat(location.lon),
      address: location.display_name,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleLocationSelect(suggestions[selectedIndex]);
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          size={16}
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full pl-10 pr-4 py-2 border rounded-md text-white placeholder-gray-400 ${
            disabled
              ? "bg-gray-600 border-gray-500 cursor-not-allowed opacity-50"
              : "bg-gray-800 border-gray-600"
          }`}
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          </div>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && !disabled && (
        <div
          ref={suggestionsRef}
          className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((location, index) => (
            <div
              key={location.place_id}
              onClick={() => handleLocationSelect(location)}
              className={`px-4 py-2 cursor-pointer flex items-center gap-2 ${
                index === selectedIndex
                  ? "bg-gray-700 text-white"
                  : "text-gray-300 hover:bg-gray-700"
              }`}
            >
              <MapPin size={14} className="text-gray-400 flex-shrink-0" />
              <span className="text-sm truncate">{location.display_name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
