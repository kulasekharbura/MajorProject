// src/components/seller/SellerDashboard.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  Typography,
  Container,
  Paper,
  Grid,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  CardActions,
  Modal,
  Fade,
  Backdrop,
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
  borderRadius: "12px",
};

export default function SellerDashboard() {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);

  // State for the new shop form
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [formError, setFormError] = useState("");

  // State for the edit modal
  const [editingShop, setEditingShop] = useState(null); // The shop object being edited
  const [openEditModal, setOpenEditModal] = useState(false);

  const fetchShops = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/seller/shops");
      setShops(res.data.shops || []);
    } catch (err) {
      setError("Failed to fetch shops. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShops();
  }, []);

  const handleCreateShop = async (e) => {
    e.preventDefault();
    setFormError("");
    try {
      await axios.post("/api/shops", {
        name: newName,
        category: newCategory,
        locationName: newLocation,
        imageUrl: newImageUrl,
      });
      // Reset form and hide it
      setNewName("");
      setNewCategory("");
      setNewLocation("");
      setNewImageUrl("");
      setShowCreateForm(false);
      await fetchShops(); // Refresh the list
    } catch (err) {
      setFormError(err.response?.data?.error || "Failed to create shop.");
    }
  };

  const handleOpenEditModal = (shop) => {
    setEditingShop(shop); // Set the current shop data
    setOpenEditModal(true);
  };

  const handleCloseEditModal = () => {
    setOpenEditModal(false);
    setEditingShop(null); // Clear the editing state
  };

  const handleUpdateShop = async (e) => {
    e.preventDefault();
    if (!editingShop) return;
    try {
      await axios.put(`/api/shops/${editingShop._id}`, {
        name: editingShop.name,
        category: editingShop.category,
        locationName: editingShop.locationName,
        imageUrl: editingShop.imageUrl,
      });
      handleCloseEditModal();
      await fetchShops(); // Refresh the list
    } catch (err) {
      console.error("Failed to update shop", err);
      // You could set an error state for the modal here
    }
  };

  const handleEditFormChange = (e) => {
    setEditingShop({ ...editingShop, [e.target.name]: e.target.value });
  };

  return (
    <Box sx={{ bgcolor: "#f7f9fc", minHeight: "calc(100vh - 64px)", py: 4 }}>
      <Container maxWidth="lg">
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 4,
          }}
        >
          <Typography variant="h4" component="h1" fontWeight="bold">
            My Shops
          </Typography>
          <Box>
            <Button
              variant="outlined"
              component={RouterLink}
              to="/seller/orders"
              sx={{ mr: 2 }}
            >
              View All Orders
            </Button>
            <Button
              variant="contained"
              startIcon={<AddCircleOutlineIcon />}
              onClick={() => setShowCreateForm(!showCreateForm)}
              sx={{ bgcolor: "#2E7D32", "&:hover": { bgcolor: "#1B5E20" } }}
            >
              {showCreateForm ? "Cancel" : "Create New Shop"}
            </Button>
          </Box>
        </Box>

        {showCreateForm && (
          <Paper sx={{ p: 3, mb: 4, borderRadius: "12px" }}>
            <Typography variant="h6" gutterBottom>
              New Shop Details
            </Typography>
            <Box component="form" onSubmit={handleCreateShop}>
              {formError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {formError}
                </Alert>
              )}
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Shop Name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Category (e.g., Grocery)"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Location (e.g., Tanuku)"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Image URL (Optional)"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                  />
                </Grid>
              </Grid>
              <Button type="submit" variant="contained" sx={{ mt: 2 }}>
                Save Shop
              </Button>
            </Box>
          </Paper>
        )}

        {loading ? (
          <CircularProgress />
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : shops.length === 0 ? (
          <Typography>You haven't created any shops yet.</Typography>
        ) : (
          <Grid container spacing={3}>
            {shops.map((shop) => (
              <Grid item key={shop._id} xs={12} sm={6} md={4}>
                <Card
                  sx={{
                    height: "100%",
                    borderRadius: "12px",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" fontWeight="medium">
                      {shop.name}
                    </Typography>
                    <Typography color="text.secondary">
                      {shop.category}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 1 }}
                    >
                      {shop.locationName}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      component={RouterLink}
                      to={`/seller/shop/${shop._id}/items`}
                    >
                      Manage Items
                    </Button>
                    <Button
                      size="small"
                      onClick={() => handleOpenEditModal(shop)}
                    >
                      Edit
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>

      {/* Edit Shop Modal */}
      <Modal
        open={openEditModal}
        onClose={handleCloseEditModal}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{ timeout: 500 }}
      >
        <Fade in={openEditModal}>
          <Box sx={modalStyle}>
            <Typography variant="h6" component="h2">
              Edit Shop
            </Typography>
            {editingShop && (
              <Box component="form" onSubmit={handleUpdateShop} sx={{ mt: 2 }}>
                <TextField
                  name="name"
                  label="Shop Name"
                  value={editingShop.name}
                  onChange={handleEditFormChange}
                  fullWidth
                  margin="normal"
                  required
                />
                <TextField
                  name="category"
                  label="Category"
                  value={editingShop.category}
                  onChange={handleEditFormChange}
                  fullWidth
                  margin="normal"
                  required
                />
                <TextField
                  name="locationName"
                  label="Location"
                  value={editingShop.locationName}
                  onChange={handleEditFormChange}
                  fullWidth
                  margin="normal"
                  required
                />
                <TextField
                  name="imageUrl"
                  label="Image URL (Optional)"
                  value={editingShop.imageUrl}
                  onChange={handleEditFormChange}
                  fullWidth
                  margin="normal"
                />
                <Box
                  sx={{
                    mt: 3,
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 1,
                  }}
                >
                  <Button onClick={handleCloseEditModal}>Cancel</Button>
                  <Button type="submit" variant="contained">
                    Save Changes
                  </Button>
                </Box>
              </Box>
            )}
          </Box>
        </Fade>
      </Modal>
    </Box>
  );
}
