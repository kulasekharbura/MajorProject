// src/context/LocationContext.jsx
import React from "react";

const LocationContext = React.createContext({
  location: "",
  setLocation: () => {},
});

export function LocationProvider({ children }) {
  const [location, setLocation] = React.useState(
    typeof window !== "undefined" ? localStorage.getItem("location") || "" : ""
  );

  React.useEffect(() => {
    // sync localStorage when context location changes
    if (location) localStorage.setItem("location", location);
  }, [location]);

  return (
    <LocationContext.Provider value={{ location, setLocation }}>
      {children}
    </LocationContext.Provider>
  );
}

export default LocationContext;
