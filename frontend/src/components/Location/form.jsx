// src/components/Location/FormSelect.jsx
import React, { useContext } from "react";
import Box from "@mui/material/Box";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import { useNavigate } from "react-router-dom";
import LocationContext from "../../context/LocationContext";

export default function FormSelect() {
  const navigate = useNavigate();
  const { location, setLocation } = useContext(LocationContext);

  const handleLocationSelect = (selectedLocation) => {
    // Ensure a location is actually selected
    if (selectedLocation) {
      // Update the location in our context and localStorage
      setLocation(selectedLocation);
      // Navigate to the home page with the selected location as a query parameter
      navigate(`/home?location=${encodeURIComponent(selectedLocation)}`);
    }
  };

  return (
    <Box sx={{ minWidth: 240, maxWidth: 500, mx: "auto", p: 4 }}>
      <FormControl fullWidth>
        <InputLabel id="location-select-label">Choose Your Location</InputLabel>
        <Select
          labelId="location-select-label"
          id="location-select"
          value={location || ""}
          label="Choose Your Location"
          // We still need onChange for accessibility, e.g., keyboard navigation
          onChange={(e) => handleLocationSelect(e.target.value)}
        >
          {/* Adding onClick to each MenuItem ensures that clicking an already 
            selected item will still trigger the navigation.
          */}
          <MenuItem
            value="Tanuku"
            onClick={() => handleLocationSelect("Tanuku")}
          >
            Tanuku
          </MenuItem>
          <MenuItem
            value="Kolkata"
            onClick={() => handleLocationSelect("Kolkata")}
          >
            Kolkata
          </MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
}
