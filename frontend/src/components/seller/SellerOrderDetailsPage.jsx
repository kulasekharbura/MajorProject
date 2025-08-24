import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link as RouterLink } from "react-router-dom";
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
  CircularProgress,
  Alert,
  Chip,
  Stack,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";

const statusColors = {
  placed: "primary",
  confirmed: "info",
  shipped: "warning",
  delivered: "success",
  cancelled: "error",
};

export default function SellerOrderDetailsPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [snack, setSnack] = useState({
    open: false,
    msg: "",
    severity: "success",
  });
  const [isUpdating, setIsUpdating] = useState(false);

  // State for delivery assignment
  const [deliveryPersonnel, setDeliveryPersonnel] = useState([]);
  const [selectedDeliveryBoy, setSelectedDeliveryBoy] = useState("");

  const fetchOrderDetails = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/seller/orders/${orderId}`);
      setOrder(res.data.order);
    } catch (err) {
      setError("Failed to fetch order details.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrderDetails();
  }, [fetchOrderDetails]);

  // Fetch delivery personnel when the order is loaded and status is 'confirmed'
  useEffect(() => {
    if (order && order.status === "confirmed" && order.shop?.locationName) {
      axios
        .get("/api/delivery-personnel", {
          params: { location: order.shop.locationName },
        })
        .then((res) => {
          setDeliveryPersonnel(res.data.deliveryPersonnel || []);
        })
        .catch((err) =>
          console.error("Failed to fetch delivery personnel", err)
        );
    }
  }, [order]);

  const handleUpdateStatus = async (newStatus) => {
    setIsUpdating(true);
    try {
      const res = await axios.put(`/api/seller/orders/${orderId}/status`, {
        status: newStatus,
      });
      setOrder(res.data.order);
      setSnack({
        open: true,
        msg: `Order marked as ${newStatus}!`,
        severity: "success",
      });
    } catch (err) {
      console.error("Failed to update status", err);
      setSnack({
        open: true,
        msg: "Failed to update status.",
        severity: "error",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAssignDelivery = async () => {
    if (!selectedDeliveryBoy) {
      setSnack({
        open: true,
        msg: "Please select a delivery person.",
        severity: "warning",
      });
      return;
    }
    setIsUpdating(true);
    try {
      const res = await axios.put(`/api/seller/orders/${orderId}/assign`, {
        deliveryBoyId: selectedDeliveryBoy,
      });
      setOrder(res.data.order);
      setSnack({
        open: true,
        msg: "Order assigned and marked as shipped!",
        severity: "success",
      });
    } catch (err) {
      console.error("Failed to assign delivery", err);
      setSnack({
        open: true,
        msg: "Failed to assign delivery.",
        severity: "error",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ textAlign: "center", py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <Box sx={{ bgcolor: "#f7f9fc", minHeight: "calc(100vh - 64px)", py: 4 }}>
      <Container maxWidth="lg">
        <Button component={RouterLink} to="/seller/orders" sx={{ mb: 2 }}>
          &larr; Back to All Orders
        </Button>
        <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
          Order Details
        </Typography>

        <Grid container spacing={3}>
          {/* Main Details & Items */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, borderRadius: "12px" }}>
              <Typography variant="h6">Items Ordered</Typography>
              <List>
                {order.items.map((item, index) => (
                  <ListItem key={index} divider>
                    <ListItemText
                      primary={`${item.name} (x${item.quantity})`}
                      secondary={`Price: ₹${item.price} each`}
                    />
                    <Typography variant="body1" fontWeight="medium">
                      ₹{item.price * item.quantity}
                    </Typography>
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>

          {/* Summary & Actions */}
          <Grid item xs={12} md={4}>
            <Paper
              sx={{
                p: 3,
                borderRadius: "12px",
                position: "sticky",
                top: "80px",
              }}
            >
              <Typography variant="h6" gutterBottom>
                Summary
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Stack spacing={1}>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography color="text.secondary">Order Code:</Typography>
                  <Typography fontWeight="medium">{order.orderCode}</Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography color="text.secondary">Shop:</Typography>
                  <Typography fontWeight="medium">{order.shop.name}</Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography color="text.secondary">Status:</Typography>
                  <Chip
                    label={order.status}
                    color={statusColors[order.status]}
                    size="small"
                  />
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography color="text.secondary">Total Bill:</Typography>
                  <Typography fontWeight="bold" variant="h6">
                    ₹{order.totalBill}
                  </Typography>
                </Box>
              </Stack>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Customer Details
              </Typography>
              <Typography>Name: {order.consumer.realName}</Typography>
              <Typography>Email: {order.consumer.email}</Typography>
              <Typography>Address: {order.deliveryAddress}</Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Actions
              </Typography>
              <Stack spacing={1}>
                <Button
                  variant="contained"
                  onClick={() => handleUpdateStatus("confirmed")}
                  disabled={isUpdating || order.status !== "placed"}
                  sx={{ bgcolor: "#2E7D32", "&:hover": { bgcolor: "#1B5E20" } }}
                >
                  Confirm Order
                </Button>
                {order.status === "confirmed" && (
                  <Box
                    sx={{
                      border: "1px solid",
                      borderColor: "divider",
                      p: 2,
                      borderRadius: "8px",
                      mt: 2,
                    }}
                  >
                    <Typography variant="subtitle1" gutterBottom>
                      Assign for Delivery
                    </Typography>
                    <FormControl fullWidth size="small">
                      <InputLabel>Select Delivery Person</InputLabel>
                      <Select
                        value={selectedDeliveryBoy}
                        label="Select Delivery Person"
                        onChange={(e) => setSelectedDeliveryBoy(e.target.value)}
                      >
                        {deliveryPersonnel.map((person) => (
                          <MenuItem key={person._id} value={person._id}>
                            {person.realName}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <Button
                      variant="outlined"
                      onClick={handleAssignDelivery}
                      disabled={isUpdating || !selectedDeliveryBoy}
                      fullWidth
                      sx={{ mt: 1 }}
                    >
                      Assign and Ship
                    </Button>
                  </Box>
                )}
                <Button
                  color="error"
                  onClick={() => handleUpdateStatus("cancelled")}
                  disabled={
                    isUpdating ||
                    order.status === "delivered" ||
                    order.status === "cancelled"
                  }
                >
                  Cancel Order
                </Button>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Container>
      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snack.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
