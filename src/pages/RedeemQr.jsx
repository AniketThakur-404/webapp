import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { verifyPublicQr, scanQr } from '../lib/api';
import { AUTH_TOKEN_KEY } from '../lib/auth';
import { Loader2, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';

const RedeemQr = () => {
    const { hash } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [redeemStatus, setRedeemStatus] = useState(null);
    const [redeeming, setRedeeming] = useState(false);

    useEffect(() => {
        const fetchQrCtx = async () => {
            try {
                const res = await verifyPublicQr(hash);
                setData(res);
            } catch (err) {
                setError(err.message || 'Invalid or expired QR code');
            } finally {
                setLoading(false);
            }
        };
        fetchQrCtx();
    }, [hash]);

    const handleRedeem = async () => {
        const token = localStorage.getItem(AUTH_TOKEN_KEY);
        if (!token) {
            // Find existing auth route, assume /login or /?auth=login logic
            // For now, redirect to home which likely has login validation or explicit login page
            // Storing return URL would be ideal
            localStorage.setItem('redirect_after_login', `/redeem/${hash}`);
            navigate('/');
            return;
        }

        setRedeeming(true);
        try {
            const res = await scanQr(token, hash);
            setRedeemStatus({ success: true, message: res.message, amount: res.amount });
        } catch (err) {
            setRedeemStatus({ success: false, message: err.message });
        } finally {
            setRedeeming(false);
        }
    };

    if (loading) return <div className="flex items-center justify-center min-h-screen bg-black text-white"><Loader2 className="animate-spin" /></div>;

    if (error) return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-6">
            <AlertCircle size={48} className="text-red-500 mb-4" />
            <h1 className="text-xl font-bold mb-2">Error</h1>
            <p className="text-gray-400">{error}</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-6">
                <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ShieldCheck size={32} className="text-emerald-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-white max-w-[80%] mx-auto leading-tight">
                        You've found a reward!
                    </h1>
                    <p className="text-gray-400 text-sm">Scan verified successfully</p>
                </div>

                <div className="space-y-4 py-6 border-y border-zinc-800">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-sm">Campaign</span>
                        <span className="font-medium text-white">{data.campaign}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-sm">Brand</span>
                        <span className="font-medium text-white">{data.brand}</span>
                    </div>
                    <div className="flex justify-between items-center bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                        <span className="text-gray-400 text-sm">Cashback Value</span>
                        <span className="font-bold text-2xl text-emerald-400">₹{data.amount}</span>
                    </div>
                </div>

                {redeemStatus && (
                    <div className={`p-4 rounded-xl text-sm font-medium flex items-start gap-3 ${redeemStatus.success ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                        {redeemStatus.success ? <CheckCircle2 size={18} className="shrink-0 mt-0.5" /> : <AlertCircle size={18} className="shrink-0 mt-0.5" />}
                        <div>{redeemStatus.message}</div>
                    </div>
                )}

                {!redeemStatus?.success && (
                    <button
                        onClick={handleRedeem}
                        disabled={redeeming}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 shadow-lg shadow-emerald-900/20"
                    >
                        {redeeming ? "Processing..." : "Claim Cashback Now"}
                    </button>
                )}
                {redeemStatus?.success && (
                    <button
                        onClick={() => navigate('/wallet')}
                        className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-3.5 rounded-xl transition-all"
                    >
                        View Wallet
                    </button>
                )}
            </div>
        </div>
    );
};

export default RedeemQr;
