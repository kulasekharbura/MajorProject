// src/components/auth/PrivateRoute.jsx
import React, { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import AuthContext from "../../context/AuthContext";
import { Box, CircularProgress } from "@mui/material";

export default function PrivateRoute() {
  const { isAuthed, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return isAuthed ? <Outlet /> : <Navigate to="/login" replace />;
}
