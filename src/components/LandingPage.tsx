import React from 'react';
import { ArrowRight, Star, Zap, Shield, Search, Code, Layout, Eye, Download, Sparkles, Globe, Rocket } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  return (
    <div className="landing-page min-h-screen bg-slate-950">
      {/* Hero Section */}
      <section className="hero-section relative overflow-hidden min-h-screen flex items-center justify-center py-20">
        <div className="cosmic-gradient absolute inset-0 pointer-events-none"></div>
        <div className="cosmic-stars absolute inset-0 pointer-events-none"></div>
        
        {/* Floating Orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 -left-10 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-1/3 -right-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute -bottom-20 left-1/3 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col items-center text-center max-w-5xl mx-auto relative">
            <div className="cosmic-logo-container mb-12 relative group">
              <div className="cosmic-logo-glow absolute inset-0 rounded-full"></div>
              <div className="cosmic-logo relative flex items-center justify-center h-32 w-32 rounded-full bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 p-6">
                <Star className="h-16 w-16 text-white" />
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-600/20 to-purple-600/20 blur-xl group-hover:blur-2xl transition-all duration-500"></div>
              </div>
            </div>
            
            <h1 className="cosmic-title text-6xl md:text-8xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 relative">
              StarWeb Analyzer
              <Sparkles className="absolute -top-8 -right-8 w-12 h-12 text-purple-400 animate-pulse" />
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-300/90 max-w-3xl mb-12 leading-relaxed font-light">
              Discover the universe of opportunities to improve your website with our
              <span className="relative inline-block px-2">
                <span className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-indigo-400/20 blur-sm"></span>
                <span className="relative bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent font-medium">
                  AI-powered
                </span>
              </span>
              analysis tool
            </p>
            
            <div className="relative z-20">
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onGetStarted();
                }}
                type="button"
                className="relative inline-flex items-center gap-3 px-10 py-5 text-lg font-medium text-white transition-all duration-300 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-2xl hover:shadow-lg hover:shadow-purple-500/25 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-purple-500/50 active:translate-y-0 z-50"
              >
                <span className="relative z-50">Get Started</span>
                <ArrowRight className="w-6 h-6 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="features-section py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/5 to-transparent"></div>
        <div className="container mx-auto px-6 relative">
          <div className="text-center mb-20">
            <div className="inline-flex items-center justify-center p-3 mb-6 rounded-2xl bg-blue-500/10 backdrop-blur-sm">
              <Globe className="w-8 h-8 text-blue-400" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
              Powerful Analysis Features
            </h2>
            <p className="mt-6 text-xl text-slate-400 max-w-2xl mx-auto font-light">
              Comprehensive tools to analyze and improve every aspect of your website
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Eye className="h-8 w-8" />,
                title: "Visual Analysis",
                description: "Identify exit points and design issues with interactive visualizations",
                gradient: "from-blue-600 to-blue-400",
                bgGradient: "from-blue-600/10 to-blue-400/10"
              },
              {
                icon: <Code className="h-8 w-8" />,
                title: "Asset Optimization",
                description: "Analyze and optimize your website's assets for better performance",
                gradient: "from-purple-600 to-purple-400",
                bgGradient: "from-purple-600/10 to-purple-400/10"
              },
              {
                icon: <Layout className="h-8 w-8" />,
                title: "Content Analysis",
                description: "Evaluate content structure and SEO optimization",
                gradient: "from-indigo-600 to-indigo-400",
                bgGradient: "from-indigo-600/10 to-indigo-400/10"
              },
              {
                icon: <Zap className="h-8 w-8" />,
                title: "Performance Insights",
                description: "Get detailed metrics and speed optimization recommendations",
                gradient: "from-green-600 to-green-400",
                bgGradient: "from-green-600/10 to-green-400/10"
              },
              {
                icon: <Shield className="h-8 w-8" />,
                title: "Accessibility Check",
                description: "Ensure your website is accessible to all users",
                gradient: "from-red-600 to-red-400",
                bgGradient: "from-red-600/10 to-red-400/10"
              },
              {
                icon: <Search className="h-8 w-8" />,
                title: "SEO Optimization",
                description: "Improve search engine rankings and visibility",
                gradient: "from-orange-600 to-orange-400",
                bgGradient: "from-orange-600/10 to-orange-400/10"
              }
            ].map((feature, index) => (
              <div key={index} className="feature-card group">
                <div className="feature-icon-container mb-6">
                  <div className={`feature-icon-bg bg-gradient-to-br ${feature.bgGradient}`}>
                    <div className={`text-transparent bg-gradient-to-br ${feature.gradient} bg-clip-text`}>
                      {feature.icon}
                    </div>
                  </div>
                </div>
                <h3 className={`text-2xl font-semibold mb-4 bg-gradient-to-br ${feature.gradient} bg-clip-text text-transparent`}>
                  {feature.title}
                </h3>
                <p className="text-lg text-slate-400 group-hover:text-slate-300 transition-colors duration-300 font-light">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* How It Works Section */}
      <section className="how-it-works-section py-32 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] animate-pulse delay-700"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/5 rounded-full blur-[120px] animate-pulse delay-1000"></div>
        </div>

        <div className="container mx-auto px-6 relative">
          {/* Section Header */}
          <div className="text-center mb-24">
            <div className="inline-flex items-center justify-center p-4 mb-8 rounded-2xl bg-indigo-500/10 backdrop-blur-sm border border-indigo-500/20 transform hover:scale-110 transition-transform duration-500">
              <Rocket className="w-10 h-10 text-indigo-400 animate-bounce" />
            </div>
            <h2 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-blue-400 mb-8">
              How It Works
            </h2>
            <p className="mt-6 text-xl text-slate-300 max-w-3xl mx-auto font-light leading-relaxed">
              Experience the power of <span className="text-indigo-400 font-medium">AI-driven</span> website analysis in four simple steps
            </p>
          </div>

          {/* Steps Container */}
          <div className="steps-container max-w-6xl mx-auto relative">
            {/* Animated Connection Line */}
            <div className="steps-connection-line absolute left-[28px] md:left-1/2 top-0 bottom-0 transform -translate-x-1/2"></div>

            {/* Steps */}
            {[
              {
                number: "1",
                title: "Enter Your Website",
                description: "Simply paste your website URL and let our AI-powered system begin the comprehensive analysis process.",
                icon: <Globe className="h-6 w-6" />,
                gradient: {
                  from: "rgb(56, 189, 248)",
                  to: "rgb(59, 130, 246)",
                  shadow: "59, 130, 246"
                }
              },
              {
                number: "2",
                title: "AI Analysis in Action",
                description: "Watch as our advanced AI algorithms analyze your website's design, performance, and user experience in real-time.",
                icon: <Zap className="h-6 w-6" />,
                gradient: {
                  from: "rgb(168, 85, 247)",
                  to: "rgb(139, 92, 246)",
                  shadow: "139, 92, 246"
                }
              },
              {
                number: "3",
                title: "Visual Results",
                description: "Explore interactive visualizations that highlight areas for improvement with precise, actionable insights.",
                icon: <Eye className="h-6 w-6" />,
                gradient: {
                  from: "rgb(236, 72, 153)",
                  to: "rgb(219, 39, 119)",
                  shadow: "219, 39, 119"
                }
              },
              {
                number: "4",
                title: "Implement Changes",
                description: "Follow our detailed recommendations and watch your website transform into a more effective digital presence.",
                icon: <Download className="h-6 w-6" />,
                gradient: {
                  from: "rgb(34, 197, 94)",
                  to: "rgb(22, 163, 74)",
                  shadow: "22, 163, 74"
                }
              }
            ].map((step, index) => (
              <div 
                key={index}
                className={`step-card group relative flex flex-col md:flex-row items-start gap-8 mb-20 last:mb-0 ${
                  index % 2 === 0 ? 'md:pr-[50%] text-left' : 'md:pl-[50%] md:flex-row-reverse text-right'
                }`}
                style={{
                  '--gradient-from': step.gradient.from,
                  '--gradient-to': step.gradient.to,
                  '--shadow-color': step.gradient.shadow
                } as React.CSSProperties}
              >
                {/* Step Number and Icon */}
                <div className="flex items-center gap-6 relative z-10">
                  <div className="step-number h-16 w-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white relative overflow-hidden">
                    <span className="relative z-10">{step.number}</span>
                  </div>
                  <div className="hidden md:flex items-center justify-center h-14 w-14 rounded-xl bg-white/5 backdrop-blur-sm transform group-hover:scale-110 transition-all duration-500 border border-white/10">
                    {React.cloneElement(step.icon as React.ReactElement, {
                      className: `h-6 w-6 text-transparent bg-gradient-to-br from-[${step.gradient.from}] to-[${step.gradient.to}] bg-clip-text`
                    })}
                  </div>
                </div>

                {/* Content */}
                <div className="step-content flex-1">
                  <h3 className="text-2xl md:text-3xl font-semibold bg-gradient-to-br from-white to-white/80 bg-clip-text text-transparent">
                    {step.title}
                  </h3>
                  <p className="text-lg text-slate-400 mt-4">
                    {step.description}
                  </p>
                </div>

                {/* Decorative Elements */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Export Options Section */}
      <section className="export-section py-32 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-[100px] animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] animate-pulse delay-700"></div>
        </div>
        
        <div className="container mx-auto px-6 relative">
          <div className="text-center mb-24">
            <div className="inline-flex items-center justify-center p-4 mb-8 rounded-2xl bg-blue-500/10 backdrop-blur-sm border border-blue-500/20 transform hover:scale-110 transition-transform duration-500">
              <Download className="w-10 h-10 text-blue-400" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 mb-8">
              Comprehensive Reports
            </h2>
            <p className="mt-6 text-xl text-slate-300 max-w-3xl mx-auto font-light leading-relaxed">
              Export your analysis results in multiple formats for <span className="text-blue-400 font-medium">easy sharing</span> and collaboration
            </p>
          </div>
          
          <div className="export-cards grid md:grid-cols-2 gap-12 max-w-4xl mx-auto">
            {[
              {
                icon: <Download className="h-12 w-12 text-red-400" />,
                title: "PDF Report",
                description: "Download a beautifully formatted PDF report with detailed insights and recommendations",
                gradient: "from-red-600/20 to-red-400/20",
                textGradient: "from-red-400 to-orange-400",
                shadowColor: "239, 68, 68"
              },
              {
                icon: <Download className="h-12 w-12 text-blue-400" />,
                title: "Word Document",
                description: "Export as an editable Word document for further customization and team collaboration",
                gradient: "from-blue-600/20 to-blue-400/20",
                textGradient: "from-blue-400 to-indigo-400",
                shadowColor: "59, 130, 246"
              }
            ].map((option, index) => (
              <div 
                key={index} 
                className="export-card group"
                style={{ '--shadow-color': option.shadowColor } as React.CSSProperties}
              >
                <div className="export-icon-container mb-8">
                  <div className={`export-icon-bg h-24 w-24 mx-auto rounded-2xl bg-gradient-to-br ${option.gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 backdrop-blur-xl border border-white/10`}>
                    {option.icon}
                  </div>
                </div>
                <h3 className={`text-3xl font-semibold mb-4 text-center bg-gradient-to-r ${option.textGradient} bg-clip-text text-transparent`}>
                  {option.title}
                </h3>
                <p className="text-lg text-slate-400 text-center group-hover:text-slate-300 transition-colors duration-300">
                  {option.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="cta-section py-20 relative overflow-hidden">
        <div className="cosmic-gradient absolute inset-0 bg-gradient-to-br from-indigo-900/30 via-purple-900/30 to-blue-900/30 pointer-events-none"></div>
        <div className="cosmic-stars absolute inset-0 pointer-events-none"></div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="cta-content max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 relative inline-flex items-center gap-4">
              Ready to Improve Your Website?
              <Sparkles className="w-8 h-8 text-purple-400 animate-pulse" />
            </h2>
            
            <p className="text-xl text-slate-300 mb-10 leading-relaxed">
              Start analyzing your website today and discover opportunities for improvement
            </p>
            
            <div className="relative z-20">
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onGetStarted();
                }}
                type="button"
                className="relative inline-flex items-center gap-3 px-8 py-4 text-lg font-medium text-white transition-all duration-300 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl hover:shadow-lg hover:shadow-purple-500/25 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-purple-500/50 active:translate-y-0 z-50"
              >
                <span className="relative z-50">Get Started Now</span>
                <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-12 relative overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3 group">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                <Star className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                StarWeb
              </span>
            </div>
            
            <div className="text-slate-500 text-sm font-light">
              © {new Date().getFullYear()} StarWeb Analyzer. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}; 