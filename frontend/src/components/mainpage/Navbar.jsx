// src/components/mainpage/Navbar.jsx
import React, { useContext, useEffect, useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Container from "@mui/material/Container";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import MenuIcon from "@mui/icons-material/Menu";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import Badge from "@mui/material/Badge";
import axios from "axios";

import LocationContext from "../../context/LocationContext";
import AuthContext from "../../context/AuthContext";

const pages = [{ title: "Categories", to: "/categories" }];

// helper: read cart count from localStorage
function readCartCountFromStorage() {
  try {
    const raw = localStorage.getItem("cart");
    if (!raw) return 0;
    const cart = JSON.parse(raw);
    return Array.isArray(cart)
      ? cart.reduce((s, it) => s + (Number(it.quantity) || 0), 0)
      : 0;
  } catch {
    return 0;
  }
}

export default function Navbar({ cartCount = 0 }) {
  const navigate = useNavigate();
  const { location: ctxLocation } = useContext(LocationContext);
  const { user, isAuthed, logout } = useContext(AuthContext);

  const queryParamLocation =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("location")
      : null;
  const queryLocation =
    ctxLocation || queryParamLocation || localStorage.getItem("location") || "";

  const [anchorElNav, setAnchorElNav] = useState(null);
  const [anchorElUser, setAnchorElUser] = useState(null);

  const [badgeCount, setBadgeCount] = useState(
    () => cartCount || readCartCountFromStorage()
  );

  useEffect(() => {
    let mounted = true;
    const fetchServerCart = async () => {
      if (!isAuthed) return;
      try {
        const res = await axios.get("/cart"); // axios should be configured with withCredentials
        if (!mounted) return;
        const cnt = res.data?.count ?? readCartCountFromStorage();
        setBadgeCount(cnt);
      } catch (err) {
        setBadgeCount(readCartCountFromStorage());
      }
    };
    fetchServerCart();
    return () => {
      mounted = false;
    };
  }, [isAuthed]);

  useEffect(() => {
    const handler = (e) => {
      const detailCount = e?.detail?.count;
      if (typeof detailCount === "number") {
        setBadgeCount(detailCount);
        return;
      }
      setBadgeCount(readCartCountFromStorage());
    };

    const storageHandler = (e) => {
      if (e.key === "cart") {
        setBadgeCount(readCartCountFromStorage());
      }
    };

    window.addEventListener("cartUpdated", handler);
    window.addEventListener("storage", storageHandler);
    setBadgeCount((prev) => prev || readCartCountFromStorage());

    return () => {
      window.removeEventListener("cartUpdated", handler);
      window.removeEventListener("storage", storageHandler);
    };
  }, [cartCount]);

  const handleOpenNavMenu = (event) => setAnchorElNav(event.currentTarget);
  const handleCloseNavMenu = () => setAnchorElNav(null);

  const handleOpenUserMenu = (event) => setAnchorElUser(event.currentTarget);
  const handleCloseUserMenu = () => setAnchorElUser(null);

  const handleChangeLocation = () => navigate("/");
  const handleCartClick = () => navigate("/cart");
  const handleProfile = () => {
    handleCloseUserMenu();
    navigate("/profile");
  };
  const handleLogin = () => {
    handleCloseUserMenu();
    navigate("/login");
  };
  const handleRegister = () => {
    handleCloseUserMenu();
    navigate("/register");
  };
  const handleLogout = async () => {
    handleCloseUserMenu();
    try {
      await logout();
      setBadgeCount(readCartCountFromStorage());
      navigate("/");
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  const userLabel = user ? user.realName || user.username || "User" : "";

  return (
    <AppBar position="sticky">
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          {/* Brand - desktop */}
          <Typography
            variant="h6"
            noWrap
            component={RouterLink}
            to="/home"
            sx={{
              mr: 2,
              display: { xs: "none", md: "flex" },
              fontWeight: 700,
              color: "inherit",
              textDecoration: "none",
            }}
          >
            AllInTown
          </Typography>

          {/* Hamburger - mobile */}
          <Box sx={{ flexGrow: 1, display: { xs: "flex", md: "none" } }}>
            <IconButton
              size="large"
              aria-label="open navigation menu"
              aria-controls="nav-menu"
              aria-haspopup="true"
              onClick={handleOpenNavMenu}
              color="inherit"
            >
              <MenuIcon />
            </IconButton>
            <Menu
              id="nav-menu"
              anchorEl={anchorElNav}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "left",
              }}
              keepMounted
              transformOrigin={{
                vertical: "top",
                horizontal: "left",
              }}
              open={Boolean(anchorElNav)}
              onClose={handleCloseNavMenu}
              sx={{ display: { xs: "block", md: "none" } }}
            >
              {pages.map((page) => (
                <MenuItem
                  key={page.title}
                  component={RouterLink}
                  to={page.to}
                  onClick={handleCloseNavMenu}
                >
                  <Typography textAlign="center">{page.title}</Typography>
                </MenuItem>
              ))}
            </Menu>
          </Box>

          {/* Brand - mobile */}
          <Typography
            variant="h6"
            noWrap
            component={RouterLink}
            to="/home"
            sx={{
              flexGrow: 1,
              display: { xs: "flex", md: "none" },
              fontWeight: 700,
              color: "inherit",
              textDecoration: "none",
            }}
          >
            AllInTown
          </Typography>

          {/* Desktop nav links */}
          <Box sx={{ flexGrow: 1, display: { xs: "none", md: "flex" } }}>
            {pages.map((page) => (
              <Button
                key={page.title}
                component={RouterLink}
                to={page.to}
                onClick={handleCloseNavMenu}
                sx={{ my: 2, color: "white", display: "block" }}
              >
                {page.title}
              </Button>
            ))}
          </Box>

          {/* Location button */}
          <Box sx={{ display: "flex", alignItems: "center", mr: 2 }}>
            <Tooltip title="Change location">
              <Button
                startIcon={<LocationOnIcon />}
                onClick={handleChangeLocation}
                sx={{ color: "inherit", textTransform: "none" }}
              >
                {queryLocation || "Choose location"}
              </Button>
            </Tooltip>
          </Box>

          {/* Cart */}
          <IconButton
            size="large"
            aria-label={`show ${badgeCount} items in cart`}
            color="inherit"
            onClick={handleCartClick}
            sx={{ mr: 1 }}
          >
            <Badge badgeContent={badgeCount} color="secondary">
              <ShoppingCartIcon />
            </Badge>
          </IconButton>

          {/* User avatar */}
          <Box sx={{ flexGrow: 0 }}>
            <Tooltip title={user ? "Open settings" : "Sign in / Register"}>
              <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                <Avatar alt={userLabel} src={user?.avatar || ""}>
                  {!userLabel ? "U" : userLabel.charAt(0).toUpperCase()}
                </Avatar>
              </IconButton>
            </Tooltip>

            <Menu
              sx={{ mt: "45px" }}
              id="user-menu"
              anchorEl={anchorElUser}
              anchorOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              keepMounted
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
            >
              {isAuthed
                ? [
                    <MenuItem key="profile" onClick={handleProfile}>
                      <Typography textAlign="center">Profile</Typography>
                    </MenuItem>,
                    <MenuItem key="logout" onClick={handleLogout}>
                      <Typography textAlign="center">Logout</Typography>
                    </MenuItem>,
                  ]
                : [
                    <MenuItem key="login" onClick={handleLogin}>
                      <Typography textAlign="center">Sign in</Typography>
                    </MenuItem>,
                    <MenuItem key="register" onClick={handleRegister}>
                      <Typography textAlign="center">Register</Typography>
                    </MenuItem>,
                  ]}
            </Menu>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
