import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BadgeCheck, ChevronRight, Globe, Mail, MessageCircle, Search } from 'lucide-react';
import { brandCatalog, productCatalog } from '../data/catalog';
import FallbackImage from '../components/FallbackImage';
import HowItWorks from '../components/HowItWorks';

const titleFromSlug = (slug) => {
  if (!slug) return 'Brand';
  return slug
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const BrandDetails = () => {
  const { id } = useParams();
  const brandMatch = brandCatalog.find((brand) => brand.id === id);
  const brand = brandMatch || brandCatalog[0];
  const brandId = brand?.id;

  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    setQuery('');
    setActiveCategory('All');
  }, [brandId]);

  const brandProducts = useMemo(
    () => productCatalog.filter((product) => product.brandId === brandId),
    [brandId]
  );

  const categories = useMemo(() => {
    const unique = new Set(brandProducts.map((product) => product.category));
    return ['All', ...unique];
  }, [brandProducts]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return brandProducts.filter((product) => {
      const matchesCategory = activeCategory === 'All' || product.category === activeCategory;
      if (!matchesCategory) return false;
      if (!normalizedQuery) return true;
      const haystack = `${product.name} ${product.variant}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [activeCategory, brandProducts, query]);

  const displayBrand = brandMatch
    ? brand
    : id
      ? {
        ...brandCatalog[0],
        id,
        name: titleFromSlug(id),
      }
      : brandCatalog[0];

  return (
    <div className="bg-primary/10 dark:bg-zinc-950 min-h-full pb-24 transition-colors duration-300">
      <div className="px-4 mt-4 space-y-4">
        <div className="rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 shadow-sm transition-colors duration-300">
          <FallbackImage
            src={displayBrand.banner}
            alt={`${displayBrand.name} banner`}
            className="w-full h-36 object-cover"
          />
          <div className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">{displayBrand.name}</h1>
                <div className="flex items-center gap-2 text-[11px] text-green-700 font-semibold mt-1">
                  <BadgeCheck size={14} className="text-green-600" />
                  Verified brand partner
                </div>
              </div>
              <button
                type="button"
                className="shrink-0 bg-primary text-white text-[11px] font-semibold px-3 py-2 rounded-full flex items-center gap-1 shadow-sm"
              >
                <MessageCircle size={14} />
                Talk to Brand
              </button>
            </div>

            <div className="flex flex-wrap gap-3 text-[11px] text-primary-strong">
              <a
                href={`mailto:${displayBrand.email}`}
                className="inline-flex items-center gap-1 hover:text-primary-strong"
              >
                <Mail size={12} />
                {displayBrand.email}
              </a>
              <a
                href={displayBrand.website}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 hover:text-primary-strong"
              >
                <Globe size={12} />
                Brand Website
              </a>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{displayBrand.about}</p>

            <div className="flex flex-wrap gap-2">
              {displayBrand.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] font-semibold text-primary-strong dark:text-primary bg-primary/10 dark:bg-primary-strong/30 px-2 py-1 rounded-full border border-primary/20 dark:border-primary-strong/30"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="relative">
          <Search
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search Product"
            className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-full py-3 pl-10 pr-12 text-sm text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center shadow-md"
          >
            <Search size={14} />
          </button>
        </div>

        <div className="flex gap-2 flex-wrap">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2 rounded-full text-[11px] font-semibold border transition-colors ${activeCategory === category
                ? 'bg-primary text-white border-primary shadow-sm'
                : 'bg-white dark:bg-zinc-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800'
                }`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filteredProducts.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 border border-dashed border-gray-200 dark:border-zinc-800 rounded-2xl p-6 text-center text-sm text-gray-500 dark:text-gray-400">
              No products matched your search yet.
            </div>
          ) : (
            filteredProducts.map((product) => (
              <Link
                key={product.id}
                to={`/product-info/${product.id}`}
                className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-gray-100 dark:border-zinc-800 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow"
              >
                <FallbackImage
                  src={product.image}
                  alt={product.name}
                  className="w-12 h-12 object-contain rounded-lg bg-primary/10 dark:bg-zinc-800"
                />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">{product.name}</div>
                  <div className="text-[11px] text-gray-500 dark:text-gray-400">{product.variant}</div>
                  <div className="text-[11px] text-green-600 dark:text-green-500 font-semibold mt-1">
                    {product.reward} cashback
                  </div>
                </div>
                <ChevronRight size={18} className="text-gray-400" />
              </Link>
            ))
          )}
        </div>

        <HowItWorks />
      </div>
    </div>
  );
};

export default BrandDetails;
