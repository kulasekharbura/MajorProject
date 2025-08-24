// src/components/Location/form.jsx
import React, { useContext, useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  InputLabel,
  MenuItem,
  FormControl,
  Select,
  Typography,
  CircularProgress,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import LocationContext from "../../context/LocationContext";

export default function FormSelect() {
  const navigate = useNavigate();
  const { location, setLocation } = useContext(LocationContext);

  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch the list of available locations from the backend
    axios
      .get("/api/locations")
      .then((res) => {
        setLocations(res.data.locations || []);
      })
      .catch((err) => {
        console.error("Failed to fetch locations", err);
        // You could set an error state here if needed
      })
      .finally(() => {
        setLoading(false);
      });
  }, []); // Empty dependency array means this runs once on component mount

  const handleLocationSelect = (selectedLocation) => {
    if (selectedLocation) {
      setLocation(selectedLocation);
      navigate(`/home?location=${encodeURIComponent(selectedLocation)}`);
    }
  };

  return (
    <Box
      sx={{
        minWidth: 240,
        maxWidth: 500,
        mx: "auto",
        p: 4,
        textAlign: "center",
      }}
    >
      <Typography variant="h4" gutterBottom>
        Welcome to AllInTown
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Please select your city to get started
      </Typography>
      {loading ? (
        <CircularProgress />
      ) : (
        <FormControl fullWidth>
          <InputLabel id="location-select-label">
            Choose Your Location
          </InputLabel>
          <Select
            labelId="location-select-label"
            id="location-select"
            value={location || ""}
            label="Choose Your Location"
            onChange={(e) => handleLocationSelect(e.target.value)}
          >
            {/* Dynamically generate the menu items from the fetched locations */}
            {locations.length > 0 ? (
              locations.map((loc) => (
                <MenuItem
                  key={loc}
                  value={loc}
                  onClick={() => handleLocationSelect(loc)}
                >
                  {loc}
                </MenuItem>
              ))
            ) : (
              <MenuItem disabled>No locations available</MenuItem>
            )}
          </Select>
        </FormControl>
      )}
    </Box>
  );
}
