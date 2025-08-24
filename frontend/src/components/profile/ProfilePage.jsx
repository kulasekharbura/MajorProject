// src/components/profile/ProfilePage.jsx
import React, { useContext, useState, useEffect } from "react";
import {
  Box,
  Typography,
  Container,
  Paper,
  Grid,
  TextField,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Snackbar,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import HomeIcon from "@mui/icons-material/Home";
import AuthContext from "../../context/AuthContext";
import axios from "axios";

const statusColors = {
  placed: "primary",
  confirmed: "info",
  shipped: "warning",
  delivered: "success",
  cancelled: "error",
};

export default function ProfilePage() {
  const { user, refreshMe } = useContext(AuthContext);

  const [realName, setRealName] = useState(user?.realName || "");
  const [isEditing, setIsEditing] = useState(false);
  const [newAddress, setNewAddress] = useState("");
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [snack, setSnack] = useState({
    open: false,
    msg: "",
    severity: "success",
  });

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      try {
        setLoadingOrders(true);
        const res = await axios.get("/api/my-orders");
        setOrders(res.data.orders || []);
      } catch (err) {
        console.error("Failed to fetch orders", err);
      } finally {
        setLoadingOrders(false);
      }
    };
    fetchOrders();
  }, [user]);

  if (!user) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put("/api/profile", { realName });
      await refreshMe();
      setSnack({
        open: true,
        msg: "Profile updated successfully!",
        severity: "success",
      });
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to update profile", err);
      setSnack({
        open: true,
        msg: "Failed to update profile.",
        severity: "error",
      });
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    if (!newAddress.trim()) return;
    try {
      await axios.post("/api/addresses", { address: newAddress });
      await refreshMe();
      setSnack({ open: true, msg: "Address added!", severity: "success" });
      setNewAddress("");
    } catch (err) {
      console.error("Failed to add address", err);
      setSnack({
        open: true,
        msg: "Failed to add address.",
        severity: "error",
      });
    }
  };

  const handleDeleteAddress = async (address) => {
    try {
      await axios.delete("/api/addresses", { data: { address } });
      await refreshMe();
      setSnack({ open: true, msg: "Address removed!", severity: "success" });
    } catch (err) {
      console.error("Failed to delete address", err);
      setSnack({
        open: true,
        msg: "Failed to delete address.",
        severity: "error",
      });
    }
  };

  return (
    <Box sx={{ bgcolor: "#f7f9fc", minHeight: "calc(100vh - 64px)", py: 4 }}>
      <Container maxWidth="lg">
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          My Profile
        </Typography>
        <Grid container spacing={4}>
          {/* Profile Details Section */}
          <Grid item xs={12} md={6} sx={{ display: "flex" }}>
            <Paper
              sx={{ p: 3, borderRadius: "12px", width: "100%", boxShadow: 3 }}
            >
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <AccountCircleIcon sx={{ mr: 1, color: "text.secondary" }} />
                <Typography variant="h6">Profile Information</Typography>
              </Box>
              <Divider />
              <Box
                component="form"
                onSubmit={handleProfileUpdate}
                sx={{ mt: 2 }}
              >
                <TextField
                  label="Username"
                  value={user.username}
                  fullWidth
                  margin="normal"
                  disabled
                  variant="filled"
                />
                <TextField
                  label="Email"
                  value={user.email}
                  fullWidth
                  margin="normal"
                  disabled
                  variant="filled"
                />
                <TextField
                  label="Full Name"
                  value={realName}
                  onChange={(e) => setRealName(e.target.value)}
                  fullWidth
                  margin="normal"
                  disabled={!isEditing}
                  variant={isEditing ? "outlined" : "filled"}
                />
                {isEditing ? (
                  <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
                    <Button
                      type="submit"
                      variant="contained"
                      sx={{
                        bgcolor: "#2E7D32",
                        "&:hover": { bgcolor: "#1B5E20" },
                      }}
                    >
                      Save Changes
                    </Button>
                    <Button
                      variant="text"
                      onClick={() => {
                        setIsEditing(false);
                        setRealName(user.realName);
                      }}
                    >
                      Cancel
                    </Button>
                  </Box>
                ) : (
                  <Button
                    variant="contained"
                    onClick={() => setIsEditing(true)}
                    sx={{
                      bgcolor: "#2E7D32",
                      "&:hover": { bgcolor: "#1B5E20" },
                    }}
                  >
                    Edit Profile
                  </Button>
                )}
              </Box>
            </Paper>
          </Grid>

          {/* Delivery Addresses Section */}
          <Grid item xs={12} md={6} sx={{ display: "flex" }}>
            <Paper
              sx={{
                p: 3,
                borderRadius: "12px",
                width: "100%",
                boxShadow: 3,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <HomeIcon sx={{ mr: 1, color: "text.secondary" }} />
                <Typography variant="h6">My Addresses</Typography>
              </Box>
              <Divider />
              <Box sx={{ flexGrow: 1, overflow: "auto" }}>
                <List>
                  {user.addresses && user.addresses.length > 0 ? (
                    user.addresses.map((address, index) => (
                      <ListItem
                        key={index}
                        secondaryAction={
                          <IconButton
                            edge="end"
                            aria-label="delete"
                            onClick={() => handleDeleteAddress(address)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        }
                      >
                        <ListItemText primary={address} />
                      </ListItem>
                    ))
                  ) : (
                    <Box sx={{ textAlign: "center", py: 4 }}>
                      <Typography color="text.secondary">
                        No addresses saved yet.
                      </Typography>
                    </Box>
                  )}
                </List>
              </Box>
              <Box
                component="form"
                onSubmit={handleAddAddress}
                sx={{ mt: "auto", pt: 2, borderTop: 1, borderColor: "divider" }}
              >
                <TextField
                  label="Add a new address"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  fullWidth
                  margin="normal"
                  variant="outlined"
                />
                <Button
                  type="submit"
                  variant="contained"
                  sx={{
                    mt: 1,
                    bgcolor: "#2E7D32",
                    "&:hover": { bgcolor: "#1B5E20" },
                  }}
                >
                  Add Address
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* My Orders Section */}
        <Paper sx={{ p: 3, borderRadius: "12px", mt: 4, boxShadow: 3 }}>
          <Typography variant="h6" gutterBottom>
            My Order History
          </Typography>
          <Divider sx={{ mb: 2 }} />
          {loadingOrders ? (
            <CircularProgress />
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Order Code</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Shop</TableCell>
                    <TableCell>Total</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        You have not placed any orders yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    orders.map((order) => (
                      <TableRow key={order._id}>
                        <TableCell>{order.orderCode}</TableCell>
                        <TableCell>
                          {new Date(order.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{order.shop?.name || "N/A"}</TableCell>
                        <TableCell>₹{order.totalBill}</TableCell>
                        <TableCell>
                          <Chip
                            label={order.status}
                            color={statusColors[order.status]}
                            size="small"
                          />
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
