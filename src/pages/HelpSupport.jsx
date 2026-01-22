import React, { useState } from 'react';
import { MessageSquare, ChevronDown, ChevronUp, Mail, Phone, ChevronRight, HelpCircle } from 'lucide-react';

const HelpSupport = () => {
    const faqs = [
        {
            question: "How do I enter my code?",
            answer: "You can enter your code on the home page by tapping the 'Scan' button or manually entering the alphanumeric code found on your product."
        },
        {
            question: "Why is my code showing as invalid?",
            answer: "Please double-check for typos. If the code is still invalid, it might have already been used or expired. Contact support if you believe this is an error."
        },
        {
            question: "How long does cashback take to credit?",
            answer: "Cashback is usually credited instantly to your vCash wallet after a successful code redemption."
        },
        {
            question: "How do I transfer money to my UPI?",
            answer: "Go to your Wallet, select 'Withdraw', enter the amount and your UPI ID. Transfers are processed within 24 hours."
        },
        {
            question: "What if my UPI transfer fails?",
            answer: "Don't worry! If a transfer fails, the amount is automatically refunded to your Cashback Wallet within 24-48 hours."
        },
        {
            question: "Can I use a code more than once?",
            answer: "No, each unique code can only be redeemed once."
        }
    ];

    const [openIndex, setOpenIndex] = useState(4); // Default open index to match reference

    const toggleFaq = (index) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <div className="p-4 space-y-6 pb-20">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Help & Support</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Find answers or get in touch with us</p>
            </div>

            {/* Chat Banner */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500 to-green-500 p-5 shadow-lg">
                <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm text-white">
                            <MessageSquare size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-base">Chat with RewardBot</h3>
                            <p className="text-xs text-white/90 font-medium">Get instant help 24/7</p>
                        </div>
                    </div>
                    <button className="flex items-center gap-1 rounded-lg bg-white/20 px-4 py-2 text-xs font-bold text-white backdrop-blur-md transition-colors hover:bg-white/30">
                        Start Chat <ChevronRight size={14} />
                    </button>
                </div>
                {/* Decorative circles */}
                <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl"></div>
                <div className="absolute -left-6 -bottom-6 h-24 w-24 rounded-full bg-white/10 blur-2xl"></div>
            </div>

            {/* FAQs */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-zinc-800">
                <div className="flex items-center gap-2 mb-4">
                    <HelpCircle size={18} className="text-orange-500" />
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200">Frequently Asked Questions</h3>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-zinc-800">
                    {faqs.map((faq, index) => (
                        <div key={index} className="py-3 last:pb-0">
                            <button
                                onClick={() => toggleFaq(index)}
                                className="flex w-full items-center justify-between text-left"
                            >
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 pr-4">{faq.question}</span>
                                {openIndex === index ? (
                                    <ChevronUp size={16} className="text-gray-400 min-w-[16px]" />
                                ) : (
                                    <ChevronDown size={16} className="text-gray-400 min-w-[16px]" />
                                )}
                            </button>
                            {openIndex === index && (
                                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 leading-relaxed pl-0 pr-4">
                                    {faq.answer}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Contact Support */}
            <div>
                <div className="mb-3">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200">Still Need Help?</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Reach out to our support team</p>
                </div>
                <div className="space-y-3">
                    <div className="flex items-center gap-4 rounded-xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20 text-orange-500">
                            <Mail size={18} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 font-medium">Email Support</p>
                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">support@rewardport.in</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 rounded-xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20 text-green-500">
                            <Phone size={18} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 font-medium">Call Us</p>
                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">1800-123-456 (Toll Free)</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="py-6 text-center">
                <div className="flex justify-center gap-4 text-[10px] text-gray-500 dark:text-gray-400 mb-2">
                    <span>Terms & Conditions</span>
                    <span>•</span>
                    <span>Privacy Policy</span>
                    <span>•</span>
                    <span>For Brands</span>
                </div>
                <p className="text-[10px] text-gray-400">
                    <span className="text-orange-500 font-bold">○</span> Powered by RewardPort • Secure & Trusted
                </p>
            </div>
        </div>
    );
};

export default HelpSupport;
