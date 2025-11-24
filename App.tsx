import React, { useState, useCallback } from 'react';
import { Layout } from './components/Layout';
import { ControlPanel } from './components/ControlPanel';
import { Gallery } from './components/Gallery';
import { ScreenshotTask, CaptureConfig, GeneratedImage } from './types';
import { generateScreenshots } from './utils/imageGenerator';
import { analyzeScreenshot } from './services/geminiService';
import { Toaster, toast } from 'react-hot-toast';
import JSZip from 'jszip';

const App: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [tasks, setTasks] = useState<ScreenshotTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<ScreenshotTask | null>(null);

  // Analyze URL/Image with Gemini
  const handleAnalyze = useCallback(async (image: GeneratedImage) => {
    try {
      toast.loading('Gemini is analyzing the layout...', { id: 'gemini-toast' });
      const analysis = await analyzeScreenshot(image.dataUrl, image.viewport);
      toast.success('Analysis complete!', { id: 'gemini-toast' });
      
      // Update the specific image with analysis
      setTasks(prevTasks => prevTasks.map(task => ({
        ...task,
        images: task.images.map(img => 
          img.id === image.id ? { ...img, analysis } : img
        )
      })));
    } catch (error) {
      console.error(error);
      toast.error('Failed to analyze with Gemini', { id: 'gemini-toast' });
    }
  }, []);

  const downloadImages = useCallback(async (images: GeneratedImage[]) => {
    if (images.length === 0) return;

    // If more than 2 images, zip them
    if (images.length > 2) {
      const toastId = toast.loading('Compressing images into ZIP...');
      try {
        const zip = new JSZip();
        
        // Add images to zip
        images.forEach(img => {
          // Remove header dataurl prefix
          const base64Data = img.dataUrl.split(',')[1];
          zip.file(img.filename, base64Data, { base64: true });
        });

        const content = await zip.generateAsync({ type: 'blob' });
        const zipUrl = URL.createObjectURL(content);
        
        // Generate Zip Filename based on first image logic or timestamp
        const zipName = `Capture_Batch_${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.zip`;

        const link = document.createElement('a');
        link.href = zipUrl;
        link.download = zipName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(zipUrl);
        
        toast.success('ZIP Downloaded!', { id: toastId });
      } catch (e) {
        console.error(e);
        toast.error('Failed to create ZIP', { id: toastId });
      }
    } else {
      // Download individually
      images.forEach(img => {
        const link = document.createElement('a');
        link.href = img.dataUrl;
        link.download = img.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
    }
  }, []);

  const handleCapture = useCallback(async (url: string, config: CaptureConfig) => {
    setIsProcessing(true);
    const toastId = toast.loading('Initializing capture engine...');

    try {
      // Create a new task entry
      const newTask: ScreenshotTask = {
        id: crypto.randomUUID(),
        url,
        timestamp: new Date(),
        status: 'loading',
        images: [],
        config
      };

      setTasks(prev => [newTask, ...prev]);
      setSelectedTask(newTask);

      // Simulate the heavy lifting of screenshotting
      const images = await generateScreenshots(url, config, (progress) => {
        toast.loading(progress, { id: toastId });
      });

      // Update task with results
      setTasks(prev => prev.map(t => 
        t.id === newTask.id 
          ? { ...t, status: 'completed', images } 
          : t
      ));
      
      // Select the updated task
      const completedTask = { ...newTask, status: 'completed' as const, images };
      setSelectedTask(prev => prev?.id === newTask.id ? completedTask : prev);

      toast.success(`Completed! Captured ${images.length} screens.`, { id: toastId });

      if (config.autoDownload) {
        downloadImages(images);
      }

    } catch (error) {
      console.error(error);
      toast.error('Capture failed. Please check the URL.', { id: toastId });
      setTasks(prev => prev.map(t => t.id === selectedTask?.id ? { ...t, status: 'error' } : t));
    } finally {
      setIsProcessing(false);
    }
  }, [selectedTask, downloadImages]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <Toaster position="bottom-right" />
      <Layout 
        sidebar={
          <div className="p-4 space-y-4">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Recent Captures</h2>
            {tasks.map(task => (
              <button
                key={task.id}
                onClick={() => setSelectedTask(task)}
                className={`w-full text-left p-3 rounded-lg text-sm transition-all border ${
                  selectedTask?.id === task.id 
                    ? 'bg-white border-indigo-200 shadow-sm ring-1 ring-indigo-500/20' 
                    : 'bg-transparent border-transparent hover:bg-gray-100 text-gray-600'
                }`}
              >
                <div className="font-medium truncate">{task.url}</div>
                <div className="text-xs text-gray-400 mt-1 flex justify-between">
                  <span>{task.images.length} files</span>
                  <span>{task.timestamp.toLocaleTimeString()}</span>
                </div>
              </button>
            ))}
            {tasks.length === 0 && (
              <div className="text-center py-10 text-gray-400 text-sm">
                No captures yet.
              </div>
            )}
          </div>
        }
      >
        <div className="max-w-5xl mx-auto w-full space-y-8">
          <div className="text-center space-y-2 mb-10">
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
              ScreenFlow Capture
            </h1>
            <p className="text-gray-500">
              Crawler-enabled High-fidelity screenshots (Desktop & Mobile)
            </p>
          </div>

          <ControlPanel 
            onCapture={handleCapture} 
            isProcessing={isProcessing} 
          />

          {selectedTask && (
            <Gallery 
              task={selectedTask} 
              onAnalyze={handleAnalyze}
            />
          )}
        </div>
      </Layout>
    </div>
  );
};

export default App;