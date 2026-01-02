import React, { useEffect, useRef, useState } from "react";
import { LogIn, LogOut, User, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getMe } from "../lib/api";
import { AUTH_CHANGE_EVENT, AUTH_TOKEN_KEY, clearAuthToken } from "../lib/auth";

const UserProfileMenu = () => {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const [token, setToken] = useState(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(AUTH_TOKEN_KEY);
  });
  const [profile, setProfile] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const isAuthenticated = Boolean(token);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const handleAuthChange = () => {
      setToken(localStorage.getItem(AUTH_TOKEN_KEY));
    };
    window.addEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
    return () => window.removeEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;
    if (typeof document === "undefined") return undefined;
    const handleClickOutside = (event) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (!token) {
      setProfile(null);
      setError("");
      setIsLoading(false);
      return undefined;
    }

    let isActive = true;
    setIsLoading(true);
    setError("");

    (async () => {
      try {
        const data = await getMe(token);
        if (!isActive) return;
        setProfile({
          name: data.name || "",
          email: data.email || "",
          phoneNumber: data.phoneNumber || "",
        });
      } catch (err) {
        if (!isActive) return;
        if (err.status === 401) {
          clearAuthToken();
          setToken(null);
        }
        setProfile(null);
        setError(err.message || "Unable to load profile.");
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      isActive = false;
    };
  }, [token]);

  const handleLogout = () => {
    clearAuthToken();
    setToken(null);
    setIsOpen(false);
  };

  const goToWallet = () => {
    setIsOpen(false);
    navigate("/wallet");
  };

  const goToProfile = () => {
    setIsOpen(false);
    navigate("/wallet");
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative h-8 w-8 rounded-full border border-gray-200 bg-yellow-400 dark:border-zinc-800 dark:bg-yellow-500 flex items-center justify-center shadow-sm"
        aria-label="Open user menu"
      >
        <User size={16} className="text-gray-900 dark:text-white" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 rounded-3xl border border-gray-100 bg-white/95 p-4 shadow-2xl shadow-zinc-900/10 backdrop-blur transition-colors duration-300 dark:border-zinc-800 dark:bg-zinc-950/90 dark:shadow-zinc-950">
          <div className="space-y-1">
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {profile?.name || (isAuthenticated ? "User" : "Guest")}
            </div>
            {profile?.email && (
              <div className="text-xs text-gray-500 dark:text-gray-400">{profile.email}</div>
            )}
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {profile?.phoneNumber || (isAuthenticated ? "No phone on file" : "Not signed in")}
            </div>
          </div>

          {isLoading && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Loading profile...
            </div>
          )}
          {error && (
            <div className="text-xs text-red-600 font-semibold mt-2">{error}</div>
          )}

          <div className="mt-4 space-y-2 border-t border-gray-100 pt-3 text-sm font-semibold dark:border-zinc-800">
            <button
              type="button"
              onClick={goToWallet}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-gray-700 transition hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-zinc-800"
            >
              <Wallet size={16} />
              Wallet
            </button>
            <button
              type="button"
              onClick={goToProfile}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-gray-700 transition hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-zinc-800"
            >
              <User size={16} />
              Profile
            </button>
            {isAuthenticated ? (
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-red-600 transition hover:bg-red-50 dark:hover:bg-red-900/60 dark:text-red-500"
              >
                <LogOut size={16} />
                Log out
              </button>
            ) : (
              <button
                type="button"
                onClick={goToWallet}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-gray-700 transition hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-zinc-800"
              >
                <LogIn size={16} />
                Sign in
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfileMenu;
