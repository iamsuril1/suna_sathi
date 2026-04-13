import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PublicRoute = ({ children }) => {
  const { user } = useAuth();

  if (user) {
    return user.role === "admin"
      ? <Navigate to="/admin" replace />
      : <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default PublicRoute;
