import { CaptureConfig, GeneratedImage, ViewportType } from '../types';

// Helper to wait
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Using corsproxy.io which is often more reliable for binary data fetching than allorigins
const PROXY_BASE = 'https://corsproxy.io/?';

/**
 * Normalizes a URL to ensure it has a protocol and standard formatting
 */
const normalizeUrl = (url: string): string => {
  try {
    let normalized = url.trim();
    if (!/^https?:\/\//i.test(normalized)) {
      normalized = 'https://' + normalized;
    }
    return new URL(normalized).href;
  } catch (e) {
    return url;
  }
};

/**
 * Helper to get dimensions of a base64 image string
 */
const getImageDimensions = (dataUrl: string): Promise<{width: number, height: number}> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
        img.onerror = () => resolve({ width: 0, height: 0 });
        img.src = dataUrl;
    });
};

/**
 * CRAWLER ENGINE
 * Fetches the real HTML of the page via proxy, parses it, and finds internal links.
 */
const crawlForLinks = async (baseUrl: string, depth: number, onProgress: (msg: string) => void): Promise<string[]> => {
  const visited = new Set<string>();
  const queue: { url: string; level: number }[] = [{ url: baseUrl, level: 1 }];
  const result: string[] = [];
  const baseDomain = new URL(baseUrl).hostname;

  // Breadth-First Search for links
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) break;

    // Normalize check
    const cleanUrl = current.url.replace(/\/$/, '');
    
    if (visited.has(cleanUrl)) continue;
    visited.add(cleanUrl);
    result.push(current.url);

    // If we haven't reached max depth, find more links
    if (current.level < depth) {
      onProgress(`Crawling Level ${current.level}: Analyzing ${current.url}...`);
      
      try {
        // Fetch HTML via Proxy
        const proxyUrl = `${PROXY_BASE}${encodeURIComponent(current.url)}`;
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const htmlText = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, 'text/html');
        
        const anchors = Array.from(doc.querySelectorAll('a'));
        let foundCount = 0;
        const maxLinksPerLevel = 4; // Limit to avoid infinite crawling in this demo

        for (const a of anchors) {
          const href = a.getAttribute('href');
          if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) continue;

          try {
            // Resolve relative URLs
            const resolvedUrl = new URL(href, current.url);
            
            // Only follow internal links
            if (resolvedUrl.hostname === baseDomain) {
              const nextUrl = resolvedUrl.href;
              const cleanNext = nextUrl.replace(/\/$/, '');
              
              if (!visited.has(cleanNext) && foundCount < maxLinksPerLevel) {
                queue.push({ url: nextUrl, level: current.level + 1 });
                foundCount++;
              }
            }
          } catch (e) {
            // Invalid URL, skip
          }
        }
      } catch (error) {
        console.warn(`Failed to crawl ${current.url}:`, error);
        // We still keep the URL in results even if we couldn't crawl its children
      }
    }
  }

  return result;
};

/**
 * IMAGE GENERATOR
 * Uses a real screenshot service via proxy with fallback.
 */
export const generateScreenshots = async (
  rootUrl: string, 
  config: CaptureConfig,
  onProgress: (msg: string) => void
): Promise<GeneratedImage[]> => {
  const normalizedRoot = normalizeUrl(rootUrl);
  
  // 1. Crawl Phase
  onProgress('Starting Crawler Engine...');
  
  let urlsToCapture = [normalizedRoot];
  try {
    const crawled = await crawlForLinks(normalizedRoot, config.depth, onProgress);
    if (crawled.length > 0) urlsToCapture = crawled;
  } catch (e) {
    console.error('Crawl failed, defaulting to root URL only', e);
  }
  
  const images: GeneratedImage[] = [];
  const now = new Date();
  
  // Date formatting for filename
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  
  // 2. Capture Phase
  const viewports: { type: ViewportType; width: number; height: number }[] = [];
  
  if (config.desktop) {
      viewports.push({ 
          type: 'desktop', 
          width: config.desktopRes?.width || 1440, 
          height: config.desktopRes?.height || 900 
      });
  }
  
  if (config.mobile) {
      viewports.push({ 
          type: 'mobile', 
          width: config.mobileRes?.width || 393, 
          height: config.mobileRes?.height || 852 
      });
  }

  const totalOperations = urlsToCapture.length * viewports.length;
  let currentOp = 0;

  for (const url of urlsToCapture) {
    const urlObj = new URL(url);
    const cleanHostname = urlObj.hostname.replace('www.', '');
    // Sanitize path for filename
    const cleanPath = urlObj.pathname === '/' ? '' : urlObj.pathname.replace(/\//g, '-');

    for (const viewport of viewports) {
      currentOp++;
      
      const captureType = config.fullPage ? 'Full Page' : 'Viewport';
      onProgress(`Capturing (${currentOp}/${totalOperations}): ${url} [${viewport.type} - ${captureType}]`);

      try {
        const dataUrl = await captureRealScreenshotWithFallback(
            url, 
            viewport.width, 
            viewport.height, 
            viewport.type, 
            config.fullPage
        );
        
        if (dataUrl) {
          // Detect actual dimensions (important for full page captures)
          const actualDims = await getImageDimensions(dataUrl);
          
          // --- FILENAME GENERATION ---
          const template = config.filenameTemplate && config.filenameTemplate.trim() !== '' 
              ? config.filenameTemplate 
              : '{domain}_{date}_{viewport}';

          let filename = template
              .replace(/{domain}/g, cleanHostname)
              .replace(/{path}/g, cleanPath)
              .replace(/{date}/g, `${year}-${month}-${day}`)
              .replace(/{time}/g, `${hours}-${minutes}`)
              .replace(/{viewport}/g, viewport.type)
              .replace(/{width}/g, String(actualDims.width || viewport.width))
              .replace(/{height}/g, String(actualDims.height || viewport.height))
              .replace(/{index}/g, String(currentOp));
          
          // Sanitize to remove illegal characters
          filename = filename.replace(/[^a-zA-Z0-9-_. \[\]()]/g, '_');
          
          // Ensure .jpg extension
          if (!filename.toLowerCase().endsWith('.jpg') && !filename.toLowerCase().endsWith('.png')) {
              filename += '.jpg';
          }
          // ---------------------------

          images.push({
            id: crypto.randomUUID(),
            url,
            dataUrl,
            viewport: viewport.type,
            width: actualDims.width || viewport.width,
            height: actualDims.height || viewport.height,
            filename,
          });
        }
      } catch (e) {
        console.error(`Failed to capture ${url}`, e);
        // Generate an error placeholder so the user knows this specific one failed
        const placeholder = await createErrorPlaceholder(viewport.width, viewport.height, url);
        images.push({
            id: crypto.randomUUID(),
            url,
            dataUrl: placeholder,
            viewport: viewport.type,
            width: viewport.width,
            height: viewport.height,
            filename: `error_${cleanHostname}_${viewport.type}.jpg`
        });
      }
      
      // Respect rate limits slightly
      await delay(1500);
    }
  }

  return images;
};

/**
 * Tries to capture a screenshot using multiple services for reliability.
 * Implements a strategy pattern to prioritize services that handle responsive viewports correctly.
 */
const captureRealScreenshotWithFallback = async (
  url: string, 
  width: number, 
  height: number,
  type: ViewportType,
  fullPage: boolean
): Promise<string> => {
    
    // Define available providers
    const providers = [
        {
            name: 'microlink',
            // Microlink is excellent for responsive mobile screenshots as it sets the correct User-Agent
            // and supports full page
            getUrl: () => {
                const params: any = {
                    url: url,
                    screenshot: 'true',
                    meta: 'false',
                    embed: 'screenshot.url',
                    'viewport.width': String(width),
                    'viewport.height': String(height),
                    'viewport.isMobile': type === 'mobile' ? 'true' : 'false',
                    'viewport.deviceScaleFactor': type === 'mobile' ? '2' : '1', // High DPI for mobile
                    // Wait for animations/lazy load
                    'waitFor': '3s'
                };
                
                if (fullPage) {
                    // Correct parameter for full page in microlink is 'screenshot.fullPage'
                    params['screenshot.fullPage'] = 'true';
                }
                
                const query = new URLSearchParams(params).toString();
                return `https://api.microlink.io/?${query}`;
            },
            // Microlink supports CORS directly, avoiding proxy reduces latency/failures
            useProxy: false
        },
        {
            name: 'thum.io',
            // Thum.io respects the width parameter for layout reflow
            getUrl: () => {
                // Thum.io format: //image.thum.io/get/width/<width>[/crop/<height>|/fullpage]/<url>
                let baseUrl = `https://image.thum.io/get/width/${width}`;
                
                if (fullPage) {
                    baseUrl += '/fullpage';
                } else {
                    baseUrl += `/crop/${height}`;
                }
                
                return `${baseUrl}/noanimate/${url}`;
            },
            useProxy: true
        },
        {
            name: 'mshots',
            // WordPress mshots is reliable for simple desktop screenshots.
            // IT DOES NOT HANDLE MOBILE LAYOUTS WELL (It scales the viewport).
            // IT DOES NOT HANDLE FULLPAGE WELL (Max height limits).
            getUrl: () => {
                const cacheBuster = Math.random().toString(36).substring(7);
                // Try to get a taller image if fullpage, but mshots has limits around 2000px usually
                const h = fullPage ? 4000 : height; 
                return `https://s0.wp.com/mshots/v1/${encodeURIComponent(url)}?w=${width}&h=${h}&v=${cacheBuster}`;
            },
            useProxy: true
        }
    ];

    // Determine strategy based on viewport type & full page requirement
    let strategy = [];

    if (type === 'mobile') {
        // For Mobile, Mshots is terrible (just scales desktop). 
        // We MUST prioritize Microlink and Thum.io which use headless browsers with correct viewport width triggers.
        // Microlink is #1 because it supports User-Agent switching (isMobile=true).
        strategy = [providers[0], providers[1]];
    } else if (fullPage) {
        // For Full Page, Mshots often cuts off or times out on long pages.
        strategy = [providers[0], providers[1]];
    } else {
        // For standard Desktop Viewport, Mshots is fastest and very reliable.
        strategy = [providers[2], providers[0], providers[1]];
    }

    let lastError;

    for (const provider of strategy) {
        try {
            const providerUrl = provider.getUrl();
            
            // Handle Proxy logic
            const urlToFetch = provider.useProxy 
                ? `${PROXY_BASE}${encodeURIComponent(providerUrl)}` 
                : providerUrl;

            // console.log(`Attempting ${provider.name} capture...`);
            return await fetchImageAsBase64(urlToFetch);
        } catch (error) {
            console.warn(`${provider.name} capture failed, trying next...`, error);
            lastError = error;
            // Small delay before next retry
            await delay(500);
        }
    }

    throw lastError || new Error('All screenshot providers failed');
};

const fetchImageAsBase64 = async (url: string): Promise<string> => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Status ${response.status}`);
    
    const blob = await response.blob();
    // Validating image blob
    if (blob.size < 100 || blob.type.indexOf('image') === -1) {
        throw new Error('Invalid image data received');
    }

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

// Fallback just in case the proxy/internet fails completely
const createErrorPlaceholder = (width: number, height: number, url: string): Promise<string> => {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(0, 0, width, height);
            
            // Browser bar
            ctx.fillStyle = '#e2e8f0';
            ctx.fillRect(0, 0, width, 50);
            
            ctx.fillStyle = '#ef4444';
            ctx.font = 'bold 24px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Capture Error', width / 2, height / 2 - 20);
            
            ctx.fillStyle = '#64748b';
            ctx.font = '14px sans-serif';
            ctx.fillText(url, width / 2, height / 2 + 20);
        }
        resolve(canvas.toDataURL('image/jpeg'));
    });
}