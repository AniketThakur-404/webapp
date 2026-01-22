import React, { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { sendOtp, verifyOtp } from "../../lib/api";
import { storeAuthToken } from "../../lib/auth";

const WalletAuth = ({ onLoginSuccess }) => {
    const [phoneNumber, setPhoneNumber] = useState("");
    const [otp, setOtp] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [otpHint, setOtpHint] = useState("");
    const [error, setError] = useState("");
    const [status, setStatus] = useState("");
    const [isSendingOtp, setIsSendingOtp] = useState(false);
    const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

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
            setStatus("Verified. Wallet connected.");
            if (onLoginSuccess) {
                onLoginSuccess(data.token);
            }
        } catch (err) {
            setError(err.message || "OTP verification failed.");
        } finally {
            setIsVerifyingOtp(false);
        }
    };

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-800 p-6 shadow-xl shadow-zinc-900/5 space-y-6 max-w-md mx-auto">
            <div className="flex items-center gap-3 text-lg font-semibold text-gray-900 dark:text-white">
                <div className="p-2.5 bg-primary/10 dark:bg-primary/20 rounded-xl text-primary">
                    <ShieldCheck size={24} />
                </div>
                Sign in to view vCash
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 ml-1">
                        Phone number
                    </label>
                    <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(event) => setPhoneNumber(event.target.value)}
                        placeholder="Enter phone number"
                        className="w-full rounded-2xl border-0 bg-gray-50 dark:bg-zinc-800/50 px-4 py-3.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-gray-400"
                    />
                </div>

                {!otpSent ? (
                    <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={isSendingOtp}
                        className="w-full rounded-2xl bg-primary hover:bg-primary-strong text-white font-bold py-3.5 shadow-lg shadow-primary/25 disabled:opacity-60 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        {isSendingOtp ? "Sending Code..." : "Send Verification Code"}
                    </button>
                ) : (
                    <>
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 ml-1">
                                Verification Code
                            </label>
                            <input
                                type="text"
                                value={otp}
                                onChange={(event) => setOtp(event.target.value)}
                                placeholder="Enter 6-digit code"
                                className="w-full rounded-2xl border-0 bg-gray-50 dark:bg-zinc-800/50 px-4 py-3.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-gray-400 tracking-widest text-center font-mono text-lg"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={handleVerifyOtp}
                            disabled={isVerifyingOtp}
                            className="w-full rounded-2xl bg-gray-900 text-white font-bold py-3.5 shadow-lg disabled:opacity-60 dark:bg-white dark:text-gray-900 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {isVerifyingOtp ? "Verifying..." : "Verify & Connect Wallet"}
                        </button>
                    </>
                )}
            </div>

            {otpHint && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-sm font-medium rounded-xl text-center">
                    {otpHint}
                </div>
            )}

            {status && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm font-medium rounded-xl text-center">
                    {status}
                </div>
            )}

            {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium rounded-xl text-center">
                    {error}
                </div>
            )}
        </div>
    );
};

export default WalletAuth;
