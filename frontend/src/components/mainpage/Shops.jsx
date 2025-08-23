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
} from "@mui/material";
import LocationContext from "../../context/LocationContext";

export default function ShopsPage() {
  const navigate = useNavigate();
  const { location: ctxLocation, setLocation: setCtxLocation } =
    useContext(LocationContext);

  const [searchParams] = useSearchParams();
  const paramLocation = searchParams.get("location") || "";

  // effectiveLocation: prefer context, then query param, then localStorage
  const effectiveLocation =
    ctxLocation || paramLocation || localStorage.getItem("location") || "";

  const [shops, setShops] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  // sync context if a query param is present but context is empty/different
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
    // keep location in URL so the details page can know current city
    const qs = effectiveLocation
      ? `?location=${encodeURIComponent(effectiveLocation)}`
      : "";
    navigate(`/shop/${shopId}${qs}`);
  };

  if (!effectiveLocation) return <div>Please select a location first.</div>;
  if (loading)
    return (
      <div style={{ textAlign: "center" }}>
        <CircularProgress />
      </div>
    );
  if (error) return <div style={{ color: "red" }}>{error}</div>;

  return (
    <div>
      <Typography variant="h5" gutterBottom>
        Shops in {effectiveLocation}
      </Typography>

      {shops.length === 0 ? (
        <Typography>No shops found in this location.</Typography>
      ) : (
        <Grid container spacing={2} columns={12}>
          {shops.map((shop) => (
            <Grid key={shop._id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card sx={{ height: "100%" }}>
                <CardActionArea onClick={() => handleOpenShop(shop._id)}>
                  {shop.imageUrl && (
                    <CardMedia
                      component="img"
                      height="140"
                      image={shop.imageUrl}
                      alt={shop.name}
                    />
                  )}
                  <CardContent>
                    <Typography variant="h6">{shop.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {shop.category}
                    </Typography>
                    <Typography variant="caption" display="block">
                      {shop.locationName}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </div>
  );
}
