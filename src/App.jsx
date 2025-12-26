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
import Wallet from './pages/Wallet';
import VendorDashboard from './pages/VendorDashboard';
import { ThemeProvider } from './components/ThemeProvider';

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
            <Route path="/vendor-dashboard" element={<VendorDashboard />} />
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
