// src/components/cart/CartPage.jsx
import React, { useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  IconButton,
  Stack,
  TextField,
  Divider,
  Snackbar,
  Alert,
  CircularProgress,
  Paper,
  Container,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import RemoveIcon from "@mui/icons-material/Remove";
import AddIcon from "@mui/icons-material/Add";
import ShoppingCartCheckoutIcon from "@mui/icons-material/ShoppingCartCheckout";
import ProductionQuantityLimitsIcon from "@mui/icons-material/ProductionQuantityLimits";
import AuthContext from "../../context/AuthContext";

// helpers to read/write local cart
function readLocalCart() {
  try {
    const raw = localStorage.getItem("cart");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function writeLocalCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
  const count = cart.reduce((s, it) => s + (Number(it.quantity) || 0), 0);
  window.dispatchEvent(
    new CustomEvent("cartUpdated", { detail: { count, items: cart } })
  );
}

export default function CartPage() {
  const { isAuthed } = useContext(AuthContext);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({
    open: false,
    msg: "",
    severity: "success",
  });

  // Fetch cart data on mount based on auth state
  useEffect(() => {
    let mounted = true;
    const fetchCart = async () => {
      setLoading(true);
      try {
        if (isAuthed) {
          const res = await axios.get("/cart");
          if (mounted) setCart(res.data.cart || []);
        } else {
          if (mounted) setCart(readLocalCart());
        }
      } catch (err) {
        console.error("Failed to fetch cart", err);
        if (mounted)
          setToast({
            open: true,
            msg: "Failed to load cart",
            severity: "error",
          });
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchCart();
    return () => {
      mounted = false;
    };
  }, [isAuthed]);

  // Listen for external cart updates
  useEffect(() => {
    const handler = (e) => {
      const newItems = e?.detail?.items;
      if (Array.isArray(newItems)) {
        setCart(newItems);
      } else if (!isAuthed) {
        setCart(readLocalCart());
      }
    };

    window.addEventListener("cartUpdated", handler);
    if (!isAuthed) window.addEventListener("storage", handler);

    return () => {
      window.removeEventListener("cartUpdated", handler);
      if (!isAuthed) window.removeEventListener("storage", handler);
    };
  }, [isAuthed]);

  const total = useMemo(() => {
    return cart.reduce((sum, it) => {
      const p = Number(it.price) || 0;
      const q = Number(it.quantity) || 0;
      return sum + p * q;
    }, 0);
  }, [cart]);

  const changeQty = async (itemId, newQuantity) => {
    const n = Math.max(1, Math.min(999, newQuantity));
    const originalCart = [...cart];
    const newCart = cart.map((it) =>
      String(it.itemId) === String(itemId) ? { ...it, quantity: n } : it
    );
    setCart(newCart);

    if (isAuthed) {
      // TODO: Implement /cart/update-quantity endpoint
    } else {
      writeLocalCart(newCart);
    }
  };

  const removeItem = async (itemId) => {
    const originalCart = [...cart];
    const newCart = originalCart.filter(
      (it) => String(it.itemId) !== String(itemId)
    );
    setCart(newCart);

    if (isAuthed) {
      try {
        await axios.post("/cart/remove", { itemId });
        const count = newCart.reduce(
          (s, it) => s + (Number(it.quantity) || 0),
          0
        );
        window.dispatchEvent(
          new CustomEvent("cartUpdated", { detail: { count, items: newCart } })
        );
        setToast({ open: true, msg: "Item removed", severity: "success" });
      } catch (err) {
        console.error("Failed to remove item", err);
        setCart(originalCart);
        setToast({
          open: true,
          msg: "Failed to remove item",
          severity: "error",
        });
      }
    } else {
      writeLocalCart(newCart);
      setToast({ open: true, msg: "Item removed", severity: "success" });
    }
  };

  const clearCart = async () => {
    if (isAuthed) {
      try {
        await axios.post("/cart/clear");
        setCart([]);
        window.dispatchEvent(
          new CustomEvent("cartUpdated", { detail: { count: 0, items: [] } })
        );
        setToast({ open: true, msg: "Cart cleared", severity: "success" });
      } catch (err) {
        console.error("Failed to clear cart", err);
        setToast({
          open: true,
          msg: "Failed to clear cart",
          severity: "error",
        });
      }
    } else {
      writeLocalCart([]);
      setCart([]);
      setToast({ open: true, msg: "Cart cleared", severity: "success" });
    }
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      setToast({ open: true, msg: "Your cart is empty", severity: "warning" });
      return;
    }
    setToast({
      open: true,
      msg: `Checkout not implemented yet (total ₹${total})`,
      severity: "info",
    });
  };

  if (loading) {
    return (
      <Box sx={{ textAlign: "center", py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: "#f7f9fc", minHeight: "calc(100vh - 64px)" }}>
      <Container sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Shopping Cart
        </Typography>

        {cart.length === 0 ? (
          <Paper sx={{ textAlign: "center", p: 8, borderRadius: "12px" }}>
            <ProductionQuantityLimitsIcon
              sx={{ fontSize: 80, color: "grey.400" }}
            />
            <Typography variant="h6" sx={{ mt: 2 }}>
              Your cart is empty.
            </Typography>
            <Typography color="text.secondary">
              Looks like you haven't added anything to your cart yet.
            </Typography>
            <Button
              component={RouterLink}
              to="/home"
              variant="contained"
              sx={{ mt: 3 }}
            >
              Continue Shopping
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={4}>
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 2, borderRadius: "12px" }}>
                <Stack divider={<Divider />} spacing={2}>
                  {cart.map((it) => (
                    <Grid
                      container
                      key={it.itemId}
                      alignItems="center"
                      spacing={2}
                    >
                      <Grid item xs={3} sm={2}>
                        <Box
                          component="img"
                          src="https://via.placeholder.com/150"
                          alt={it.name}
                          sx={{ width: "100%", borderRadius: "8px" }}
                        />
                      </Grid>
                      <Grid item xs={9} sm={4}>
                        <Typography fontWeight="medium">{it.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {it.shopName}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <IconButton
                            size="small"
                            onClick={() =>
                              changeQty(it.itemId, it.quantity - 1)
                            }
                          >
                            <RemoveIcon fontSize="small" />
                          </IconButton>
                          <TextField
                            value={it.quantity}
                            onChange={(e) =>
                              changeQty(it.itemId, e.target.value)
                            }
                            size="small"
                            sx={{ width: 55 }}
                            inputProps={{ style: { textAlign: "center" } }}
                          />
                          <IconButton
                            size="small"
                            onClick={() =>
                              changeQty(it.itemId, it.quantity + 1)
                            }
                          >
                            <AddIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Grid>
                      <Grid item xs={4} sm={2} sx={{ textAlign: "right" }}>
                        <Typography fontWeight="medium">
                          ₹{(it.price || 0) * it.quantity}
                        </Typography>
                      </Grid>
                      <Grid item xs={2} sm={1} sx={{ textAlign: "right" }}>
                        <IconButton
                          aria-label="remove"
                          onClick={() => removeItem(it.itemId)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Grid>
                    </Grid>
                  ))}
                </Stack>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ borderRadius: "12px", boxShadow: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Order Summary
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  <Stack spacing={1} sx={{ my: 2 }}>
                    <Box
                      sx={{ display: "flex", justifyContent: "space-between" }}
                    >
                      <Typography color="text.secondary">Subtotal</Typography>
                      <Typography>₹{total}</Typography>
                    </Box>
                    <Box
                      sx={{ display: "flex", justifyContent: "space-between" }}
                    >
                      <Typography color="text.secondary">Shipping</Typography>
                      <Typography>Free</Typography>
                    </Box>
                  </Stack>
                  <Divider sx={{ my: 1 }} />
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      my: 2,
                    }}
                  >
                    <Typography variant="h6" fontWeight="bold">
                      Total
                    </Typography>
                    <Typography variant="h6" fontWeight="bold">
                      ₹{total}
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    onClick={handleCheckout}
                    fullWidth
                    size="large"
                    startIcon={<ShoppingCartCheckoutIcon />}
                    sx={{
                      bgcolor: "#2E7D32",
                      "&:hover": { bgcolor: "#1B5E20" },
                    }}
                  >
                    Proceed to Checkout
                  </Button>
                  <Button
                    variant="text"
                    onClick={clearCart}
                    fullWidth
                    sx={{ mt: 1 }}
                  >
                    Clear Cart
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Container>
      <Snackbar
        open={toast.open}
        autoHideDuration={2200}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={toast.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {toast.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
