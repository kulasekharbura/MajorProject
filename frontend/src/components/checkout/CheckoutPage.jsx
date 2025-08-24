// src/components/checkout/CheckoutPage.jsx
import React, { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Box,
  Typography,
  Container,
  Paper,
  Grid,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  Snackbar,
  Alert,
  CircularProgress,
} from "@mui/material";
import AuthContext from "../../context/AuthContext";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("COD"); // Default to Cash on Delivery
  const [error, setError] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);

  useEffect(() => {
    // Set the first address as the default selected address
    if (user?.addresses?.length > 0) {
      setSelectedAddress(user.addresses[0]);
    }
  }, [user]);

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const res = await axios.get("/cart");
        const cartItems = res.data.cart || [];
        setCart(cartItems);
        const cartTotal = cartItems.reduce(
          (sum, it) => sum + (it.price || 0) * it.quantity,
          0
        );
        setTotal(cartTotal);
      } catch (err) {
        setError("Failed to load cart for checkout.");
      } finally {
        setLoading(false);
      }
    };
    fetchCart();
  }, []);

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      setError("Please select a delivery address.");
      return;
    }
    setPlacingOrder(true);
    setError("");
    try {
      const res = await axios.post("/api/orders", {
        deliveryAddress: selectedAddress,
        paymentMethod,
      });
      // Redirect to a success page with order details
      navigate(`/order-success/${res.data.order.orderCode}`);
    } catch (err) {
      setError(
        err.response?.data?.error || "Failed to place order. Please try again."
      );
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ textAlign: "center", py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: "#f7f9fc", minHeight: "calc(100vh - 64px)", py: 4 }}>
      <Container maxWidth="md">
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Checkout
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Grid container spacing={4}>
          <Grid item xs={12} md={7}>
            {/* Address Selection */}
            <Paper sx={{ p: 3, mb: 3, borderRadius: "12px" }}>
              <Typography variant="h6" gutterBottom>
                1. Select Delivery Address
              </Typography>
              <FormControl component="fieldset" fullWidth>
                <RadioGroup
                  value={selectedAddress}
                  onChange={(e) => setSelectedAddress(e.target.value)}
                >
                  {user?.addresses?.length > 0 ? (
                    user.addresses.map((addr, i) => (
                      <FormControlLabel
                        key={i}
                        value={addr}
                        control={<Radio />}
                        label={addr}
                      />
                    ))
                  ) : (
                    <Typography color="text.secondary">
                      You have no saved addresses. Please add one in your
                      profile.
                    </Typography>
                  )}
                </RadioGroup>
              </FormControl>
            </Paper>

            {/* Payment Method */}
            <Paper sx={{ p: 3, borderRadius: "12px" }}>
              <Typography variant="h6" gutterBottom>
                2. Select Payment Method
              </Typography>
              <FormControl component="fieldset">
                <RadioGroup
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <FormControlLabel
                    value="COD"
                    control={<Radio />}
                    label="Cash on Delivery (COD)"
                  />
                  <FormControlLabel
                    value="UPI"
                    control={<Radio />}
                    label="UPI (Coming Soon)"
                    disabled
                  />
                </RadioGroup>
              </FormControl>
            </Paper>
          </Grid>

          {/* Order Summary */}
          <Grid item xs={12} md={5}>
            <Paper sx={{ p: 3, borderRadius: "12px" }}>
              <Typography variant="h6" gutterBottom>
                Order Summary
              </Typography>
              <List disablePadding>
                {cart.map((item) => (
                  <ListItem key={item.itemId} sx={{ py: 1, px: 0 }}>
                    <ListItemText
                      primary={item.name}
                      secondary={`Quantity: ${item.quantity}`}
                    />
                    <Typography variant="body2">
                      ₹{item.price * item.quantity}
                    </Typography>
                  </ListItem>
                ))}
                <Divider sx={{ my: 1 }} />
                <ListItem sx={{ py: 1, px: 0 }}>
                  <ListItemText primary="Total" />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    ₹{total}
                  </Typography>
                </ListItem>
              </List>
              <Button
                fullWidth
                variant="contained"
                size="large"
                sx={{
                  mt: 2,
                  bgcolor: "#2E7D32",
                  "&:hover": { bgcolor: "#1B5E20" },
                }}
                onClick={handlePlaceOrder}
                disabled={placingOrder || !selectedAddress || cart.length === 0}
              >
                {placingOrder ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Place Order"
                )}
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
