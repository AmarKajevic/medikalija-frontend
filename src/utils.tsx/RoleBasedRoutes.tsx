import { ReactNode } from "react";
import { Navigate } from "react-router"; // treba react-router-dom, ne react-router
import { useAuth } from "../context/AuthContext";

interface RoleBaseRoutesProps {
  children: ReactNode;
  requiredRole?: any; // npr. ["owner", "head-nurse", "nurse"]
}

function RoleBaseRoutes({ children, requiredRole = [] }: RoleBaseRoutesProps) {
  const { user } = useAuth();


  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  // ✅ user.role je niz, pa moramo da proverimo da li se bar jedna uloga poklapa
  if (requiredRole.length > 0 && !requiredRole.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}

export default RoleBaseRoutes;
