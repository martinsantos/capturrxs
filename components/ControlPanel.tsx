import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { CaptureConfig, Resolution } from '../types';

interface ControlPanelProps {
  onCapture: (url: string, config: CaptureConfig) => void;
  isProcessing: boolean;
}

const DESKTOP_RESOLUTIONS: Resolution[] = [
  { label: 'MacBook Air (1440x900)', width: 1440, height: 900 },
  { label: 'Full HD (1920x1080)', width: 1920, height: 1080 },
  { label: 'Laptop (1366x768)', width: 1366, height: 768 },
  { label: '4K UHD (3840x2160)', width: 3840, height: 2160 },
];

const MOBILE_RESOLUTIONS: Resolution[] = [
  { label: 'iPhone 14/15 Pro (393x852)', width: 393, height: 852 },
  { label: 'iPhone Pro Max (430x932)', width: 430, height: 932 },
  { label: 'Pixel 7 (412x915)', width: 412, height: 915 },
  { label: 'Compact Android (360x800)', width: 360, height: 800 },
];

export const ControlPanel: React.FC<ControlPanelProps> = ({ onCapture, isProcessing }) => {
  const [url, setUrl] = useState('');
  const [config, setConfig] = useState<CaptureConfig>({
    desktop: true,
    mobile: true,
    desktopRes: DESKTOP_RESOLUTIONS[0],
    mobileRes: MOBILE_RESOLUTIONS[0],
    fullPage: true,
    autoDownload: true,
    depth: 1,
    filenameTemplate: '{domain}_{date}_{viewport}',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedInput = url.trim();
    if (!trimmedInput) {
      toast.error('Please enter a website URL');
      return;
    }
    
    // Intelligent URL fixing
    let processedUrl = trimmedInput;
    
    // 1. Remove accidental spaces
    processedUrl = processedUrl.replace(/\s/g, '');

    // 2. Add protocol if missing
    if (!/^https?:\/\//i.test(processedUrl)) {
        processedUrl = 'https://' + processedUrl;
    }

    // 3. Validate structure
    try {
        const urlObj = new URL(processedUrl);
        // Ensure we have a valid hostname (needs at least one dot usually, and not empty)
        if (!urlObj.hostname || !urlObj.hostname.includes('.') || urlObj.hostname.length < 4) {
             toast.error('Please enter a valid domain name (e.g., example.com)');
             return;
        }
        
        onCapture(processedUrl, config);
    } catch (e) {
        toast.error('Invalid URL format. Please check for typos.');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl shadow-indigo-100 border border-indigo-50 p-6 md:p-8 transition-all hover:shadow-2xl hover:shadow-indigo-200/50">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="url-input" className="block text-sm font-medium text-gray-700 ml-1">
            Target Website URL
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-500 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </div>
            <input
              id="url-input"
              type="text"
              placeholder="example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isProcessing}
              className="block w-full pl-11 pr-4 py-4 bg-gray-50 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-lg"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Config Controls */}
          <div className="flex flex-col space-y-5">
             
             {/* Viewport Configuration */}
             <div className="bg-gray-50/80 p-4 rounded-xl border border-gray-100 space-y-3">
                 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Viewport Configuration</label>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     {/* Desktop Settings */}
                     <div className={`space-y-2 transition-opacity duration-200 ${config.desktop ? 'opacity-100' : 'opacity-60'}`}>
                        <label className="flex items-center space-x-2 cursor-pointer group">
                          <input 
                            type="checkbox" 
                            checked={config.desktop} 
                            onChange={e => setConfig(c => ({...c, desktop: e.target.checked}))}
                            className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300 transition-colors cursor-pointer"
                          />
                          <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700 group-hover:text-indigo-600 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
                            <span>Desktop</span>
                          </div>
                        </label>
                        <select 
                            disabled={!config.desktop}
                            value={config.desktopRes.label}
                            onChange={(e) => {
                                const res = DESKTOP_RESOLUTIONS.find(r => r.label === e.target.value);
                                if (res) setConfig(c => ({...c, desktopRes: res}));
                            }}
                            className="w-full text-xs p-2 rounded-lg border border-gray-200 bg-white text-gray-600 focus:ring-1 focus:ring-indigo-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                        >
                            {DESKTOP_RESOLUTIONS.map(r => (
                                <option key={r.label} value={r.label}>{r.label}</option>
                            ))}
                        </select>
                     </div>

                     {/* Mobile Settings */}
                     <div className={`space-y-2 transition-opacity duration-200 ${config.mobile ? 'opacity-100' : 'opacity-60'}`}>
                        <label className="flex items-center space-x-2 cursor-pointer group">
                          <input 
                            type="checkbox" 
                            checked={config.mobile} 
                            onChange={e => setConfig(c => ({...c, mobile: e.target.checked}))}
                            className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300 transition-colors cursor-pointer"
                          />
                          <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700 group-hover:text-indigo-600 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
                            <span>Mobile</span>
                          </div>
                        </label>
                        <select 
                            disabled={!config.mobile}
                            value={config.mobileRes.label}
                            onChange={(e) => {
                                const res = MOBILE_RESOLUTIONS.find(r => r.label === e.target.value);
                                if (res) setConfig(c => ({...c, mobileRes: res}));
                            }}
                            className="w-full text-xs p-2 rounded-lg border border-gray-200 bg-white text-gray-600 focus:ring-1 focus:ring-indigo-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                        >
                            {MOBILE_RESOLUTIONS.map(r => (
                                <option key={r.label} value={r.label}>{r.label}</option>
                            ))}
                        </select>
                     </div>
                 </div>
             </div>

             <div className="flex flex-wrap items-center gap-4 pt-2">
                <div className="flex flex-col flex-1 min-w-[120px]">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Crawl Depth</label>
                  <div className="flex items-center space-x-3 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                    <input 
                      type="range" 
                      min="1" 
                      max="3" 
                      step="1"
                      value={config.depth} 
                      onChange={e => setConfig(c => ({...c, depth: parseInt(e.target.value)}))}
                      className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded min-w-[3.5rem] text-center border border-indigo-100">
                      Lvl {config.depth}
                    </span>
                  </div>
                </div>

                <div className="h-10 w-px bg-gray-200 mx-2 hidden sm:block"></div>

                <div className="flex flex-col flex-1 min-w-[150px]">
                     <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Capture Options</label>
                     <div className="flex gap-2">
                        <label className="flex flex-1 items-center space-x-2 cursor-pointer group bg-gray-50 px-3 py-2 rounded-lg border border-gray-100 h-[42px] hover:bg-white hover:border-indigo-200 transition-colors">
                          <input 
                            type="checkbox" 
                            checked={config.fullPage} 
                            onChange={e => setConfig(c => ({...c, fullPage: e.target.checked}))}
                            className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300 transition-colors cursor-pointer"
                          />
                          <span className="text-gray-600 group-hover:text-indigo-600 text-xs font-medium whitespace-nowrap">Full Page</span>
                        </label>

                        <label className="flex flex-1 items-center space-x-2 cursor-pointer group bg-gray-50 px-3 py-2 rounded-lg border border-gray-100 h-[42px] hover:bg-white hover:border-emerald-200 transition-colors">
                          <input 
                            type="checkbox" 
                            checked={config.autoDownload} 
                            onChange={e => setConfig(c => ({...c, autoDownload: e.target.checked}))}
                            className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 border-gray-300 transition-colors cursor-pointer"
                          />
                          <span className="text-gray-600 group-hover:text-emerald-600 text-xs font-medium whitespace-nowrap">Auto Zip</span>
                        </label>
                     </div>
                </div>
             </div>

             {/* Filename Template Configuration */}
             <div className="pt-2 border-t border-gray-100">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">
                    Filename Format
                </label>
                <div className="relative">
                    <input 
                        type="text" 
                        value={config.filenameTemplate}
                        onChange={e => setConfig(c => ({...c, filenameTemplate: e.target.value}))}
                        className="w-full text-xs p-2.5 pl-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none text-gray-600 font-mono"
                        placeholder="{domain}_{date}_{viewport}"
                    />
                </div>
                <div className="text-[10px] text-gray-400 mt-2 flex flex-wrap gap-1.5 select-none">
                    <span title="Domain name" className="bg-gray-50 px-1.5 py-0.5 rounded border border-gray-200 cursor-help hover:text-indigo-600 hover:border-indigo-200 transition-colors">{'{domain}'}</span>
                    <span title="Date (YYYY-MM-DD)" className="bg-gray-50 px-1.5 py-0.5 rounded border border-gray-200 cursor-help hover:text-indigo-600 hover:border-indigo-200 transition-colors">{'{date}'}</span>
                    <span title="Time (HH-mm)" className="bg-gray-50 px-1.5 py-0.5 rounded border border-gray-200 cursor-help hover:text-indigo-600 hover:border-indigo-200 transition-colors">{'{time}'}</span>
                    <span title="Viewport Type" className="bg-gray-50 px-1.5 py-0.5 rounded border border-gray-200 cursor-help hover:text-indigo-600 hover:border-indigo-200 transition-colors">{'{viewport}'}</span>
                    <span title="Sequential Index" className="bg-gray-50 px-1.5 py-0.5 rounded border border-gray-200 cursor-help hover:text-indigo-600 hover:border-indigo-200 transition-colors">{'{index}'}</span>
                </div>
             </div>
          </div>

          <div className="flex items-end justify-end">
             <button
              type="submit"
              disabled={isProcessing || (!config.desktop && !config.mobile)}
              className={`
                w-full md:w-auto relative px-8 py-4 rounded-xl font-semibold text-white shadow-lg transition-all transform 
                ${isProcessing 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-[1.02] hover:shadow-indigo-300/50 active:scale-95'
                }
              `}
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Crawling...</span>
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                  Start Capture
                </span>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};