import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "../App";

const AuthCallback = () => {
  const navigate = useNavigate();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Use useRef for the processed flag to prevent race conditions under StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      try {
        // Extract session_id from URL fragment
        const hash = window.location.hash;
        const params = new URLSearchParams(hash.substring(1));
        const sessionId = params.get("session_id");

        if (!sessionId) {
          console.error("No session_id found in URL");
          navigate("/", { replace: true });
          return;
        }

        // Exchange session_id for session_token
        const response = await axios.post(
          `${API}/auth/session`,
          { session_id: sessionId },
          { withCredentials: true }
        );

        const { user } = response.data;

        // Clear URL fragment
        window.history.replaceState(null, "", window.location.pathname);

        // Navigate based on role
        if (user.role === "admin") {
          navigate("/admin", { replace: true, state: { user } });
        } else {
          navigate("/dashboard", { replace: true, state: { user } });
        }
      } catch (error) {
        console.error("Auth callback error:", error);
        navigate("/", { replace: true });
      }
    };

    processAuth();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full spinner mx-auto mb-4"></div>
        <p className="text-slate-600 font-medium">Signing you in...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
