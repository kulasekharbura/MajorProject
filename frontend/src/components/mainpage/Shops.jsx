// src/components/mainpage/Shops.jsx
import React, { useContext } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  CardMedia,
  CardActionArea,
  Box,
} from "@mui/material";
import LocationContext from "../../context/LocationContext";

export default function ShopsPage() {
  const navigate = useNavigate();
  const { location: ctxLocation, setLocation: setCtxLocation } =
    useContext(LocationContext);

  const [searchParams] = useSearchParams();
  const paramLocation = searchParams.get("location") || "";

  const effectiveLocation =
    ctxLocation || paramLocation || localStorage.getItem("location") || "";

  const [shops, setShops] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    if (paramLocation && ctxLocation !== paramLocation) {
      setCtxLocation(paramLocation);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramLocation]);

  React.useEffect(() => {
    if (!effectiveLocation) {
      setShops([]);
      return;
    }

    let mounted = true;
    setLoading(true);
    setError(null);

    axios
      .get("http://localhost:8080/home", {
        params: { location: effectiveLocation },
      })
      .then((res) => {
        if (!mounted) return;
        setShops(res.data.shops || []);
      })
      .catch((err) => {
        console.error("Failed to fetch shops", err);
        if (!mounted) return;
        setError("Failed to load shops");
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [effectiveLocation]);

  const handleOpenShop = (shopId) => {
    const qs = effectiveLocation
      ? `?location=${encodeURIComponent(effectiveLocation)}`
      : "";
    navigate(`/shop/${shopId}${qs}`);
  };

  if (!effectiveLocation)
    return <Typography>Please select a location first.</Typography>;
  if (loading)
    return (
      <Box sx={{ textAlign: "center" }}>
        <CircularProgress />
      </Box>
    );
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Box>
      <Typography variant="h4" component="h2" gutterBottom fontWeight="bold">
        Shops in {effectiveLocation}
      </Typography>

      {shops.length === 0 ? (
        <Typography>No shops found in this location.</Typography>
      ) : (
        <Grid container spacing={3}>
          {shops.map((shop) => (
            <Grid item key={shop._id} xs={12} sm={6} md={4}>
              <Card
                sx={{
                  height: "100%",
                  borderRadius: "12px",
                  transition: "transform 0.2s",
                  "&:hover": { transform: "scale(1.03)" },
                }}
              >
                <CardActionArea onClick={() => handleOpenShop(shop._id)}>
                  {shop.imageUrl ? (
                    <CardMedia
                      component="img"
                      height="140"
                      image={shop.imageUrl}
                      alt={shop.name}
                    />
                  ) : (
                    <Box sx={{ height: 140, backgroundColor: "grey.200" }} />
                  )}
                  <CardContent>
                    <Typography
                      variant="h6"
                      component="div"
                      fontWeight="medium"
                    >
                      {shop.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {shop.category}
                    </Typography>
                    <Typography
                      variant="caption"
                      display="block"
                      color="text.secondary"
                      mt={1}
                    >
                      {shop.locationName}
                    </Typography>
                    {/* Display Owner Name and Email */}
                    {shop.owner && (
                      <Box sx={{ mt: 2, pt: 1, borderTop: "1px solid #eee" }}>
                        <Typography variant="caption" color="text.secondary">
                          Owner: {shop.owner.realName}
                        </Typography>
                        <Typography
                          variant="caption"
                          display="block"
                          color="text.secondary"
                        >
                          Contact: {shop.owner.email}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
