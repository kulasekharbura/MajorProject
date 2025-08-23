// src/components/mainpage/ShopDetailsWrapper.jsx
import React from "react";
import { useParams } from "react-router-dom";
import ShopDetails from "../shops/ShopDetails";

export default function ShopDetailsWrapper() {
  const { id } = useParams();
  return <ShopDetails shopId={id} />;
}
