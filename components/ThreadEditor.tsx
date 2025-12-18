import React from 'react';
import { SlideData, ThreadContent } from '../types';
import { Download, Copy, RefreshCw, Image as ImageIcon, Twitter, Layers } from 'lucide-react';
import JSZip from 'jszip';

interface ThreadEditorProps {
  slides: SlideData[];
  threadData: ThreadContent[];
  onDownloadImage: (slide: SlideData) => void;
}

const ThreadEditor: React.FC<ThreadEditorProps> = ({ slides, threadData, onDownloadImage }) => {

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleDownloadAll = async () => {
    const zip = new JSZip();
    
    // Prepare data
    const items = slides.map((slide, index) => {
      const content = threadData.find(t => t.slideIndex === index) || {
        slideIndex: index,
        threadPost: "生成されたテキストがありません。",
        imageDescription: "説明がありません。"
      };
      return { slide, content, index };
    });

    // 1. Individual Tweets Folder
    const individualFolder = zip.folder("1_tweet_per_slide");
    items.forEach(({ slide, content, index }) => {
      const folderName = (index + 1).toString().padStart(3, '0');
      const folder = individualFolder?.folder(folderName);
      if (folder) {
        const imageData = slide.imageData.split(',')[1];
        folder.file('slide.png', imageData, { base64: true });
        folder.file('post.txt', content.threadPost);
        folder.file('alt.txt', content.imageDescription);
      }
    });

    // 2. Merged Tweets Folder (4 slides per tweet)
    const mergedFolder = zip.folder("4_slides_per_tweet");
    const chunks = [];
    for (let i = 0; i < items.length; i += 4) {
      chunks.push(items.slice(i, i + 4));
    }

    chunks.forEach((chunk, chunkIdx) => {
      const folderName = (chunkIdx + 1).toString().padStart(3, '0');
      const folder = mergedFolder?.folder(folderName);
      if (folder) {
        // Merged post and alt texts
        const mergedPost = chunk.map(c => c.content.threadPost).join('\n\n---\n\n');
        const mergedAlt = chunk.map((c, i) => `[Slide ${i + 1}]\n${c.content.imageDescription}`).join('\n\n');
        
        folder.file('post.txt', mergedPost);
        folder.file('alt.txt', mergedAlt);

        // Images in this chunk
        chunk.forEach((item, itemIdx) => {
          const imageData = item.slide.imageData.split(',')[1];
          folder.file(`slide_${itemIdx + 1}.png`, imageData, { base64: true });
        });
      }
    });

    // 3. Summary files
    const summaryContent = items.map(({ content, index }) => 
      `--- Slide ${index + 1} ---\n\n[Post]\n${content.threadPost}\n\n[Alt Text]\n${content.imageDescription}\n`
    ).join('\n');
    zip.file("thread_content_individual.txt", summaryContent);

    const mergedSummaryContent = chunks.map((chunk, index) => {
      const posts = chunk.map(c => c.content.threadPost).join('\n\n');
      return `--- Tweet ${index + 1} (Slides ${chunk[0].index + 1}-${chunk[chunk.length - 1].index + 1}) ---\n\n${posts}\n`;
    }).join('\n');
    zip.file("thread_content_merged_4_slides.txt", mergedSummaryContent);

    // Generate and download ZIP
    const zipBlob = await zip.generateAsync({ type: "blob" });
    const url = window.URL.createObjectURL(zipBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "thread_pack_full.zip";
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 sticky top-0 bg-gray-50/95 backdrop-blur z-20 py-4 border-b border-gray-200 px-4 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <Twitter className="w-6 h-6 text-blue-400 mr-2" />
            生成されたスレッド
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">個別投稿用と4枚まとめ用をセットで書き出せます</p>
        </div>
        <button 
          onClick={handleDownloadAll}
          className="flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-indigo-200 transition-all shadow-md font-bold"
        >
          <Download className="w-5 h-5 mr-2" />
          フルセット一括ダウンロード (ZIP)
        </button>
      </div>

      <div className="space-y-12">
        {items.map(({ slide, content }, idx) => (
          <div key={slide.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col md:flex-row mx-4 hover:border-indigo-200 transition-colors">
            {/* Image Section */}
            <div className="md:w-1/2 bg-gray-100 border-b md:border-b-0 md:border-r border-gray-200 relative group">
              <img 
                src={slide.imageData} 
                alt={`Slide ${idx + 1}`} 
                className="w-full h-auto object-contain"
              />
              <div className="absolute top-3 left-3 bg-black/70 text-white text-xs font-bold px-2.5 py-1 rounded-full backdrop-blur-sm">
                PAGE {slide.pageNumber.toString().padStart(3, '0')}
              </div>
              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => onDownloadImage(slide)}
                  className="bg-white/90 hover:bg-white text-gray-800 p-2.5 rounded-full shadow-lg border border-gray-200 transform hover:scale-110 transition-transform"
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
                  <label className="text-sm font-bold text-gray-700 flex items-center">
                    <Twitter className="w-4 h-4 mr-2 text-blue-400" />
                    ツイート案
                  </label>
                  <button 
                    onClick={() => handleCopyText(content.threadPost)}
                    className="text-gray-400 hover:text-indigo-600 transition p-1.5 rounded-lg hover:bg-gray-100"
                    title="コピー"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <div className="relative">
                  <textarea 
                    readOnly
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl text-[15px] leading-relaxed text-gray-800 resize-none focus:outline-none min-h-[180px] font-medium"
                    value={content.threadPost}
                  />
                </div>
              </div>

              {/* Alt Text */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-bold text-gray-700 flex items-center">
                    <ImageIcon className="w-4 h-4 mr-2 text-emerald-500" />
                    画像アクセシビリティ (Alt)
                  </label>
                  <button 
                    onClick={() => handleCopyText(content.imageDescription)}
                    className="text-gray-400 hover:text-emerald-600 transition p-1.5 rounded-lg hover:bg-gray-100"
                    title="コピー"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <textarea 
                  readOnly
                  className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-500 italic resize-none focus:outline-none min-h-[90px]"
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