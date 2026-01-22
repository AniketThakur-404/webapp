import React, { useState } from "react";
import { QrCode, Scan } from "lucide-react";
import { scanQr } from "../../lib/api";

const formatAmount = (value) => {
    if (value === undefined || value === null) return "0.00";
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return numeric.toFixed(2);
    return String(value);
};

const RedeemCard = ({ token, onRedeemSuccess }) => {
    const [scanHash, setScanHash] = useState("");
    const [scanMessage, setScanMessage] = useState("");
    const [isScanning, setIsScanning] = useState(false);
    const [status, setStatus] = useState("idle"); // idle, success, error

    const handleScan = async () => {
        if (!scanHash.trim()) {
            setScanMessage("Enter a QR hash to redeem.");
            setStatus("error");
            return;
        }
        setScanMessage("");
        setStatus("idle");
        setIsScanning(true);
        try {
            const result = await scanQr(token, scanHash.trim());
            setScanMessage(`Successfully redeemed! Added ${formatAmount(result.amount)} to wallet.`);
            setStatus("success");
            setScanHash("");
            if (onRedeemSuccess) onRedeemSuccess();
        } catch (err) {
            setScanMessage(err.message || "Invalid or used QR code.");
            setStatus("error");
        } finally {
            setIsScanning(false);
        }
    };

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-800 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-xl">
                    <Scan size={24} />
                </div>
                <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">Redeem Gift Card</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Enter code to add funds</p>
                </div>
            </div>

            <div className="flex gap-2">
                <div className="relative flex-1">
                    <QrCode className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        value={scanHash}
                        onChange={(event) => setScanHash(event.target.value)}
                        placeholder="Paste QR hash here"
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-zinc-800/50 rounded-xl border-0 text-sm focus:ring-2 focus:ring-purple-500/20 text-gray-900 dark:text-white transition-all placeholder:text-gray-400"
                    />
                </div>
                <button
                    type="button"
                    onClick={handleScan}
                    disabled={isScanning}
                    className="px-6 py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-bold shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 whitespace-nowrap"
                >
                    {isScanning ? "..." : "Redeem"}
                </button>
            </div>

            {scanMessage && (
                <div className={`mt-4 p-3 rounded-xl text-sm font-medium flex items-center gap-2 ${status === "success"
                        ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                        : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
                    }`}>
                    {status === 'success' ? <div className="w-1.5 h-1.5 rounded-full bg-green-500" /> : <div className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                    {scanMessage}
                </div>
            )}
        </div>
    );
};

export default RedeemCard;
