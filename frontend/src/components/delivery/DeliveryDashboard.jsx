// src/components/delivery/DeliveryDashboard.jsx
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Container,
  Paper,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
} from "@mui/material";

const statusColors = {
  placed: "primary",
  confirmed: "info",
  shipped: "warning",
  delivered: "success",
  cancelled: "error",
};

export default function DeliveryDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/delivery/my-orders");
      setOrders(res.data.orders || []);
    } catch (err) {
      setError("Failed to fetch assigned orders. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleMarkAsDelivered = async (orderId) => {
    setIsUpdating(true);
    try {
      await axios.put(`/api/delivery/orders/${orderId}/status`, {
        status: "delivered",
      });
      // Refresh the orders list to show the updated status
      await fetchOrders();
    } catch (err) {
      setError("Failed to update order status.");
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Box sx={{ bgcolor: "#f7f9fc", minHeight: "calc(100vh - 64px)", py: 4 }}>
      <Container maxWidth="lg">
        <Typography
          variant="h4"
          component="h1"
          fontWeight="bold"
          sx={{ mb: 4 }}
        >
          My Deliveries
        </Typography>

        <Paper sx={{ p: 2, borderRadius: "12px" }}>
          {loading ? (
            <Box sx={{ textAlign: "center", p: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Order Code</TableCell>
                    <TableCell>Shop</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Delivery Address</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} sx={{ textAlign: "center" }}>
                        You have no assigned orders yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    orders.map((order) => (
                      <TableRow key={order._id}>
                        <TableCell>{order.orderCode}</TableCell>
                        <TableCell>{order.shop?.name || "N/A"}</TableCell>
                        <TableCell>
                          {order.consumer?.realName || "N/A"}
                        </TableCell>
                        <TableCell>{order.deliveryAddress}</TableCell>
                        <TableCell>
                          <Chip
                            label={order.status}
                            color={statusColors[order.status]}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {order.status === "shipped" && (
                            <Button
                              variant="contained"
                              size="small"
                              onClick={() => handleMarkAsDelivered(order._id)}
                              disabled={isUpdating}
                            >
                              Mark as Delivered
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Container>
    </Box>
  );
}
