import { Navigate, Outlet } from "react-router-dom";
import { getStoredToken } from "../services/auth.service.js";

export default function ProtectedRoute() {
  const token = getStoredToken();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
