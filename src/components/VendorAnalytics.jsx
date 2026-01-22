
import React from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Legend
} from 'recharts';
import { TrendingUp, Activity } from 'lucide-react';

const redemptionData = [
    { name: 'Mon', redemptions: 12, value: 600 },
    { name: 'Tue', redemptions: 18, value: 900 },
    { name: 'Wed', redemptions: 15, value: 750 },
    { name: 'Thu', redemptions: 25, value: 1250 },
    { name: 'Fri', redemptions: 32, value: 1600 },
    { name: 'Sat', redemptions: 45, value: 2250 },
    { name: 'Sun', redemptions: 38, value: 1900 },
];

const campaignData = [
    { name: 'Summer', sent: 400, redeemed: 240 },
    { name: 'Diwali', sent: 300, redeemed: 139 },
    { name: 'New Year', sent: 200, redeemed: 180 },
    { name: 'Welcome', sent: 278, redeemed: 190 },
];

const VendorAnalytics = () => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Redemption Activity Chart */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm dark:shadow-none">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-emerald-600/20 flex items-center justify-center">
                            <TrendingUp size={16} className="text-emerald-400" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-gray-900 dark:text-white">Redemption Trends</h3>
                            <p className="text-xs text-gray-500">Last 7 days activity</p>
                        </div>
                    </div>
                    <select className="bg-gray-50 dark:bg-[#0f0f0f] border border-gray-200 dark:border-gray-700 text-xs text-gray-700 dark:text-gray-300 rounded-lg px-2 py-1 outline-none">
                        <option>This Week</option>
                        <option>Last Week</option>
                    </select>
                </div>

                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={redemptionData}>
                            <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.2} vertical={false} />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#6b7280', fontSize: 12 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#6b7280', fontSize: 12 }}
                                dx={-10}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1a1a1a', borderColor: '#374151', borderRadius: '8px' }}
                                itemStyle={{ color: '#fff' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke="#10b981"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorValue)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Campaign Performance Chart */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm dark:shadow-none">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-blue-600/20 flex items-center justify-center">
                            <Activity size={16} className="text-blue-400" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-gray-900 dark:text-white">Campaign Performance</h3>
                            <p className="text-xs text-gray-500">Sent vs Redeemed</p>
                        </div>
                    </div>
                    <button className="text-xs text-blue-400 hover:text-blue-300">View Report</button>
                </div>

                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={campaignData} barGap={8}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.2} vertical={false} />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#6b7280', fontSize: 12 }}
                                dy={10}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1a1a1a', borderColor: '#374151', borderRadius: '8px' }}
                                cursor={{ fill: '#374151', opacity: 0.2 }}
                                itemStyle={{ color: '#fff' }}
                            />
                            <Legend wrapperStyle={{ paddingTop: '20px' }} />
                            <Bar dataKey="sent" name="Sent" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                            <Bar dataKey="redeemed" name="Redeemed" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default VendorAnalytics;
