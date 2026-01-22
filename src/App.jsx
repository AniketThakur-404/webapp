import React from 'react';
import { BrowserRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import GiftCards from './pages/GiftCards';
import GiftCardsList from './pages/GiftCardsList';
import GiftCardInfo from './pages/GiftCardInfo';
import BrandDetails from './pages/BrandDetails';
import ProductInfo from './pages/ProductInfo';
import LiquidGlassDemo from './pages/LiquidGlassDemo';
import Wallet from './pages/Wallet';
import Store from './pages/Store';
import AdminDashboard from './pages/AdminDashboard';
import VendorDashboard from './pages/VendorDashboard';
import HelpSupport from './pages/HelpSupport';
import { ThemeProvider } from './components/ThemeProvider';
import RedeemQr from './pages/RedeemQr';

function App() {
  const AppLayout = () => (
    <Layout>
      <Outlet />
    </Layout>
  );

  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <BrowserRouter>
        <Routes>
          <Route path="/admin" element={<Navigate to="/admin/overview" replace />} />
          <Route path="/admin/:section" element={<AdminDashboard />} />
          <Route path="/admin/:section/:subSection" element={<AdminDashboard />} />
          <Route path="/vendor-dashboard" element={<VendorDashboard />} />
          <Route path="/vendor" element={<VendorDashboard />} />
          <Route path="/vendor/:section" element={<VendorDashboard />} />
          <Route path="/redeem/:hash" element={<RedeemQr />} />
          <Route element={<AppLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/gift-cards" element={<GiftCards />} />
            <Route path="/gift-cards-list" element={<GiftCardsList />} />
            <Route path="/gift-cards-list/:categoryId" element={<GiftCardsList />} />
            <Route path="/gift-card-info" element={<GiftCardInfo />} />
            <Route path="/gift-card-info/:id" element={<GiftCardInfo />} />
            <Route path="/wallet" element={<Wallet />} />
            <Route path="/store" element={<Store />} />
            <Route path="/brand-details" element={<BrandDetails />} />
            <Route path="/brand-details/:id" element={<BrandDetails />} />
            <Route path="/product-info" element={<ProductInfo />} />
            <Route path="/product-info/:id" element={<ProductInfo />} />
            <Route path="/product-info" element={<ProductInfo />} />
            <Route path="/product-info/:id" element={<ProductInfo />} />
            <Route path="/liquid-glass" element={<LiquidGlassDemo />} />
            <Route path="/help" element={<HelpSupport />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
