// src/components/mainpage/HomePage.jsx
import React from "react";
import { Box, Container } from "@mui/material";
import ShopsPage from "./Shops";
import HeroSection from "./Hero";

function HomePage() {
  return (
    <Box sx={{ bgcolor: "#f7f9fc" }}>
      <HeroSection />
      <Container sx={{ py: 4 }}>
        <ShopsPage />
      </Container>
    </Box>
  );
}

export default HomePage;
