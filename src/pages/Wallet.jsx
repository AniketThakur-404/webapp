import React, { useEffect, useState } from "react";
import { BadgeCheck, LogOut, Scan, ShieldCheck } from "lucide-react";
import {
  getUserDashboard,
  scanQr,
  sendOtp,
  verifyOtp,
  getMe,
  updateUserProfile,
} from "../lib/api";
import { AUTH_TOKEN_KEY, clearAuthToken, storeAuthToken } from "../lib/auth";

const formatAmount = (value) => {
  if (value === undefined || value === null) return "0.00";
  const numeric = Number(value);
  if (Number.isFinite(numeric)) return numeric.toFixed(2);
  return String(value);
};

const Wallet = () => {
  const [token, setToken] = useState(() => localStorage.getItem(AUTH_TOKEN_KEY));
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpHint, setOtpHint] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [profile, setProfile] = useState({ name: "", email: "", phoneNumber: "" });
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [dashboard, setDashboard] = useState(null);
  const [scanHash, setScanHash] = useState("");
  const [scanMessage, setScanMessage] = useState("");

  const isAuthenticated = Boolean(token);

  const loadDashboard = async (authToken) => {
    if (!authToken) return;
    setIsLoadingDashboard(true);
    setError("");
    try {
      const data = await getUserDashboard(authToken);
      setDashboard(data);
    } catch (err) {
      if (err.status === 401) {
        clearAuthToken();
        setToken(null);
      }
      setError(err.message || "Unable to load wallet.");
    } finally {
      setIsLoadingDashboard(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadDashboard(token);
      loadUserProfile(token);
    }
  }, [token]);

  const loadUserProfile = async (authToken) => {
    if (!authToken) return;
    setIsLoadingProfile(true);
    setProfileError("");
    try {
      const data = await getMe(authToken);
      setProfile({
        name: data.name || "",
        email: data.email || "",
        phoneNumber: data.phoneNumber || "",
      });
    } catch (err) {
      if (err.status === 401) {
        clearAuthToken();
        setToken(null);
      }
      setProfileError(err.message || "Unable to load profile.");
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleSendOtp = async () => {
    if (!phoneNumber.trim()) {
      setError("Enter your phone number to receive an OTP.");
      return;
    }
    setError("");
    setStatus("");
    setOtpHint("");
    setIsSendingOtp(true);
    try {
      const data = await sendOtp(phoneNumber.trim());
      setOtpSent(true);
      setStatus("OTP sent. Check your phone for the code.");
      if (import.meta.env.DEV && data?.otp) {
        setOtpHint(`Dev OTP: ${data.otp}`);
      }
    } catch (err) {
      setError(err.message || "Failed to send OTP.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      setError("Enter the OTP to continue.");
      return;
    }
    setError("");
    setStatus("");
    setIsVerifyingOtp(true);
    try {
      const data = await verifyOtp(phoneNumber.trim(), otp.trim());
      storeAuthToken(data.token);
      setToken(data.token);
      setOtp("");
      setOtpSent(false);
      setStatus("Verified. Wallet connected.");
    } catch (err) {
      setError(err.message || "OTP verification failed.");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleSignOut = () => {
    clearAuthToken();
    setToken(null);
    setDashboard(null);
    setStatus("Signed out.");
    setScanMessage("");
    setProfile({ name: "", email: "", phoneNumber: "" });
    setProfileError("");
    setProfileSuccess("");
  };

  const handleProfileSave = async () => {
    if (!profile.name.trim() || !profile.email.trim()) {
      setProfileError("Name and email are required.");
      return;
    }
    if (!token) return;
    setProfileError("");
    setProfileSuccess("");
    setIsSavingProfile(true);
    try {
      const data = await updateUserProfile(token, {
        name: profile.name.trim(),
        email: profile.email.trim(),
      });
      if (data?.user) {
        setProfile((prev) => ({
          ...prev,
          name: data.user.name || prev.name,
          email: data.user.email || prev.email,
        }));
      }
      setProfileSuccess("Profile saved.");
    } catch (err) {
      setProfileError(err.message || "Unable to update profile.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleScan = async () => {
    if (!scanHash.trim()) {
      setScanMessage("Enter a QR hash to redeem.");
      return;
    }
    setScanMessage("");
    setIsScanning(true);
    try {
      const result = await scanQr(token, scanHash.trim());
      setScanMessage(`Redeemed. Added ${formatAmount(result.amount)} to wallet.`);
      setScanHash("");
      await loadDashboard(token);
    } catch (err) {
      setScanMessage(err.message || "Scan failed.");
    } finally {
      setIsScanning(false);
    }
  };

  const walletBalance = dashboard?.wallet?.balance;
  const transactions = dashboard?.recentTransactions || [];

  return (
    <div className="p-4 pb-20 space-y-4 bg-primary/10 dark:bg-zinc-950 min-h-full transition-colors duration-300">
      {!isAuthenticated && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-200">
            <ShieldCheck size={16} className="text-primary-strong" />
            Sign in to view vCash
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              Phone number
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(event) => setPhoneNumber(event.target.value)}
              placeholder="Enter phone number"
              className="w-full rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
            />
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={isSendingOtp}
              className="w-full rounded-xl bg-primary text-white text-sm font-semibold py-2 shadow-md disabled:opacity-60"
            >
              {isSendingOtp ? "Sending..." : "Send OTP"}
            </button>
          </div>

          {otpSent && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                OTP
              </label>
              <input
                type="text"
                value={otp}
                onChange={(event) => setOtp(event.target.value)}
                placeholder="Enter OTP"
                className="w-full rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
              />
              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={isVerifyingOtp}
                className="w-full rounded-xl bg-gray-900 text-white text-sm font-semibold py-2 shadow-md disabled:opacity-60 dark:bg-white dark:text-gray-900"
              >
                {isVerifyingOtp ? "Verifying..." : "Verify OTP"}
              </button>
            </div>
          )}

          {otpHint && (
            <div className="text-xs text-primary-strong font-semibold">{otpHint}</div>
          )}

          {status && (
            <div className="text-xs text-green-600 font-semibold">{status}</div>
          )}
          {error && <div className="text-xs text-red-600 font-semibold">{error}</div>}
        </div>
      )}

      {isAuthenticated && (
        <>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                vCash Wallet
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                className="flex items-center gap-1 text-xs font-semibold text-gray-500 dark:text-gray-400"
              >
                <LogOut size={14} />
                Sign out
              </button>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/15 dark:bg-primary-strong/40 flex items-center justify-center">
                <BadgeCheck size={20} className="text-primary-strong dark:text-primary" />
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Balance</div>
                <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  INR {formatAmount(walletBalance)}
                </div>
              </div>
            </div>
            {isLoadingDashboard && (
              <div className="text-xs text-gray-500 dark:text-gray-400">Loading wallet...</div>
            )}
            {status && (
              <div className="text-xs text-green-600 font-semibold">{status}</div>
            )}
            {error && <div className="text-xs text-red-600 font-semibold">{error}</div>}
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                Profile
              </div>
              <span className="text-[11px] text-gray-500 dark:text-gray-400">
                {isLoadingProfile ? "Loading..." : "Personal info"}
              </span>
            </div>
            <div className="grid gap-3">
              <label className="text-xs text-gray-500 dark:text-gray-400">Full Name</label>
              <input
                type="text"
                value={profile.name}
                onChange={(event) => setProfile({ ...profile, name: event.target.value })}
                placeholder="Full name"
                className="w-full rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
              />
              <label className="text-xs text-gray-500 dark:text-gray-400">Email Address</label>
              <input
                type="email"
                value={profile.email}
                onChange={(event) => setProfile({ ...profile, email: event.target.value })}
                placeholder="Email"
                className="w-full rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
              />
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Phone: {profile.phoneNumber || "Not available"}
              </div>
            </div>
            <button
              type="button"
              onClick={handleProfileSave}
              disabled={isSavingProfile}
              className="w-full rounded-xl bg-primary text-white text-sm font-semibold py-2 shadow-md disabled:opacity-60"
            >
              {isSavingProfile ? "Saving..." : "Save Profile"}
            </button>
            {profileSuccess && (
              <div className="text-xs text-green-600 font-semibold">{profileSuccess}</div>
            )}
            {profileError && (
              <div className="text-xs text-red-600 font-semibold">{profileError}</div>
            )}
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-4 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-200">
              <Scan size={16} className="text-primary-strong" />
              Scan and redeem
            </div>
            <input
              type="text"
              value={scanHash}
              onChange={(event) => setScanHash(event.target.value)}
              placeholder="Paste QR hash"
              className="w-full rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
            />
            <button
              type="button"
              onClick={handleScan}
              disabled={isScanning}
              className="w-full rounded-xl bg-primary text-white text-sm font-semibold py-2 shadow-md disabled:opacity-60"
            >
              {isScanning ? "Redeeming..." : "Redeem QR"}
            </button>
            {scanMessage && (
              <div className="text-xs text-gray-500 dark:text-gray-400">{scanMessage}</div>
            )}
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-4 shadow-sm space-y-3">
            <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              Recent transactions
            </div>
            {transactions.length === 0 ? (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                No transactions yet.
              </div>
            ) : (
              <div className="space-y-2">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between rounded-xl border border-gray-100 dark:border-zinc-800 px-3 py-2"
                  >
                    <div>
                      <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        {tx.category?.replace(/_/g, " ") || "Transaction"}
                      </div>
                      <div className="text-[10px] text-gray-500 dark:text-gray-400">
                        {new Date(tx.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-xs font-bold text-gray-900 dark:text-gray-100">
                      {tx.type === "debit" ? "-" : "+"}INR {formatAmount(tx.amount)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Wallet;
