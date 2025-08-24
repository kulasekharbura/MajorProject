// src/components/checkout/OrderSuccessPage.jsx
import React from "react";
import { useParams, Link as RouterLink } from "react-router-dom";
import { Box, Typography, Container, Paper, Button } from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";

export default function OrderSuccessPage() {
  const { orderCode } = useParams();

  return (
    <Box sx={{ bgcolor: "#f7f9fc", minHeight: "calc(100vh - 64px)", py: 4 }}>
      <Container maxWidth="sm">
        <Paper sx={{ p: 4, textAlign: "center", borderRadius: "12px" }}>
          <CheckCircleOutlineIcon
            sx={{ fontSize: 80, color: "success.main", mb: 2 }}
          />
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            fontWeight="bold"
          >
            Order Placed Successfully!
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Your Order Code is:
          </Typography>
          <Typography
            variant="h5"
            fontWeight="medium"
            sx={{ my: 2, userSelect: "all" }}
          >
            {orderCode}
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Thank you for shopping with AllInTown. You can track the status of
            your order in your profile.
          </Typography>
          <Button component={RouterLink} to="/home" variant="contained">
            Continue Shopping
          </Button>
        </Paper>
      </Container>
    </Box>
  );
}
