"use client";

import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Types for country-state-city data
interface CountryData {
  isoCode: string;
  name: string;
}

interface StateData {
  isoCode: string;
  name: string;
}

interface CityData {
  name: string;
}

interface LocationFieldsProps {
  country: string;
  stateProvince: string;
  city: string;
  onCountryChange: (value: string) => void;
  onStateProvinceChange: (value: string) => void;
  onCityChange: (value: string) => void;
  selectCountryLabel: string;
  selectStateLabel: string;
  selectCityLabel: string;
  selectCountryFirstLabel: string;
  stateProvinceLabel: string;
  cityLabel: string;
}

// Type for lazy-loaded country-state-city module
type CountryStateCityModule = {
  Country: { getAllCountries: () => CountryData[] };
  State: { getStatesOfCountry: (countryCode: string) => StateData[] };
  City: { getCitiesOfState: (countryCode: string, stateCode: string) => CityData[] };
};

// Lazy-loaded country-state-city module
let countryStateCityModule: Promise<CountryStateCityModule> | undefined;

function getCountryStateCityModule(): Promise<CountryStateCityModule> {
  if (!countryStateCityModule) {
    countryStateCityModule = import("country-state-city").then((mod) => ({
      Country: mod.Country,
      State: mod.State,
      City: mod.City,
    }));
  }
  return countryStateCityModule;
}

export function LocationFields({
  country,
  stateProvince,
  city,
  onCountryChange,
  onStateProvinceChange,
  onCityChange,
  selectCountryLabel,
  selectStateLabel,
  selectCityLabel,
  selectCountryFirstLabel,
  stateProvinceLabel,
  cityLabel,
}: LocationFieldsProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [countries, setCountries] = useState<CountryData[]>([]);
  const [states, setStates] = useState<StateData[]>([]);
  const [cities, setCities] = useState<CityData[]>([]);

  // Load the module on mount
  useEffect(() => {
    getCountryStateCityModule().then(({ Country, State, City }) => {
      setCountries(Country.getAllCountries());
      setIsLoaded(true);

      // If we have initial values, load the dependent data
      if (country) {
        setStates(State.getStatesOfCountry(country));
        if (stateProvince) {
          setCities(City.getCitiesOfState(country, stateProvince));
        }
      }
    });
  }, []);

  // Update states when country changes
  useEffect(() => {
    if (!isLoaded) return;
    getCountryStateCityModule().then(({ State, City }) => {
      const newStates = country ? State.getStatesOfCountry(country) : [];
      setStates(newStates);

      // Check if current state is valid for new country
      const isValidState = newStates.some((s) => s.isoCode === stateProvince);
      if (stateProvince && !isValidState) {
        onStateProvinceChange("");
        onCityChange("");
        setCities([]);
      } else if (country && stateProvince) {
        setCities(City.getCitiesOfState(country, stateProvince));
      }
    });
  }, [country, isLoaded, onStateProvinceChange, onCityChange, stateProvince]);

  // Update cities when state changes
  useEffect(() => {
    if (!isLoaded || !country) return;
    getCountryStateCityModule().then(({ City }) => {
      if (stateProvince) {
        setCities(City.getCitiesOfState(country, stateProvince));
      } else {
        setCities([]);
      }
    });
  }, [stateProvince, country, isLoaded]);

  const handleCountryChange = (value: string) => {
    onCountryChange(value);
    onStateProvinceChange("");
    onCityChange("");
  };

  const handleStateProvinceChange = (value: string) => {
    onStateProvinceChange(value);
    onCityChange("");
  };

  if (!isLoaded) {
    return (
      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">
            {selectCountryLabel}
          </label>
          <div className="h-10 w-full rounded-md border border-input bg-muted/50 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label
          htmlFor="country"
          className="mb-2 block text-sm font-medium text-foreground"
        >
          {selectCountryLabel}
        </label>
        <Select value={country} onValueChange={handleCountryChange}>
          <SelectTrigger id="country">
            <SelectValue placeholder={selectCountryLabel} />
          </SelectTrigger>
          <SelectContent className="!max-h-[60vh]">
            {countries.map((c) => (
              <SelectItem key={c.isoCode} value={c.isoCode}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {states.length > 0 && (
        <div>
          <label
            htmlFor="state"
            className="mb-2 block text-sm font-medium text-foreground"
          >
            {stateProvinceLabel}
          </label>
          <Select
            value={stateProvince}
            onValueChange={handleStateProvinceChange}
            disabled={!country}
          >
            <SelectTrigger id="state">
              <SelectValue
                placeholder={country ? selectStateLabel : selectCountryFirstLabel}
              />
            </SelectTrigger>
            <SelectContent className="!max-h-[60vh]">
              {states.map((s) => (
                <SelectItem key={s.isoCode} value={s.isoCode}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {states.length > 0 && cities.length > 0 && (
        <div>
          <label
            htmlFor="city"
            className="mb-2 block text-sm font-medium text-foreground"
          >
            {cityLabel}
          </label>
          <Select
            value={city}
            onValueChange={onCityChange}
            disabled={!stateProvince}
          >
            <SelectTrigger id="city">
              <SelectValue
                placeholder={stateProvince ? selectCityLabel : selectStateLabel}
              />
            </SelectTrigger>
            <SelectContent className="!max-h-[60vh]">
              {cities.map((c, index) => (
                <SelectItem key={`${c.name}-${index}`} value={c.name}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
