/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Header } from './components/Header/Header';
import { Footer } from './components/Footer/Footer';
import { MapSection } from './components/Dashboard/Dashboard';
import { StatsDetails } from './components/StatsDetails/StateDetails';
import AboutPage from './pages/About/About';
import MethodologyPage from './pages/Methodology/Methodology';
import DataCatalogPage from './pages/DataCatalog/DataCatalog';
import type { ViewType } from '../types';
import { StateDemographics_v3 } from './components/Hero/StateDemographics/StateDemographics_v3';
import { TooltipProvider } from './components/ui/tooltip';

import { HeroSection } from './components/Hero/HeroSection';
import { OdishaChart } from './components/Chart/OdishaChart';



const Dashboard: React.FC = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const [currentView, setCurrentView] = useState<ViewType>('Demographics');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('Odisha');
  const [selectedData, setSelectedData] = useState<any>(null);
  const [allDistrictsData, setAllDistrictsData] = useState<any[]>([]);

  return (
    <>
      {/* Hero */}
      <HeroSection />

      {/* Map & Stats Section */}
      <div className="border-t border-gray-100">
        <MapSection
          currentView={currentView}
          onViewChange={setCurrentView}
          onDistrictChange={setSelectedDistrict}
          onDataChange={setSelectedData}
          onDataLoad={setAllDistrictsData}
          targetDistrict={selectedDistrict}
        />
      </div>

      {/* Odisha Chart Section */}
      {(!selectedDistrict || selectedDistrict.toLowerCase() === 'odisha') && (
        <OdishaChart />
      )}

      <div
        className={`relative ${!selectedDistrict || selectedDistrict.toLowerCase() === 'odisha'
          ? 'h-[500px] overflow-hidden'
          : 'min-h-[480px]'
          }`}
      >
        {(!selectedDistrict || selectedDistrict.toLowerCase() === 'odisha') && (
          <div className="absolute inset-0 z-[900] bg-white/60 backdrop-blur-xl flex flex-col items-center justify-center text-center p-8 transition-all duration-700 animate-in fade-in">
            <div className="max-w-2xl transform transition-all duration-1000 slide-in-from-bottom-8">
              <h2 className="text-3xl md:text-5xl font-black text-gray-900 tracking-[0.05em] uppercase mb-6 leading-[1.1] font-mono">
                Select a <span className="text-[#F76000]">District</span> <br />{' '}
                to view its
                <br />
                Overview and Details
              </h2>
              <div className="w-24 h-1.5 bg-[#F76000] mx-auto mb-6 rounded-full" />
              <p className="text-gray-500 text-[11px] font-black uppercase tracking-[0.3em] max-w-md mx-auto leading-relaxed">
                Choose a specific district on the map above to unlock detailed
                demographics, landscape trends, and statistical insights.
              </p>
            </div>
          </div>
        )}

        {/* District Overview */}
        <div className="border-t border-gray-100 bg-gray-50 mb-[20px]">
          <StateDemographics_v3
            selectedDistrict={selectedDistrict}
            selectedData={selectedData}
            allDistrictsData={allDistrictsData}
          />
          <div className="border-t border-gray-100"></div>
        </div>

        {/* Detailed Stats */}
        <div >
          <StatsDetails
            selectedDistrict={selectedDistrict}
            onDistrictSelect={setSelectedDistrict}
            data={selectedData}
            allDistrictsData={allDistrictsData}
          />
        </div>
      </div >
    </>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <TooltipProvider>
        <div className="flex flex-col min-h-screen bg-background">
          <Header />

          <div className="flex-1">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/methodology" element={<MethodologyPage />} />
              <Route path="/catalog" element={<DataCatalogPage />} />
            </Routes>
            <Footer />
          </div>
        </div>
      </TooltipProvider>
    </Router>
  );
};

export default App;