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

  // get location and setter from context
  const { location, setLocation } = useContext(LocationContext);

  const handleChange = (event) => {
    const selectedLocation = event.target.value;

    // update context (LocationProvider will keep localStorage in sync)
    setLocation(selectedLocation);

    // Navigate to home with query param
    navigate(`/home?location=${encodeURIComponent(selectedLocation)}`);
  };

  return (
    <Box sx={{ minWidth: 240 }}>
      <FormControl fullWidth>
        <InputLabel id="location-select-label">Choose Your Location</InputLabel>
        <Select
          labelId="location-select-label"
          id="location-select"
          value={location || ""}
          label="Choose Your Location"
          onChange={handleChange}
        >
          <MenuItem value="Tanuku">Tanuku</MenuItem>
          <MenuItem value="Kolkata">Kolkata</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
}
