import React, { useEffect, useState } from "react";
import { getUserDashboard } from "../lib/api";
import { AUTH_TOKEN_KEY, clearAuthToken } from "../lib/auth";
import WalletAuth from "../components/wallet/WalletAuth";
import WalletBalance from "../components/wallet/WalletBalance";
import RedeemCard from "../components/wallet/RedeemCard";
import TransactionList from "../components/wallet/TransactionList";

const Wallet = () => {
  const [token, setToken] = useState(() => localStorage.getItem(AUTH_TOKEN_KEY));
  const [dashboard, setDashboard] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (token) {
      loadDashboard(token);
    } else {
      setDashboard(null);
    }
  }, [token]);

  const loadDashboard = async (authToken) => {
    if (!authToken) return;
    setIsLoading(true);
    setError("");
    try {
      const data = await getUserDashboard(authToken);
      setDashboard(data);
    } catch (err) {
      if (err.status === 401) {
        handleSignOut();
      }
      setError(err.message || "Unable to load wallet.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSuccess = (newToken) => {
    setToken(newToken);
  };

  const handleSignOut = () => {
    clearAuthToken();
    setToken(null);
    setDashboard(null);
  };

  const handleRedeemSuccess = () => {
    loadDashboard(token);
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50/50 dark:bg-zinc-950 p-4 flex items-center justify-center transition-colors duration-300">
        <WalletAuth onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-zinc-950 p-4 pb-24 md:pb-8 transition-colors duration-300">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Wallet</h1>
        </div>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl text-sm font-semibold">
            {error}
          </div>
        )}

        {/* Dashboard Grid */}
        <div className="grid lg:grid-cols-3 gap-6">

          {/* Left Column: Balance & Actions */}
          <div className="lg:col-span-1 space-y-6">
            <WalletBalance
              balance={dashboard?.wallet?.balance}
              onSignOut={handleSignOut}
              isLoading={isLoading}
            />
            <RedeemCard
              token={token}
              onRedeemSuccess={handleRedeemSuccess}
            />
          </div>

          {/* Right Column: Transactions */}
          <div className="lg:col-span-2">
            <TransactionList
              transactions={dashboard?.recentTransactions}
            />
          </div>
        </div>

      </div>
    </div>
  );
};

export default Wallet;
