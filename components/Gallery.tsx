import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { ScreenshotTask, GeneratedImage } from '../types';

interface GalleryProps {
  task: ScreenshotTask;
  onAnalyze: (image: GeneratedImage) => void;
}

export const Gallery: React.FC<GalleryProps> = ({ task, onAnalyze }) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const handleDownload = async (image: GeneratedImage, format: 'jpeg' | 'png' | 'webp') => {
    setActiveMenu(null);
    const toastId = toast.loading(`Preparing ${format.toUpperCase()}...`);
    
    try {
      const link = document.createElement('a');
      // Strip existing extension if present
      const nameWithoutExt = image.filename.replace(/\.[^/.]+$/, "");
      const newFilename = `${nameWithoutExt}.${format === 'jpeg' ? 'jpg' : format}`;
      
      const targetMime = `image/${format}`;
      // Extract current mime from dataUrl if possible, default to jpeg
      const currentMime = image.dataUrl.match(/data:([^;]+);/)?.[1] || 'image/jpeg';

      // If format matches, download directly
      if (currentMime === targetMime) {
        link.href = image.dataUrl;
        link.download = newFilename;
        link.click();
        toast.dismiss(toastId);
        return;
      }

      // Conversion needed
      const img = new Image();
      img.src = image.dataUrl;
      await new Promise((resolve, reject) => { 
        img.onload = resolve;
        img.onerror = reject;
      });
      
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context failed');
      
      // Handle transparency for JPEGs by adding white background
      if (format === 'jpeg') {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      
      ctx.drawImage(img, 0, 0);
      
      // High quality for formats that support it
      const newDataUrl = canvas.toDataURL(targetMime, 0.92);
      
      link.href = newDataUrl;
      link.download = newFilename;
      link.click();
      
      toast.success('Downloaded!', { id: toastId });
    } catch (e) {
      console.error(e);
      toast.error('Export failed', { id: toastId });
    }
  };

  return (
    <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div>
           <h2 className="text-xl font-bold text-gray-900">Capture Results</h2>
           <p className="text-gray-500 text-sm mt-1">{task.url} • {task.timestamp.toLocaleString()}</p>
        </div>
        <div className="flex gap-2">
           <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium">
             {task.images.length} Image(s)
           </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {task.images.map((image) => {
          const isMobile = image.viewport === 'mobile';
          
          return (
            <div key={image.id} className={`group bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col ${isMobile ? 'md:col-span-1 md:justify-self-center w-full max-w-[420px]' : ''}`}>
              {/* Header */}
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 rounded-t-2xl relative z-10">
                <div className="flex items-center gap-2">
                  {isMobile ? (
                    <svg className="text-indigo-500" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
                  ) : (
                    <svg className="text-indigo-500" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
                  )}
                  <span className="font-medium text-gray-700 text-sm capitalize">{image.viewport} View</span>
                </div>
                <div className="flex gap-2 relative">
                   {/* Download / Export Menu */}
                   <div className="relative">
                       <button 
                        onClick={() => setActiveMenu(activeMenu === image.id ? null : image.id)}
                        className={`p-2 rounded-lg transition-colors flex items-center gap-1 ${activeMenu === image.id ? 'bg-indigo-100 text-indigo-700' : 'text-gray-400 hover:text-indigo-600 hover:bg-indigo-50'}`}
                        title="Export Options"
                       >
                         <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                         <svg className={`w-3 h-3 transition-transform ${activeMenu === image.id ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                       </button>

                       {activeMenu === image.id && (
                         <>
                             <div className="fixed inset-0 z-20 cursor-default" onClick={() => setActiveMenu(null)}></div>
                             <div className="absolute right-0 top-full mt-2 bg-white shadow-xl border border-gray-100 rounded-xl py-1 w-44 z-30 flex flex-col overflow-hidden animate-[fadeIn_0.1s_ease-out]">
                                <div className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50 border-b border-gray-50">Export As</div>
                                <button onClick={() => handleDownload(image, 'jpeg')} className="text-left px-4 py-2.5 hover:bg-indigo-50 text-sm text-gray-700 flex justify-between items-center group/item transition-colors">
                                    <span>JPG</span>
                                    <span className="text-[10px] text-gray-300 group-hover/item:text-indigo-400">Standard</span>
                                </button>
                                <button onClick={() => handleDownload(image, 'png')} className="text-left px-4 py-2.5 hover:bg-indigo-50 text-sm text-gray-700 flex justify-between items-center group/item transition-colors">
                                    <span>PNG</span>
                                    <span className="text-[10px] text-gray-300 group-hover/item:text-indigo-400">High Res</span>
                                </button>
                                <button onClick={() => handleDownload(image, 'webp')} className="text-left px-4 py-2.5 hover:bg-indigo-50 text-sm text-gray-700 flex justify-between items-center group/item transition-colors">
                                    <span>WebP</span>
                                    <span className="text-[10px] text-gray-300 group-hover/item:text-indigo-400">Efficient</span>
                                </button>
                             </div>
                         </>
                       )}
                   </div>

                   <button 
                    onClick={() => onAnalyze(image)}
                    className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Analyze with Gemini"
                   >
                     <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                   </button>
                </div>
              </div>

              {/* Image Preview Container */}
              <div className={`flex-1 bg-gray-100 p-8 flex items-center justify-center ${isMobile ? 'min-h-[600px]' : 'min-h-[300px]'}`}>
                 {isMobile ? (
                   // Mobile Style Container (Detailed Phone Simulation)
                   <div 
                     className="relative mx-auto select-none"
                     style={{ width: '290px' }} 
                   >
                      {/* Frame */}
                      <div className="relative rounded-[3rem] bg-gray-900 shadow-[0_0_0_2px_#374151,0_20px_40px_-10px_rgba(0,0,0,0.4)] border-[8px] border-gray-900 ring-1 ring-white/20 overflow-hidden">
                          {/* Inner Screen */}
                          <div 
                            className="relative bg-white overflow-hidden rounded-[2.5rem]"
                            style={{ aspectRatio: `${image.width}/${image.height}` }}
                          >
                              {/* Status Bar */}
                              <div className="absolute top-0 left-0 right-0 h-12 z-20 flex justify-between items-start pt-3 px-6 pointer-events-none mix-blend-difference text-white">
                                  <span className="text-[12px] font-semibold tracking-wide">9:41</span>
                                  <div className="flex gap-1.5 items-center">
                                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21L24 9C23.5 8.5 19 4 12 4S0.5 8.5 0 9l12 12z"/></svg>
                                      <svg className="w-5 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M16 4h-3V2h-2v2H6C5 4 4 5 4 6v14c0 1 1 2 2 2h12c1 0 2-1 2-2V6c0-1-1-2-2-2z"/></svg>
                                  </div>
                              </div>

                              {/* Dynamic Island / Notch */}
                              <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-black h-7 w-[28%] rounded-full z-20 shadow-sm pointer-events-none"></div>

                              {/* Image Content */}
                              <img 
                                src={image.dataUrl} 
                                alt={image.filename}
                                className="w-full h-full object-cover bg-white"
                              />

                              {/* Home Indicator */}
                              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[35%] h-1 bg-black/30 rounded-full z-20 backdrop-blur-md mix-blend-overlay"></div>
                              
                              {/* Screen Glare/Reflection */}
                              <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent pointer-events-none z-10 rounded-[2.5rem]"></div>
                          </div>
                      </div>
                      
                      {/* Hardware Buttons (Simulated) */}
                      <div className="absolute top-24 -left-3 w-1.5 h-8 bg-gray-800 rounded-l-md border border-gray-700 shadow-sm"></div>
                      <div className="absolute top-36 -left-3 w-1.5 h-14 bg-gray-800 rounded-l-md border border-gray-700 shadow-sm"></div>
                      <div className="absolute top-36 -right-3 w-1.5 h-14 bg-gray-800 rounded-r-md border border-gray-700 shadow-sm"></div>
                   </div>
                 ) : (
                   // Desktop Style Container
                   <div className="relative w-full shadow-2xl rounded-lg overflow-hidden ring-1 ring-black/5 bg-white group-hover:scale-[1.01] transition-transform duration-500">
                      {/* Browser Bar Simulation */}
                      <div className="bg-gray-100 border-b border-gray-200 px-4 py-3 flex items-center gap-2">
                         <div className="flex gap-1.5">
                           <div className="w-3 h-3 rounded-full bg-red-400 border border-red-500/50"></div>
                           <div className="w-3 h-3 rounded-full bg-amber-400 border border-amber-500/50"></div>
                           <div className="w-3 h-3 rounded-full bg-green-400 border border-green-500/50"></div>
                         </div>
                         <div className="flex-1 ml-4 bg-white border border-gray-200 rounded-md h-6 shadow-sm mx-auto max-w-lg flex items-center px-3">
                           <div className="w-3 h-3 text-gray-300">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                           </div>
                           <span className="text-[10px] text-gray-400 ml-2 truncate">{task.url}</span>
                         </div>
                      </div>
                      <img 
                        src={image.dataUrl} 
                        alt={image.filename}
                        className="w-full h-auto block bg-white"
                      />
                   </div>
                 )}
              </div>

              {/* Analysis Result */}
              {image.analysis && (
                <div className="p-4 bg-indigo-50/50 border-t border-indigo-100 rounded-b-2xl">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600 mt-1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"></path><path d="M8.5 8.5v.01"></path><path d="M16 16v.01"></path><path d="M12 12v.01"></path></svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-indigo-900 mb-1">Gemini UX Analysis</h4>
                      <p className="text-xs text-indigo-800/80 leading-relaxed whitespace-pre-wrap">
                        {image.analysis}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="p-3 bg-white border-t border-gray-100 flex justify-between items-center text-xs text-gray-400 font-mono rounded-b-2xl">
                <span>{image.width} x {image.height}px</span>
                <span>{image.filename}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};