import React from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  IconButton,
  Stack,
  TextField,
  Divider,
  Snackbar,
  Alert,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import RemoveIcon from "@mui/icons-material/Remove";
import AddIcon from "@mui/icons-material/Add";

/**
 * Cart format (stored in localStorage under "cart"):
 * [
 *   { itemId, name, shopId, price (number|null), quantity }
 * ]
 */

// helpers to read/write cart and emit update event
function readCart() {
  try {
    const raw = localStorage.getItem("cart");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function writeCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
  const count = cart.reduce((s, it) => s + (Number(it.quantity) || 0), 0);
  window.dispatchEvent(new CustomEvent("cartUpdated", { detail: { count } }));
}

export default function CartPage() {
  const [cart, setCart] = React.useState(() => readCart());
  const [toast, setToast] = React.useState({
    open: false,
    msg: "",
    severity: "success",
  });

  // recompute totals whenever cart changes
  const total = React.useMemo(() => {
    return cart.reduce((sum, it) => {
      const p = Number(it.price) || 0;
      const q = Number(it.quantity) || 0;
      return sum + p * q;
    }, 0);
  }, [cart]);

  // sync state -> localStorage & dispatch event
  const persist = (newCart, message) => {
    setCart(newCart);
    writeCart(newCart);
    if (message) {
      setToast({ open: true, msg: message, severity: "success" });
    }
  };

  const changeQty = (itemId, delta) => {
    const newCart = cart.map((it) =>
      String(it.itemId) === String(itemId)
        ? {
            ...it,
            quantity: Math.max(
              1,
              Math.min(999, Number(it.quantity || 1) + delta)
            ),
          }
        : it
    );
    persist(newCart, "Quantity updated");
  };

  const setQty = (itemId, value) => {
    const n = parseInt(value, 10);
    if (Number.isNaN(n)) return;
    const newCart = cart.map((it) =>
      String(it.itemId) === String(itemId)
        ? { ...it, quantity: Math.max(1, Math.min(999, n)) }
        : it
    );
    persist(newCart, "Quantity updated");
  };

  const removeItem = (itemId) => {
    const newCart = cart.filter((it) => String(it.itemId) !== String(itemId));
    persist(newCart, "Item removed");
  };

  const clearCart = () => {
    persist([], "Cart cleared");
  };

  const handleCheckout = () => {
    // placeholder — you may implement sign-in / order creation later
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

  // listen to external cartUpdated events (e.g., from ShopDetails)
  React.useEffect(() => {
    const handler = () => setCart(readCart());
    window.addEventListener("cartUpdated", handler);
    window.addEventListener("storage", handler); // cross-tab sync
    return () => {
      window.removeEventListener("cartUpdated", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto", p: 2 }}>
      <Typography variant="h5" gutterBottom>
        Your Cart
      </Typography>

      {cart.length === 0 ? (
        <Box sx={{ mt: 4 }}>
          <Typography>Your cart is empty.</Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <Stack spacing={2}>
              {cart.map((it) => (
                <Card key={it.itemId}>
                  <CardContent
                    sx={{ display: "flex", alignItems: "center", gap: 2 }}
                  >
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle1">{it.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {it.shopName ? it.shopName : `Shop: ${it.shopId}`}
                      </Typography>
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <IconButton
                        size="small"
                        aria-label="decrease"
                        onClick={() => changeQty(it.itemId, -1)}
                      >
                        <RemoveIcon fontSize="small" />
                      </IconButton>

                      <TextField
                        value={it.quantity}
                        onChange={(e) => setQty(it.itemId, e.target.value)}
                        size="small"
                        sx={{ width: 72 }}
                        inputProps={{
                          inputMode: "numeric",
                          pattern: "[0-9]*",
                          min: 1,
                        }}
                        aria-label="quantity"
                      />

                      <IconButton
                        size="small"
                        aria-label="increase"
                        onClick={() => changeQty(it.itemId, 1)}
                      >
                        <AddIcon fontSize="small" />
                      </IconButton>
                    </Box>

                    <Box sx={{ width: 120, textAlign: "right" }}>
                      <Typography variant="body1">
                        ₹{(Number(it.price) || 0) * (Number(it.quantity) || 0)}
                      </Typography>
                      <Typography
                        variant="caption"
                        display="block"
                        color="text.secondary"
                      >
                        {it.price != null
                          ? `₹${it.price} each`
                          : "Price not set"}
                      </Typography>
                    </Box>

                    <CardActions>
                      <IconButton
                        aria-label="remove"
                        onClick={() => removeItem(it.itemId)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </CardActions>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1">Order summary</Typography>
                <Divider sx={{ my: 1 }} />
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 0.5,
                  }}
                >
                  <Typography variant="body2">Items</Typography>
                  <Typography variant="body2">{cart.length}</Typography>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography variant="body2">Total</Typography>
                  <Typography variant="body2">₹{total}</Typography>
                </Box>

                <Stack spacing={1} sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    onClick={handleCheckout}
                    fullWidth
                  >
                    Checkout
                  </Button>
                  <Button
                    variant="outlined"
                    color="inherit"
                    onClick={clearCart}
                    fullWidth
                  >
                    Clear cart
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Snackbar
        open={toast.open}
        autoHideDuration={2200}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={toast.severity} variant="filled">
          {toast.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
