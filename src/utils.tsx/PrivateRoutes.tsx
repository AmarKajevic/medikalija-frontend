import { Navigate } from "react-router"
import { useAuth } from "../context/AuthContext"
import { ReactNode } from "react";

interface AuthProviderProps {
  children: ReactNode;
}

const PrivateRoutes =({children}: AuthProviderProps) => {
 const{user} = useAuth()


    return user ? children : <Navigate to="/signin"/>
 
}
export default PrivateRoutes