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
  Container,
  Paper,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import LocationContext from "../../context/LocationContext";

export default function CategoriesPage() {
  const navigate = useNavigate();
  const { location: ctxLocation, setLocation: setCtxLocation } =
    useContext(LocationContext);
  const [searchParams] = useSearchParams();
  const paramLocation = searchParams.get("location") || "";

  const effectiveLocation =
    ctxLocation || paramLocation || localStorage.getItem("location") || "";

  const [grouped, setGrouped] = React.useState({});
  const [categories, setCategories] = React.useState([]);
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

        const map = shops.reduce((acc, shop) => {
          const cat = (shop.category || "Uncategorized").trim();
          if (!acc[cat]) acc[cat] = [];
          acc[cat].push(shop);
          return acc;
        }, {});

        const cats = Object.keys(map).sort((a, b) =>
          a.localeCompare(b, undefined, { sensitivity: "base" })
        );

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

  if (loading)
    return (
      <Box sx={{ textAlign: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );

  return (
    <Box sx={{ bgcolor: "#f7f9fc", minHeight: "calc(100vh - 64px)" }}>
      <Container sx={{ py: 4 }}>
        <Paper elevation={2} sx={{ p: { xs: 2, md: 4 }, borderRadius: "12px" }}>
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            fontWeight="bold"
          >
            Categories in {effectiveLocation}
          </Typography>

          {!effectiveLocation ? (
            <Typography>Please select a location first.</Typography>
          ) : error ? (
            <Typography color="error">{error}</Typography>
          ) : categories.length === 0 ? (
            <Typography>
              No shops or categories found in {effectiveLocation}.
            </Typography>
          ) : (
            categories.map((cat, index) => (
              <Accordion
                key={cat}
                defaultExpanded={index === 0} // Expand the first category by default
                elevation={0}
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  "&:not(:last-child)": {
                    borderBottom: 0,
                  },
                  "&:before": {
                    display: "none",
                  },
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  sx={{
                    backgroundColor: "action.hover",
                    borderTopLeftRadius: "inherit",
                    borderTopRightRadius: "inherit",
                  }}
                >
                  <Typography sx={{ fontWeight: 600 }}>{cat}</Typography>
                  <Typography sx={{ ml: 2, color: "text.secondary" }}>
                    ({(grouped[cat] || []).length} shops)
                  </Typography>
                </AccordionSummary>

                <AccordionDetails sx={{ p: 2 }}>
                  <Grid container spacing={3}>
                    {(grouped[cat] || []).map((shop) => (
                      <Grid item key={shop._id} xs={12} sm={6} md={4}>
                        <Card
                          sx={{
                            height: "100%",
                            borderRadius: "12px",
                            transition: "transform 0.2s",
                            "&:hover": { transform: "scale(1.03)" },
                          }}
                        >
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
                              <Typography
                                variant="h6"
                                component="div"
                                fontWeight="medium"
                              >
                                {shop.name}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
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
            ))
          )}
        </Paper>
      </Container>
    </Box>
  );
}
