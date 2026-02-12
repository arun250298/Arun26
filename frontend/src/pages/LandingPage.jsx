import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { HardHat, Receipt, Camera, TrendingUp, Shield, Smartphone } from "lucide-react";

const LandingPage = () => {
  const navigate = useNavigate();

  const handleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + "/dashboard";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1593630987785-98139c5f3cc6?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NDh8MHwxfHNlYXJjaHwzfHxjb25zdHJ1Y3Rpb24lMjBzaXRlJTIwYnVpbGRpbmclMjBzdHJ1Y3R1cmV8ZW58MHx8fHwxNzcwODc5OTQzfDA&ixlib=rb-4.1.0&q=85')"
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 to-slate-900/95"></div>
        </div>

        {/* Content */}
        <div className="relative px-4 py-12 md:py-20">
          {/* Header */}
          <header className="max-w-6xl mx-auto flex items-center justify-between mb-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                <HardHat className="w-6 h-6 md:w-7 md:h-7 text-white" />
              </div>
              <div>
                <h1 className="text-lg md:text-xl font-bold text-white">Dhaya Promoters</h1>
                <p className="text-xs md:text-sm text-slate-300">and Builders</p>
              </div>
            </div>
            <Button 
              onClick={handleLogin}
              data-testid="login-btn-header"
              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold h-11 px-6 rounded-lg shadow-lg active:scale-95 transition-all"
            >
              Sign In
            </Button>
          </header>

          {/* Hero Content */}
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight mb-6">
              Site Expense & Bill<br />
              <span className="text-orange-400">Tracking Made Simple</span>
            </h2>
            <p className="text-base md:text-lg text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
              Streamline your construction site management. Track bills, manage payments, 
              and generate reports — all from your mobile device.
            </p>
            <Button 
              onClick={handleLogin}
              data-testid="login-btn-hero"
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold h-14 px-10 text-lg rounded-xl shadow-xl active:scale-95 transition-all"
            >
              Get Started
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 md:py-24 px-4 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-2xl md:text-3xl font-bold text-slate-900 text-center mb-4">
            Everything You Need
          </h3>
          <p className="text-slate-600 text-center mb-12 max-w-xl mx-auto">
            Built for construction site staff and admins. Simple, fast, and reliable.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature Cards */}
            <FeatureCard 
              icon={<Receipt className="w-6 h-6" />}
              title="Bill Management"
              description="Add bills with photos. Track M-sand, Cement, Steel, Labour expenses."
              color="orange"
            />
            <FeatureCard 
              icon={<TrendingUp className="w-6 h-6" />}
              title="Payment Tracking"
              description="Record partial payments. Auto-calculate pending balances."
              color="emerald"
            />
            <FeatureCard 
              icon={<Camera className="w-6 h-6" />}
              title="Site Photos"
              description="Upload daily site photos. Keep visual records organized."
              color="blue"
            />
            <FeatureCard 
              icon={<Shield className="w-6 h-6" />}
              title="Role-Based Access"
              description="Staff add data. Admins manage everything with full control."
              color="violet"
            />
            <FeatureCard 
              icon={<Smartphone className="w-6 h-6" />}
              title="Mobile First"
              description="Designed for field use. Works great on any smartphone."
              color="pink"
            />
            <FeatureCard 
              icon={<HardHat className="w-6 h-6" />}
              title="Daily Reports"
              description="Auto-generate PDF reports. Track site-wise summaries."
              color="amber"
            />
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 px-4 bg-slate-900">
        <div className="max-w-3xl mx-auto text-center">
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Ready to streamline your site management?
          </h3>
          <p className="text-slate-400 mb-8">
            Sign in with Google to get started. No complex setup required.
          </p>
          <Button 
            onClick={handleLogin}
            data-testid="login-btn-cta"
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold h-14 px-10 text-lg rounded-xl shadow-xl active:scale-95 transition-all"
          >
            Sign In with Google
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 px-4 bg-slate-950">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <HardHat className="w-5 h-5 text-orange-500" />
            <span className="text-slate-400 text-sm">Dhaya Promoters and Builders</span>
          </div>
          <p className="text-slate-500 text-sm">
            © 2025 All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description, color }) => {
  const colorClasses = {
    orange: "bg-orange-100 text-orange-600",
    emerald: "bg-emerald-100 text-emerald-600",
    blue: "bg-blue-100 text-blue-600",
    violet: "bg-violet-100 text-violet-600",
    pink: "bg-pink-100 text-pink-600",
    amber: "bg-amber-100 text-amber-600"
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 hover:border-slate-300 hover:shadow-lg transition-all">
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${colorClasses[color]}`}>
        {icon}
      </div>
      <h4 className="font-bold text-slate-900 text-lg mb-2">{title}</h4>
      <p className="text-slate-600 text-sm leading-relaxed">{description}</p>
    </div>
  );
};

export default LandingPage;
