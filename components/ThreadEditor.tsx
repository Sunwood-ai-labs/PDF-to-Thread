import React from 'react';
import { SlideData, ThreadContent } from '../types';
import { Download, Copy, RefreshCw, Image as ImageIcon, Twitter } from 'lucide-react';
import JSZip from 'jszip';

interface ThreadEditorProps {
  slides: SlideData[];
  threadData: ThreadContent[];
  onDownloadImage: (slide: SlideData) => void;
}

const ThreadEditor: React.FC<ThreadEditorProps> = ({ slides, threadData, onDownloadImage }) => {

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add a toast notification here
  };

  const handleDownloadAll = async () => {
    const zip = new JSZip();
    const folder = zip.folder("thread_images");
    
    slides.forEach((slide, index) => {
      // Remove header data:image/png;base64,
      const data = slide.imageData.split(',')[1];
      folder?.file(`slide_${index + 1}.png`, data, {base64: true});
    });

    // Create a text file with the thread content
    const textContent = threadData.map((t, i) => 
      `--- Slide ${i + 1} ---\n\n[Post]\n${t.threadPost}\n\n[Alt Text]\n${t.imageDescription}\n`
    ).join('\n');
    
    folder?.file("thread_content.txt", textContent);

    const content = await zip.generateAsync({type:"blob"});
    const url = window.URL.createObjectURL(content);
    const a = document.createElement("a");
    a.href = url;
    a.download = "thread_pack.zip";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Merge slides with thread data based on index
  // Sometimes AI might skip or hallucinate an index, so we map safely
  const items = slides.map((slide, index) => {
    const content = threadData.find(t => t.slideIndex === index) || {
      slideIndex: index,
      threadPost: "生成されたテキストがありません。",
      imageDescription: "説明がありません。"
    };
    return { slide, content };
  });

  return (
    <div className="w-full max-w-5xl mx-auto pb-20">
      <div className="flex justify-between items-center mb-8 sticky top-0 bg-gray-50/95 backdrop-blur z-10 py-4 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <Twitter className="w-6 h-6 text-blue-400 mr-2" />
          生成されたスレッド
        </h2>
        <button 
          onClick={handleDownloadAll}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-sm font-medium"
        >
          <Download className="w-4 h-4 mr-2" />
          一括ダウンロード (ZIP)
        </button>
      </div>

      <div className="space-y-12">
        {items.map(({ slide, content }, idx) => (
          <div key={slide.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col md:flex-row">
            {/* Image Section */}
            <div className="md:w-1/2 bg-gray-100 border-b md:border-b-0 md:border-r border-gray-200 relative group">
              <img 
                src={slide.imageData} 
                alt={`Slide ${idx + 1}`} 
                className="w-full h-auto object-contain"
              />
              <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                Page {slide.pageNumber}
              </div>
              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => onDownloadImage(slide)}
                  className="bg-white/90 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg border border-gray-200"
                  title="画像をダウンロード"
                >
                  <Download className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content Section */}
            <div className="md:w-1/2 p-6 flex flex-col gap-6">
              
              {/* Thread Post */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center">
                    <Twitter className="w-3.5 h-3.5 mr-1.5 text-blue-400" />
                    投稿文案
                  </label>
                  <button 
                    onClick={() => handleCopyText(content.threadPost)}
                    className="text-gray-400 hover:text-indigo-600 transition"
                    title="コピー"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <textarea 
                  readOnly
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  rows={5}
                  value={content.threadPost}
                />
              </div>

              {/* Alt Text */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center">
                    <ImageIcon className="w-3.5 h-3.5 mr-1.5 text-green-500" />
                    画像説明 (Alt Text)
                  </label>
                  <button 
                    onClick={() => handleCopyText(content.imageDescription)}
                    className="text-gray-400 hover:text-indigo-600 transition"
                    title="コピー"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <textarea 
                  readOnly
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  rows={3}
                  value={content.imageDescription}
                />
              </div>

            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ThreadEditor;