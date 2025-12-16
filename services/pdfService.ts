import * as pdfjsLib from 'pdfjs-dist';

// We need to set the worker source. 
// Using jsdelivr with the .mjs extension ensures it works correctly with ES module imports.
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

import { SlideData } from '../types';

export const convertPdfToImages = async (file: File): Promise<SlideData[]> => {
  const arrayBuffer = await file.arrayBuffer();
  
  // Load the PDF document
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  
  const slides: SlideData[] = [];
  const totalPages = pdf.numPages;

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    
    // Determine scale for good quality (e.g., scale 2 for retina-like quality)
    const scale = 2.0;
    const viewport = page.getViewport({ scale });

    // Prepare canvas using PDF page dimensions
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) {
      throw new Error(`Could not get context for page ${pageNum}`);
    }

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    // Render PDF page into canvas context
    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    };
    
    await page.render(renderContext).promise;

    // Convert canvas to Data URL (PNG)
    const imageData = canvas.toDataURL('image/png');
    
    slides.push({
      id: crypto.randomUUID(),
      imageData,
      pageNumber: pageNum
    });
  }

  return slides;
};