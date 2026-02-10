import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { NotificationPopup } from "./NotificationPopup";

// Session-based cache to avoid redundant getMe() calls on every route change
let lastVerifiedToken: string | null = null;
let lastVerifiedTime: number = 0;
const AUTH_VERIFY_TTL = 30000; // 30 seconds

export const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token');

      if (!token) {
        navigate("/auth");
        return;
      }

      // Skip API call if we verified this token recently
      if (token === lastVerifiedToken && (Date.now() - lastVerifiedTime) < AUTH_VERIFY_TTL) {
        setLoading(false);
        return;
      }

      try {
        await api.auth.getMe();
        lastVerifiedToken = token;
        lastVerifiedTime = Date.now();
        setLoading(false);
      } catch (error) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        lastVerifiedToken = null;
        navigate("/auth");
      }
    };

    checkAuth();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <>
      <NotificationPopup />
      {children}
    </>
  );
};
