import React, { useEffect, useState } from "react";
import { ArrowLeft, Camera, LogOut, Mail, Phone, Save, User, UserCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getMe, updateUserProfile } from "../lib/api";
import { AUTH_TOKEN_KEY, clearAuthToken } from "../lib/auth";

const Profile = () => {
    const navigate = useNavigate();
    const [token, setToken] = useState(() => localStorage.getItem(AUTH_TOKEN_KEY));
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [profile, setProfile] = useState({
        name: "",
        email: "",
        phoneNumber: "",
    });

    useEffect(() => {
        if (!token) {
            navigate("/"); // Redirect if not authenticated
            return;
        }
        loadProfile();
    }, [token, navigate]);

    const loadProfile = async () => {
        setIsLoading(true);
        try {
            const data = await getMe(token);
            setProfile({
                name: data.name || "",
                email: data.email || "",
                phoneNumber: data.phoneNumber || "",
            });
        } catch (err) {
            setError(err.message || "Failed to load profile");
            if (err.status === 401) {
                handleLogout();
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setIsSaving(true);

        try {
            if (!profile.name.trim() || !profile.email.trim()) {
                throw new Error("Name and Email are required");
            }

            await updateUserProfile(token, {
                name: profile.name,
                email: profile.email,
            });
            setSuccess("Profile updated successfully");
        } catch (err) {
            setError(err.message || "Failed to update profile");
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogout = () => {
        clearAuthToken();
        navigate("/");
    };

    if (!token) return null;

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-zinc-950 p-4 pb-24 md:pb-8 transition-colors duration-300">
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 rounded-full hover:bg-white hover:shadow-sm transition-all dark:hover:bg-zinc-900"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Account Settings</h1>
                </div>

                {/* Profile Card */}
                <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-zinc-800 relative overflow-hidden">
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                    <div className="relative">
                        <div className="flex flex-col md:flex-row items-center gap-6 mb-8">
                            <div className="relative group cursor-pointer">
                                <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center border-4 border-white dark:border-zinc-900 shadow-lg">
                                    <UserCircle className="w-12 h-12 text-gray-400 dark:text-gray-500" />
                                </div>
                                <div className="absolute bottom-0 right-0 p-2 bg-primary rounded-full text-white shadow-md group-hover:scale-105 transition-transform">
                                    <Camera size={14} />
                                </div>
                            </div>
                            <div className="text-center md:text-left">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{profile.name || "User"}</h2>
                                <p className="text-gray-500 dark:text-gray-400 text-sm">{profile.email || "Add your email"}</p>
                            </div>
                        </div>

                        <form onSubmit={handleSave} className="space-y-5">
                            <div className="grid md:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 ml-1">Full Name</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        <input
                                            type="text"
                                            value={profile.name}
                                            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-zinc-800/50 rounded-xl border-0 focus:ring-2 focus:ring-primary/20 text-gray-900 dark:text-white transition-all placeholder:text-gray-400"
                                            placeholder="Enter your name"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 ml-1">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        <input
                                            type="email"
                                            value={profile.email}
                                            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-zinc-800/50 rounded-xl border-0 focus:ring-2 focus:ring-primary/20 text-gray-900 dark:text-white transition-all placeholder:text-gray-400"
                                            placeholder="Enter your email"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 ml-1">Phone Number</label>
                                    <div className="relative">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        <input
                                            type="text"
                                            value={profile.phoneNumber}
                                            readOnly
                                            className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-zinc-800/80 rounded-xl border-0 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                                        />
                                    </div>
                                    <p className="text-[10px] text-gray-400 ml-1">Phone number cannot be changed</p>
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-xl">
                                    {error}
                                </div>
                            )}

                            {success && (
                                <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm rounded-xl">
                                    {success}
                                </div>
                            )}

                            <div className="pt-4 flex items-center justify-between gap-4">
                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    className="px-6 py-3 rounded-xl text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/10 dark:hover:bg-red-900/20 dark:text-red-400 font-semibold transition-colors flex items-center gap-2"
                                >
                                    <LogOut size={18} />
                                    <span>Sign Out</span>
                                </button>

                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="px-8 py-3 rounded-xl bg-primary hover:bg-primary-strong text-white font-semibold shadow-lg shadow-primary/25 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100 flex items-center gap-2 ml-auto"
                                >
                                    {isSaving ? (
                                        <>Saving...</>
                                    ) : (
                                        <>
                                            <Save size={18} />
                                            <span>Save Changes</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
