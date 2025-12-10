// src/context/AuthContext.tsx
import React, {
    createContext,
    useContext,
    useState,
    useEffect
  } from "react";
  import { getToken, setToken, clearToken } from "../utils/auth";
  
  // User tipini burada tanımlayalım
  interface User {
    _id: string;
    name: string;
    email: string;
  }
  
  // Context'in dışarıya vereceği şeyler
  interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    loginUser: (user: User, token: string) => void;
    logout: () => void;
  }
  
  // Context'in kendisi
  const AuthContext = createContext<AuthContextType | undefined>(undefined);
  
  // Provider bileşeni
  export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
  
    // Sayfa yenilenince token + user bilgisini localStorage'dan oku
    useEffect(() => {
      const token = getToken();
      if (token) {
        setIsAuthenticated(true);
  
        const storedUser = localStorage.getItem("auth_user");
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      }
      setIsLoading(false);
    }, []);
  
    // Login olduğunda çağıracağımız fonksiyon
    const loginUser = (userData: User, token: string) => {
      setToken(token); // localStorage'a token yaz
      localStorage.setItem("auth_user", JSON.stringify(userData)); // user'ı da kaydet
      setUser(userData);
      setIsAuthenticated(true);
    };
  
    // Logout fonksiyonu
    const logout = () => {
      clearToken();
      localStorage.removeItem("auth_user");
      setUser(null);
      setIsAuthenticated(false);
    };
  
    return (
      <AuthContext.Provider
        value={{ user, isAuthenticated, isLoading, loginUser, logout }}
      >
        {children}
      </AuthContext.Provider>
    );
  };
  
  // useAuth hook'u
  export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) {
      throw new Error("useAuth must be used inside AuthProvider");
    }
    return ctx;
  }