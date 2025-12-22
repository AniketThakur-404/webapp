import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import GiftCards from './pages/GiftCards';
import GiftCardsList from './pages/GiftCardsList';
import GiftCardInfo from './pages/GiftCardInfo';
import BrandDetails from './pages/BrandDetails';
import ProductInfo from './pages/ProductInfo';
import LiquidGlassDemo from './pages/LiquidGlassDemo';
import { ThemeProvider } from './components/ThemeProvider';

const Wallet = () => (
  <div className="flex flex-col items-center justify-center h-full p-8 text-center text-gray-500">
    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
      📦
    </div>
    <h2 className="text-lg font-bold text-gray-800">Wallet Coming Soon</h2>
    <p className="text-sm mt-2">Your vCash balance and transactions will appear here.</p>
  </div>
);

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/gift-cards" element={<GiftCards />} />
            <Route path="/gift-cards-list" element={<GiftCardsList />} />
            <Route path="/gift-cards-list/:categoryId" element={<GiftCardsList />} />
            <Route path="/gift-card-info" element={<GiftCardInfo />} />
            <Route path="/gift-card-info/:id" element={<GiftCardInfo />} />
            <Route path="/wallet" element={<Wallet />} />
            <Route path="/brand-details" element={<BrandDetails />} />
            <Route path="/brand-details/:id" element={<BrandDetails />} />
            <Route path="/product-info" element={<ProductInfo />} />
            <Route path="/product-info/:id" element={<ProductInfo />} />
            <Route path="/liquid-glass" element={<LiquidGlassDemo />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
