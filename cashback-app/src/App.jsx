import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import GiftCards from './pages/GiftCards';

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
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/gift-cards" element={<GiftCards />} />
          <Route path="/wallet" element={<Wallet />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
