import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { BadgeCheck, ChevronRight, Scan, Gift } from 'lucide-react';
import { brandCatalog, productCatalog } from '../data/catalog';
import FallbackImage from '../components/FallbackImage';

const ProductInfo = () => {
  const { id } = useParams();
  const product = productCatalog.find((item) => item.id === id) || productCatalog[0];
  const brand = brandCatalog.find((item) => item.id === product.brandId);

  const details = [
    { label: 'Scheme', value: product.scheme },
    { label: 'Cashback', value: product.cashback || product.reward },
    { label: 'Pack Size', value: product.packSize },
    { label: 'Warranty', value: product.warranty },
  ];

  const steps = [
    {
      title: 'Look for Incentify Online Logo',
      description: 'Check the Incentify Online logo on products (online or offline).',
      icon: <BadgeCheck size={16} className="text-primary-strong" />,
    },
    {
      title: 'Scratch and Scan',
      description: 'Scratch the hidden code and scan it securely.',
      icon: <Scan size={16} className="text-primary-strong" />,
    },
    {
      title: 'Get Rewards',
      description: 'See authentication status and cashback instantly.',
      icon: <Gift size={16} className="text-primary-strong" />,
    },
  ];

  return (
    <div className="bg-primary/10 dark:bg-zinc-950 min-h-full pb-24 transition-colors duration-300">
      <div className="px-4 mt-4 space-y-4">
        <div className="relative rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 shadow-sm transition-colors duration-300">
          <FallbackImage
            src={product.banner || product.image}
            alt={`${product.name} banner`}
            className="w-full h-44 object-cover"
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 dark:bg-zinc-800/90 border border-gray-200 dark:border-zinc-700 flex items-center justify-center shadow-md"
          >
            <ChevronRight size={18} className="text-gray-700 dark:text-gray-300" />
          </button>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-4 shadow-sm space-y-3 transition-colors duration-300">
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">{product.name}</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">{product.variant}</p>
          </div>
          {brand && (
            <Link
              to={`/brand-details/${brand.id}`}
              className="text-xs font-semibold text-primary-strong dark:text-primary inline-flex items-center gap-1"
            >
              {brand.name}
              <ChevronRight size={12} />
            </Link>
          )}
          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{product.description}</p>

          <div className="grid grid-cols-2 gap-3">
            {details.map((detail) => (
              <div
                key={detail.label}
                className="bg-primary/10 dark:bg-primary-strong/20 rounded-xl p-3 border border-primary/20 dark:border-primary-strong/30"
              >
                <div className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  {detail.label}
                </div>
                <div className="text-sm font-bold text-gray-800 dark:text-gray-200 mt-1">{detail.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-4 shadow-sm space-y-3 transition-colors duration-300">
          <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">How Incentify Online Works?</div>
          <div className="grid grid-cols-3 gap-3">
            {steps.map((step) => (
              <div
                key={step.title}
                className="bg-primary/10 dark:bg-primary-strong/20 border border-primary/20 dark:border-primary-strong/30 rounded-xl p-3 text-center space-y-2"
              >
                <div className="w-8 h-8 rounded-full bg-white dark:bg-zinc-800 shadow-sm border border-primary/20 dark:border-zinc-700 flex items-center justify-center mx-auto">
                  {step.icon}
                </div>
                <div className="text-[10px] font-semibold text-gray-700 dark:text-gray-300">{step.title}</div>
                <div className="text-[9px] text-gray-500 dark:text-gray-400 leading-snug">{step.description}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductInfo;
