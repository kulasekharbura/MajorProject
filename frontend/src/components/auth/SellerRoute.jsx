// src/components/auth/SellerRoute.jsx
import React, { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import AuthContext from "../../context/AuthContext";
import { Box, CircularProgress, Typography } from "@mui/material";

export default function SellerRoute() {
  const { user, loading } = useContext(AuthContext);

  // 1. Show a loading spinner while we check the user's auth status.
  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  // 2. If the user is not logged in, redirect them to the login page.
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 3. If the user is logged in but their role is NOT 'seller', show an access denied message.
  if (user.role !== "seller") {
    return (
      <Box sx={{ textAlign: "center", mt: 4 }}>
        <Typography variant="h5" color="error">
          Access Denied
        </Typography>
        <Typography>You do not have permission to view this page.</Typography>
      </Box>
    );
  }

  // 4. If the user is logged in AND their role is 'seller', show the requested page.
  // The <Outlet /> component from React Router renders the actual child route (e.g., the SellerDashboard).
  return <Outlet />;
}
