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

  // We don't want navbar on the "/" route (location selection page)
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
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;
