// src/context/AuthContext.jsx
import React, { createContext, useEffect, useMemo, useState } from "react";
import axios from "axios";

const AuthContext = createContext({
  user: null,
  isAuthed: false,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  refreshMe: async () => {},
});

axios.defaults.withCredentials = true;
axios.defaults.baseURL =
  import.meta.env.VITE_API_URL || "http://localhost:8080";

function readLocalCart() {
  try {
    const raw = localStorage.getItem("cart");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function clearLocalCart() {
  try {
    localStorage.removeItem("cart");
  } catch {}
}
function localCartCount() {
  try {
    const c = readLocalCart();
    return Array.isArray(c)
      ? c.reduce((s, it) => s + (Number(it.quantity) || 0), 0)
      : 0;
  } catch {
    return 0;
  }
}

// Dispatch cartUpdated with count + items
function dispatchCart(cartData) {
  window.dispatchEvent(
    new CustomEvent("cartUpdated", {
      detail: cartData,
    })
  );
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const getServerCart = async () => {
    try {
      const res = await axios.get("/cart");
      return res.data || { count: 0, items: [] };
    } catch {
      return { count: 0, items: [] };
    }
  };

  // Merge localStorage cart into server cart
  const mergeLocalCart = async () => {
    const localCart = readLocalCart();
    if (!Array.isArray(localCart) || localCart.length === 0) return;

    try {
      const res = await axios.post("/cart/merge", { items: localCart });
      clearLocalCart();
      const cartData = {
        count: res.data?.count ?? (await getServerCart()).count,
        items: res.data?.items ?? (await getServerCart()).items,
      };
      dispatchCart(cartData);
      return;
    } catch {
      // fallback: add items one by one
      try {
        await Promise.all(
          localCart.map((it) =>
            axios
              .post("/cart/add", {
                itemId: it.itemId,
                quantity: it.quantity || 1,
              })
              .catch(() => {})
          )
        );
        clearLocalCart();
        const res2 = await getServerCart();
        dispatchCart(res2);
        return;
      } catch (e) {
        console.warn("Cart merge fallback failed", e);
      }
    }
  };

  const addToServerCart = async (item, quantity) => {
    try {
      await axios.post("/cart/add", { itemId: item._id, quantity });
      const cartData = await getServerCart();
      dispatchCart(cartData);
    } catch (err) {
      if (err.response?.status === 401) {
        console.warn("User not authed; cannot add to server cart.");
      } else {
        console.error("Failed to add to cart", err);
      }
    }
  };

  const login = async (emailOrUsername, password) => {
    const res = await axios.post("/auth/login", { emailOrUsername, password });
    setUser(res.data.user);
    await mergeLocalCart();
    return res.data;
  };

  const register = async ({
    username,
    realName,
    email,
    password,
    role = "consumer",
    locationName,
  }) => {
    const res = await axios.post("/auth/register", {
      username,
      realName,
      email,
      password,
      role,
      locationName,
    });
    setUser(res.data.user);
    await mergeLocalCart();
    return res.data;
  };

  const logout = async () => {
    try {
      await axios.post("/auth/logout");
    } catch {}
    setUser(null);
    dispatchCart({ count: localCartCount(), items: readLocalCart() });
  };

  const refreshMe = async () => {
    try {
      const res = await axios.get("/auth/me");
      setUser(res.data.user || null);
      return res.data.user || null;
    } catch {
      setUser(null);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const res = await axios.get("/auth/me");
        if (!mounted) return;
        setUser(res.data.user || null);

        if (res.data.user) {
          const cartData = await getServerCart();
          dispatchCart(cartData);
        } else {
          dispatchCart({ count: localCartCount(), items: readLocalCart() });
        }
      } catch {
        dispatchCart({ count: localCartCount(), items: readLocalCart() });
        setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    const onStorage = (e) => {
      if (e.key === "cart") {
        dispatchCart({ count: localCartCount(), items: readLocalCart() });
      }
    };
    window.addEventListener("storage", onStorage);

    return () => {
      mounted = false;
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthed: !!user,
      loading,
      login,
      register,
      logout,
      refreshMe,
      addToServerCart,
      mergeLocalCart,
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContext;
