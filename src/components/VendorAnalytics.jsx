
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

const VendorAnalytics = ({ redemptionSeries = [], campaignSeries = [], selectionLabel = "All campaigns" }) => {
    const showRedemptionChart = redemptionSeries.length > 0;
    const showCampaignChart = campaignSeries.length > 0;
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
                            <p className="text-xs text-gray-500">Last 7 days - {selectionLabel}</p>
                        </div>
                    </div>
                </div>

                <div className="h-[250px] w-full">
                    {showRedemptionChart ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={redemptionSeries}>
                                <defs>
                                    <linearGradient id="colorRedemptions" x1="0" y1="0" x2="0" y2="1">
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
                                    dataKey="redemptions"
                                    stroke="#10b981"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorRedemptions)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full w-full flex items-center justify-center text-xs text-gray-500">
                            No redemption activity yet.
                        </div>
                    )}
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
                            <p className="text-xs text-gray-500">Total vs Redeemed - {selectionLabel}</p>
                        </div>
                    </div>
                </div>

                <div className="h-[250px] w-full">
                    {showCampaignChart ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={campaignSeries} barGap={8}>
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
                                <Bar dataKey="sent" name="Total" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                <Bar dataKey="redeemed" name="Redeemed" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full w-full flex items-center justify-center text-xs text-gray-500">
                            No campaign data yet.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VendorAnalytics;
