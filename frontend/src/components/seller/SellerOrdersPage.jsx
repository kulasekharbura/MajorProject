// src/components/seller/SellerOrdersPage.jsx
import React, { useState, useEffect } from "react";
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
} from "@mui/material";
import { useNavigate } from "react-router-dom";

const statusColors = {
  placed: "primary",
  confirmed: "info",
  shipped: "warning",
  delivered: "success",
  cancelled: "error",
};

export default function SellerOrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const res = await axios.get("/api/seller/orders");
        setOrders(res.data.orders || []);
      } catch (err) {
        setError("Failed to fetch orders. Please try again.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  return (
    <Box sx={{ bgcolor: "#f7f9fc", minHeight: "calc(100vh - 64px)", py: 4 }}>
      <Container maxWidth="lg">
        <Typography
          variant="h4"
          component="h1"
          fontWeight="bold"
          sx={{ mb: 4 }}
        >
          Incoming Orders
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
                    <TableCell>Date</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Total Bill</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} sx={{ textAlign: "center" }}>
                        You have no orders yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    orders.map((order) => (
                      <TableRow
                        key={order._id}
                        hover
                        onClick={() => navigate(`/seller/orders/${order._id}`)}
                        sx={{ cursor: "pointer" }}
                      >
                        <TableCell>{order.orderCode}</TableCell>
                        <TableCell>
                          {new Date(order.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {order.consumer?.realName || "N/A"}
                        </TableCell>
                        <TableCell>₹{order.totalBill}</TableCell>
                        <TableCell>
                          <Chip
                            label={order.status}
                            color={statusColors[order.status]}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>View Details</TableCell>
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
