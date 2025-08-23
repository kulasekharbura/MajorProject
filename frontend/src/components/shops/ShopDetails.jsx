// src/components/mainpage/ShopDetails.jsx
import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  IconButton,
  TextField,
  Snackbar,
  Alert,
  CircularProgress,
} from "@mui/material";
import { Grid } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";

import AuthContext from "../../context/AuthContext";

function readLocalCart() {
  try {
    const raw = localStorage.getItem("cart");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeLocalCart(cart) {
  try {
    localStorage.setItem("cart", JSON.stringify(cart));
    const count = cart.reduce((s, it) => s + (Number(it.quantity) || 0), 0);
    window.dispatchEvent(
      new CustomEvent("cartUpdated", { detail: { count, items: cart } })
    );
  } catch (e) {
    console.warn("writeLocalCart failed", e);
  }
}

export default function ShopDetails({ shopId }) {
  const { isAuthed, addToServerCart } = useContext(AuthContext);

  const [items, setItems] = useState([]);
  const [qtyMap, setQtyMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState({
    open: false,
    msg: "",
    severity: "success",
  });
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    if (!shopId) return;
    let mounted = true;
    setLoading(true);
    axios
      .get(`/shops/${shopId}/items`)
      .then((res) => {
        if (!mounted) return;
        const arr = res.data.items || [];
        setItems(arr);
        const q = {};
        arr.forEach((it) => (q[it._id] = 1));
        setQtyMap(q);
      })
      .catch((err) => {
        console.error("Failed to fetch shop items", err);
        setSnack({
          open: true,
          msg: "Failed to load items",
          severity: "error",
        });
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => (mounted = false);
  }, [shopId]);

  const changeQty = (itemId, delta) => {
    setQtyMap((m) => {
      const cur = Number(m[itemId] || 1);
      const next = Math.max(1, Math.min(999, cur + delta));
      return { ...m, [itemId]: next };
    });
  };

  const setQty = (itemId, value) => {
    const n = parseInt(value, 10);
    if (Number.isNaN(n)) return;
    setQtyMap((m) => ({ ...m, [itemId]: Math.max(1, Math.min(999, n)) }));
  };

  const addToLocalCart = (item, quantity) => {
    const cart = readLocalCart();
    const idx = cart.findIndex((c) => String(c.itemId) === String(item._id));
    if (idx >= 0) {
      cart[idx].quantity = Math.min(999, cart[idx].quantity + quantity);
    } else {
      cart.push({
        itemId: item._id,
        name: item.name,
        shopId: item.shop,
        shopName: item.shopName || undefined,
        price:
          item.price?.perPiece ??
          item.price?.perUnit ??
          item.price?.per100gm ??
          null,
        quantity,
      });
    }
    writeLocalCart(cart);
    setSnack({ open: true, msg: "Added to cart (guest)", severity: "success" });
  };

  const handleAddToCart = async (item) => {
    const quantity = Number(qtyMap[item._id] || 1);
    if (isAuthed) {
      setBusyId(item._id);
      await addToServerCart(item, quantity);
      setSnack({ open: true, msg: "Added to cart", severity: "success" });
      setBusyId(null);
    } else {
      addToLocalCart(item, quantity);
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h5" gutterBottom>
        Items
      </Typography>

      {loading ? (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : items.length === 0 ? (
        <Typography>No items available.</Typography>
      ) : (
        <Grid container spacing={2}>
          {items.map((it) => (
            <Grid key={it._id} xs={12} sm={6} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1">{it.name}</Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    {it.description}
                  </Typography>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => changeQty(it._id, -1)}
                      disabled={busyId === it._id}
                    >
                      <RemoveIcon fontSize="small" />
                    </IconButton>

                    <TextField
                      value={qtyMap[it._id] || 1}
                      onChange={(e) => setQty(it._id, e.target.value)}
                      size="small"
                      inputProps={{
                        inputMode: "numeric",
                        pattern: "[0-9]*",
                        style: { textAlign: "center" },
                      }}
                      sx={{ width: 72 }}
                      disabled={busyId === it._id}
                    />

                    <IconButton
                      size="small"
                      onClick={() => changeQty(it._id, 1)}
                      disabled={busyId === it._id}
                    >
                      <AddIcon fontSize="small" />
                    </IconButton>

                    <Box sx={{ flexGrow: 1 }} />
                    <Typography sx={{ mr: 1 }}>
                      ₹
                      {it.price?.perPiece ??
                        it.price?.perUnit ??
                        it.price?.per100gm ??
                        "—"}
                    </Typography>
                  </Box>
                </CardContent>

                <CardActions>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => handleAddToCart(it)}
                    disabled={busyId === it._id}
                  >
                    {busyId === it._id ? "Adding..." : "Add to cart"}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Snackbar
        open={snack.open}
        autoHideDuration={2400}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snack.severity}
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          variant="filled"
        >
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
