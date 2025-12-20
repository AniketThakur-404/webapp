import React, { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Calendar, ChevronLeft, Package, Percent, ShoppingBag } from 'lucide-react';
import { giftCardCategories, giftCards } from '../data/giftcards';

const GiftCardInfo = () => {
  const { id } = useParams();
  const giftCard = giftCards.find((card) => card.id === id) || giftCards[0];
  const category = giftCardCategories.find((item) => item.id === giftCard.categoryId);

  const [amount, setAmount] = useState('');

  const amountOptions = useMemo(() => giftCard.amountOptions || [], [giftCard.amountOptions]);
  const minText = giftCard.minAmount.toLocaleString('en-IN');
  const maxText = giftCard.maxAmount.toLocaleString('en-IN');

  const features = [
    {
      label: giftCard.delivery,
      icon: <Package size={16} className="text-rose-600" />,
      bg: 'bg-rose-50',
    },
    {
      label: `Valid for ${giftCard.validityDays} day`,
      icon: <Calendar size={16} className="text-teal-600" />,
      bg: 'bg-teal-50',
    },
    {
      label: giftCard.noMinOrder ? 'No Minimum Order' : 'Minimum Order',
      icon: <ShoppingBag size={16} className="text-amber-600" />,
      bg: 'bg-amber-50',
    },
  ];

  return (
    <div className="bg-blue-50/70 min-h-full pb-24">
      <div className="px-4 pt-4">
        <div className="flex items-center gap-3">
          <Link
            to={category ? `/gift-cards-list/${category.id}` : '/gift-cards'}
            className="w-9 h-9 rounded-full border border-gray-100 bg-white shadow-sm flex items-center justify-center"
          >
            <ChevronLeft size={18} className="text-gray-700" />
          </Link>
          <h2 className="text-base font-semibold text-gray-800">{giftCard.name}</h2>
        </div>
      </div>

      <div className="px-4 mt-4 space-y-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-center gap-3">
          <img
            src={giftCard.logo}
            alt={giftCard.name}
            className="w-14 h-14 rounded-xl object-cover bg-gray-50"
          />
          <div className="flex-1">
            <div className="text-sm font-semibold text-gray-900">{giftCard.name}</div>
            <div className="text-green-600 text-xs font-semibold mt-1 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                <Percent size={12} className="text-green-600" />
              </span>
              Get Flat {giftCard.discount} Instant Discount.
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm space-y-3">
          <input
            type="text"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="Enter amount"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          <div className="text-[11px] text-gray-500">
            Min: Rs {minText} & Max: Rs {maxText}
          </div>
          <div className="text-sm font-semibold text-gray-800">Change Amount</div>
          <div className="grid grid-cols-4 gap-2">
            {amountOptions.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setAmount(String(value))}
                className="text-xs font-semibold bg-gray-50 border border-gray-200 rounded-full py-2 hover:border-blue-400 hover:text-blue-700 transition-colors"
              >
                Rs {value}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="grid grid-cols-3 gap-3">
            {features.map((feature) => (
              <div
                key={feature.label}
                className={`rounded-xl p-3 text-center ${feature.bg} border border-gray-100`}
              >
                <div className="w-9 h-9 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center mx-auto">
                  {feature.icon}
                </div>
                <div className="text-[10px] text-gray-700 font-semibold mt-2">{feature.label}</div>
              </div>
            ))}
          </div>
        </div>

        <details className="bg-blue-100/70 rounded-2xl border border-blue-100 shadow-sm">
          <summary className="cursor-pointer list-none px-4 py-3 text-xs font-semibold text-gray-700">
            Description
          </summary>
          <div className="px-4 pb-4 text-xs text-gray-600 leading-relaxed">
            {giftCard.description}
          </div>
        </details>

        <details className="bg-blue-100/70 rounded-2xl border border-blue-100 shadow-sm">
          <summary className="cursor-pointer list-none px-4 py-3 text-xs font-semibold text-gray-700">
            Terms and Conditions
          </summary>
          <div className="px-4 pb-4 text-xs text-gray-600 leading-relaxed space-y-2">
            {giftCard.terms.map((term) => (
              <div key={term}>{term}</div>
            ))}
          </div>
        </details>

        <button className="w-full bg-blue-600 text-white py-3 rounded-2xl font-semibold shadow-lg shadow-blue-200">
          Buy Now
        </button>
      </div>
    </div>
  );
};

export default GiftCardInfo;
