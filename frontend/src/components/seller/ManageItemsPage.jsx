// src/components/seller/ManageItemsPage.jsx
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
  TextField,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  Divider,
  IconButton,
  Snackbar,
  Modal,
  Fade,
  Backdrop,
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { xs: "90%", sm: 500 },
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
  borderRadius: "12px",
};

export default function ManageItemsPage() {
  const { shopId } = useParams();
  const [items, setItems] = useState([]);
  const [shopName, setShopName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [snack, setSnack] = useState({
    open: false,
    msg: "",
    severity: "success",
  });

  // Form states
  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    category: "",
    price: "",
    imageUrl: "",
  });
  const [editingItem, setEditingItem] = useState(null);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const [itemsRes, shopRes] = await Promise.all([
        axios.get(`/api/shops/${shopId}/items`),
        axios.get(`/shops/${shopId}`),
      ]);
      setItems(itemsRes.data.items || []);
      setShopName(shopRes.data.shop?.name || "Shop");
    } catch (err) {
      setError("Failed to fetch data. Please go back and try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleFormChange = (e, formSetter) => {
    formSetter((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!newItem.name || !newItem.category || !newItem.price) {
      setFormError("Name, category, and price are required.");
      return;
    }

    try {
      const payload = {
        ...newItem,
        price: { perPiece: parseFloat(newItem.price) },
      };
      await axios.post(`/api/shops/${shopId}/items`, payload);
      setShowAddForm(false);
      setNewItem({
        name: "",
        description: "",
        category: "",
        price: "",
        imageUrl: "",
      });
      setSnack({
        open: true,
        msg: "Item added successfully!",
        severity: "success",
      });
      await fetchItems();
    } catch (err) {
      setFormError(err.response?.data?.error || "Failed to add item.");
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      try {
        await axios.delete(`/api/items/${itemId}`);
        setSnack({ open: true, msg: "Item deleted!", severity: "success" });
        await fetchItems();
      } catch (err) {
        setSnack({
          open: true,
          msg: "Failed to delete item.",
          severity: "error",
        });
      }
    }
  };

  const handleOpenEditModal = (item) => {
    // ** THE FIX IS HERE **
    // Ensure every field has a defined value (e.g., '') instead of undefined.
    setEditingItem({
      ...item,
      description: item.description || "", // Fallback to empty string
      imageUrl: item.imageUrl || "", // Fallback to empty string
      price: item.price?.perPiece || "",
    });
    setOpenEditModal(true);
  };

  const handleCloseEditModal = () => {
    setOpenEditModal(false);
    setEditingItem(null);
  };

  const handleUpdateItem = async (e) => {
    e.preventDefault();
    if (!editingItem) return;
    try {
      const payload = {
        name: editingItem.name,
        description: editingItem.description,
        category: editingItem.category,
        imageUrl: editingItem.imageUrl,
        price: { perPiece: parseFloat(editingItem.price) },
      };
      await axios.put(`/api/items/${editingItem._id}`, payload);
      handleCloseEditModal();
      setSnack({
        open: true,
        msg: "Item updated successfully!",
        severity: "success",
      });
      await fetchItems();
    } catch (err) {
      console.error("Failed to update item", err);
    }
  };

  return (
    <Box sx={{ bgcolor: "#f7f9fc", minHeight: "calc(100vh - 64px)", py: 4 }}>
      <Container maxWidth="lg">
        <Button component={RouterLink} to="/seller/dashboard" sx={{ mb: 2 }}>
          &larr; Back to My Shops
        </Button>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 4,
          }}
        >
          <Typography variant="h4" component="h1" fontWeight="bold">
            Manage Items for {shopName}
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddCircleOutlineIcon />}
            onClick={() => setShowAddForm(!showAddForm)}
            sx={{ bgcolor: "#2E7D32", "&:hover": { bgcolor: "#1B5E20" } }}
          >
            {showAddForm ? "Cancel" : "Add New Item"}
          </Button>
        </Box>

        {showAddForm && (
          <Paper sx={{ p: 3, mb: 4, borderRadius: "12px" }}>
            <Typography variant="h6" gutterBottom>
              New Item Details
            </Typography>
            <Box component="form" onSubmit={handleAddItem}>
              {formError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {formError}
                </Alert>
              )}
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="name"
                    fullWidth
                    label="Item Name"
                    value={newItem.name}
                    onChange={(e) => handleFormChange(e, setNewItem)}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="category"
                    fullWidth
                    label="Category"
                    value={newItem.category}
                    onChange={(e) => handleFormChange(e, setNewItem)}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="price"
                    type="number"
                    fullWidth
                    label="Price (per piece)"
                    value={newItem.price}
                    onChange={(e) => handleFormChange(e, setNewItem)}
                    required
                    inputProps={{ step: "0.01", min: "0" }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="imageUrl"
                    fullWidth
                    label="Image URL (Optional)"
                    value={newItem.imageUrl}
                    onChange={(e) => handleFormChange(e, setNewItem)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    name="description"
                    fullWidth
                    multiline
                    rows={3}
                    label="Description"
                    value={newItem.description}
                    onChange={(e) => handleFormChange(e, setNewItem)}
                  />
                </Grid>
              </Grid>
              <Button type="submit" variant="contained" sx={{ mt: 2 }}>
                Save Item
              </Button>
            </Box>
          </Paper>
        )}

        <Paper sx={{ p: 2, borderRadius: "12px" }}>
          {loading ? (
            <CircularProgress />
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : (
            <List>
              {items.length === 0 ? (
                <Typography sx={{ p: 2, textAlign: "center" }}>
                  No items found for this shop yet.
                </Typography>
              ) : (
                items.map((item, index) => (
                  <React.Fragment key={item._id}>
                    <ListItem
                      secondaryAction={
                        <Box>
                          <IconButton
                            edge="end"
                            aria-label="edit"
                            onClick={() => handleOpenEditModal(item)}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            edge="end"
                            aria-label="delete"
                            onClick={() => handleDeleteItem(item._id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      }
                    >
                      <ListItemText
                        primary={item.name}
                        secondary={`${item.category} - ₹${item.price?.perPiece}`}
                      />
                    </ListItem>
                    {index < items.length - 1 && <Divider />}
                  </React.Fragment>
                ))
              )}
            </List>
          )}
        </Paper>
      </Container>

      {/* Edit Item Modal */}
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
              Edit Item
            </Typography>
            {editingItem && (
              <Box component="form" onSubmit={handleUpdateItem} sx={{ mt: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      name="name"
                      fullWidth
                      label="Item Name"
                      value={editingItem.name}
                      onChange={(e) => handleFormChange(e, setEditingItem)}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      name="category"
                      fullWidth
                      label="Category"
                      value={editingItem.category}
                      onChange={(e) => handleFormChange(e, setEditingItem)}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      name="price"
                      type="number"
                      fullWidth
                      label="Price (per piece)"
                      value={editingItem.price}
                      onChange={(e) => handleFormChange(e, setEditingItem)}
                      required
                      inputProps={{ step: "0.01", min: "0" }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      name="imageUrl"
                      fullWidth
                      label="Image URL (Optional)"
                      value={editingItem.imageUrl}
                      onChange={(e) => handleFormChange(e, setEditingItem)}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      name="description"
                      fullWidth
                      multiline
                      rows={3}
                      label="Description"
                      value={editingItem.description}
                      onChange={(e) => handleFormChange(e, setEditingItem)}
                    />
                  </Grid>
                </Grid>
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
