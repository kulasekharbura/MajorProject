// src/components/mainpage/CategoriesPage.jsx
import React, { useContext } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Typography,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Box,
  CardActionArea,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import LocationContext from "../../context/LocationContext";

export default function CategoriesPage() {
  const navigate = useNavigate();
  const { location: ctxLocation, setLocation: setCtxLocation } =
    useContext(LocationContext);
  const [searchParams] = useSearchParams();
  const paramLocation = searchParams.get("location") || "";

  // effectiveLocation: prefer context, then query param, then localStorage
  const effectiveLocation =
    ctxLocation || paramLocation || localStorage.getItem("location") || "";

  const [grouped, setGrouped] = React.useState({}); // { category: [shop,...] }
  const [categories, setCategories] = React.useState([]); // sorted category names
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
      setGrouped({});
      setCategories([]);
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
        const shops = res.data.shops || [];

        // group by category (normalize empty categories)
        const map = shops.reduce((acc, shop) => {
          const cat = (shop.category || "Uncategorized").trim();
          if (!acc[cat]) acc[cat] = [];
          acc[cat].push(shop);
          return acc;
        }, {});

        // sort category names lexicographically (case-insensitive)
        const cats = Object.keys(map).sort((a, b) =>
          a.localeCompare(b, undefined, { sensitivity: "base" })
        );

        // sort shops inside each category by name lexicographically
        cats.forEach((cat) => {
          map[cat].sort((s1, s2) =>
            (s1.name || "").localeCompare(s2.name || "", undefined, {
              sensitivity: "base",
            })
          );
        });

        setGrouped(map);
        setCategories(cats);
      })
      .catch((err) => {
        console.error("Failed to fetch shops for categories", err);
        if (!mounted) return;
        setError("Failed to load categories");
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [effectiveLocation]);

  const openShop = (shopId) => {
    const qs = effectiveLocation
      ? `?location=${encodeURIComponent(effectiveLocation)}`
      : "";
    navigate(`/shop/${shopId}${qs}`);
  };

  if (!effectiveLocation)
    return <Typography>Please select a location first.</Typography>;
  if (loading)
    return (
      <Box sx={{ textAlign: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  if (error) return <Typography color="error">{error}</Typography>;
  if (categories.length === 0)
    return (
      <Typography>No shops/categories found in {effectiveLocation}.</Typography>
    );

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Categories — {effectiveLocation}
      </Typography>

      {categories.map((cat) => (
        <Accordion key={cat} defaultExpanded={false} sx={{ mb: 1 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography sx={{ fontWeight: 600 }}>{cat}</Typography>
            <Typography sx={{ ml: 2, color: "text.secondary" }}>
              ({(grouped[cat] || []).length} shops)
            </Typography>
          </AccordionSummary>

          <AccordionDetails>
            <Grid container spacing={2} columns={12}>
              {(grouped[cat] || []).map((shop) => (
                <Grid key={shop._id} size={{ xs: 12, sm: 6, md: 4 }}>
                  <Card sx={{ height: "100%" }}>
                    <CardActionArea onClick={() => openShop(shop._id)}>
                      {shop.imageUrl && (
                        <CardMedia
                          component="img"
                          height="140"
                          image={shop.imageUrl}
                          alt={shop.name}
                        />
                      )}
                      <CardContent>
                        <Typography variant="subtitle1">{shop.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {shop.locationName}
                        </Typography>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
}
