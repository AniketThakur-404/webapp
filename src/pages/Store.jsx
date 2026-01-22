import React, { useMemo, useState } from "react";
import { BadgeDollarSign, Gift, ShoppingBag, Tag } from "lucide-react";
import {
  storeTabs,
  storeCategories,
  vouchers,
  products,
} from "../data/store";

const StoreCard = ({ title, subtitle, value, badge }) => (
  <div className="rounded-2xl border border-slate-50 dark:border-white/10 bg-white dark:bg-[#0f0f11] shadow-2xl shadow-slate-900/20 p-4 flex flex-col gap-4">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-lg font-semibold text-slate-900 dark:text-white">{title}</p>
        <p className="text-sm text-slate-500 dark:text-slate-300">{subtitle}</p>
      </div>
      <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-primary to-[rgba(129,204,42,0.7)] flex items-center justify-center text-white">
        {badge || <Gift size={20} />}
      </div>
    </div>
    <div className="flex items-center justify-between text-sm font-semibold text-slate-600 dark:text-slate-300">
      <span className="uppercase tracking-wider">{value}</span>
      <button className="rounded-full border border-slate-200 bg-slate-50 dark:border-white/20 dark:bg-white/5 px-4 py-1 text-xs font-semibold text-slate-900 dark:text-white">
        Redeem
      </button>
    </div>
  </div>
);

const Store = () => {
  const [activeTab, setActiveTab] = useState(storeTabs[0].id);
  const [activeCategory, setActiveCategory] = useState(storeCategories[0]);

  const activeItems = useMemo(() => {
    const list = activeTab === "products" ? products : vouchers;
    if (activeCategory === "Popular") {
      return list;
    }
    return list.filter((item) => item.category === activeCategory);
  }, [activeTab, activeCategory]);

  return (
    <div className="px-6 py-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-md font-semibold text-slate-500 dark:text-slate-300">
            Rewards Store
          </p>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Redeem your cashback
          </h1>
        </div>
        <button className="inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-900 dark:border-white/20 dark:bg-white/10 dark:text-white">
          <BadgeDollarSign size={16} />
          Admin only
        </button>
      </div>

      <div className="rounded-full border border-slate-200/60 bg-white/60 dark:border-white/10 dark:bg-white/5 p-1 flex gap-2">
        {storeTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 rounded-full text-sm font-semibold transition-colors duration-200 ${
              activeTab === tab.id
                ? "bg-primary text-white shadow-xl shadow-primary/40"
                : "text-slate-500 dark:text-slate-300"
            } py-2`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {storeCategories.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wide transition duration-200 ${
              activeCategory === category
                ? "bg-slate-900 text-white"
                : "border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-300"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {activeItems.map((item) => (
          <StoreCard
            key={item.id}
            title={item.name}
            subtitle={item.tagline || item.description}
            value={
              activeTab === "vouchers"
                ? `${item.value} / ${item.points} pts`
                : `${item.points} points`
            }
            badge={
              <ShoppingBag size={20} className="text-white" />
            }
          />
        ))}
      </div>
    </div>
  );
};

export default Store;
