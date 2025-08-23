// src/components/mainpage/Hero.jsx
import React from "react";
import { Box, Typography, Container } from "@mui/material";

function HeroSection() {
  return (
    <Box
      sx={{
        background: "linear-gradient(45deg, #2E7D32 30%, #4CAF50 90%)", // Green gradient
        py: { xs: 6, md: 10 },
        color: "white",
        textAlign: "center",
      }}
    >
      <Container maxWidth="md">
        <Typography variant="h2" component="h1" fontWeight="bold" gutterBottom>
          Your Town, Your Stores, One App
        </Typography>
        <Typography variant="h5" component="p" sx={{ mb: 4, opacity: 0.9 }}>
          Get groceries, food, and essentials delivered from your favorite local
          shops.
        </Typography>
      </Container>
    </Box>
  );
}

export default HeroSection;
