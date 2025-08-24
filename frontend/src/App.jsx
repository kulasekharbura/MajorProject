import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import FormSelect from "./components/Location/form";
import HomePage from "./components/mainpage/HomePage";
import CategoriesPage from "./components/mainpage/CategoriesPage";
import Navbar from "./components/mainpage/Navbar";
import { LocationProvider } from "./context/LocationContext";
import { AuthProvider } from "./context/AuthContext";
import ShopDetailsWrapper from "./components/mainpage/ShopDetailsWrapper";
import CartPage from "./components/cart/CartPage";
import LoginPage from "./components/auth/LoginPage";
import RegisterPage from "./components/auth/RegisterPage";
import NotFound from "./components/mainpage/NotFound";
import SellerDashboard from "./components/seller/SellerDashboard";
import ManageItemsPage from "./components/seller/ManageItemsPage";
import SellerRoute from "./components/auth/SellerRoute";
import PrivateRoute from "./components/auth/PrivateRoute";
import ProfilePage from "./components/profile/ProfilePage";
import SellerOrdersPage from "./components/seller/SellerOrdersPage";
import CheckoutPage from "./components/checkout/CheckoutPage";
import OrderSuccessPage from "./components/checkout/OrderSuccessPage";
import SellerOrderDetailsPage from "./components/seller/SellerOrderDetailsPage"; // 1. Import the details page

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LocationProvider>
          <MainLayout />
        </LocationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
// This wrapper decides whether to show Navbar
function MainLayout() {
  const location = useLocation();

  const hideNavbar = location.pathname === "/";

  return (
    <>
      {!hideNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<FormSelect />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/shop/:id" element={<ShopDetailsWrapper />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Seller Routes */}
        <Route element={<SellerRoute />}>
          <Route path="/seller/dashboard" element={<SellerDashboard />} />
          <Route
            path="/seller/shop/:shopId/items"
            element={<ManageItemsPage />}
          />
          <Route path="/seller/orders" element={<SellerOrdersPage />} />
          {/* 2. Add the route for a single order's details */}
          <Route
            path="/seller/orders/:orderId"
            element={<SellerOrderDetailsPage />}
          />
        </Route>

        {/* Private User Routes */}
        <Route element={<PrivateRoute />}>
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route
            path="/order-success/:orderCode"
            element={<OrderSuccessPage />}
          />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;
