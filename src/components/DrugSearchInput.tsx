"use client";

import { useState, useEffect, useRef } from "react";
import { supabase, Drug } from "@/lib/supabase";

interface DrugSearchInputProps {
  value: string;
  onChange: (value: string, selectedDrug?: Drug) => void;
  placeholder: string;
  label: string;
}

export default function DrugSearchInput({ value, onChange, placeholder, label }: DrugSearchInputProps) {
  const [searchResults, setSearchResults] = useState<Drug[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const searchDrugs = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('drugs')
        .select('*')
        .or(`commercialName.ilike.${query}%,mnnName.ilike.${query}%`)
        .limit(10);

      if (error) {
        console.error('Error searching drugs:', error);
        setSearchResults([]);
      } else {
        setSearchResults(data || []);
      }
    } catch (error) {
      console.error('Error searching drugs:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchDrugs(value);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setIsOpen(true);
  };

  const handleSelectDrug = (drug: Drug) => {
    // Определяем, по какому полю искали (с начала строки)
    const query = value.toLowerCase();
    const isCommercialMatch = drug.commercialName.toLowerCase().startsWith(query);
    const selectedName = isCommercialMatch ? drug.commercialName : drug.mnnName;
    
    onChange(selectedName, drug);
    setIsOpen(false);
  };

  const getDisplayName = (drug: Drug) => {
    const query = value.toLowerCase();
    const isCommercialMatch = drug.commercialName.toLowerCase().startsWith(query);
    return isCommercialMatch ? drug.commercialName : drug.mnnName;
  };

  const getTypeLabel = (drug: Drug) => {
    const query = value.toLowerCase();
    const isCommercialMatch = drug.commercialName.toLowerCase().startsWith(query);
    return isCommercialMatch ? 'ТН' : 'МНН';
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        className="w-full p-3 bg-white border-[1.5px] border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
      />
      
      {isOpen && (searchResults.length > 0 || loading) && (
        <div
          ref={dropdownRef}
          className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {loading ? (
            <div className="p-3 text-center text-gray-500">
              Поиск...
            </div>
          ) : (
            searchResults.map((drug) => (
              <div
                key={drug.id}
                onClick={() => handleSelectDrug(drug)}
                className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-bold text-gray-900">
                      {getDisplayName(drug)}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {drug.active_Substance.charAt(0).toUpperCase() + drug.active_Substance.slice(1).toLowerCase()}
                    </div>
                    {drug.owner && (
                      <div className="text-xs text-gray-500 mt-1">
                        {drug.owner}
                      </div>
                    )}
                  </div>
                  <div className="ml-3 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {getTypeLabel(drug)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
