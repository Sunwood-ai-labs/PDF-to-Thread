import React, { useState, useCallback } from 'react';
import { AppState, SlideData, GeneratedThread } from './types';
import { convertPdfToImages } from './services/pdfService';
import { generateThreadContent } from './services/geminiService';
import PdfUploader from './components/PdfUploader';
import ThreadEditor from './components/ThreadEditor';
import { Sparkles, FileImage, Layers, Loader2, Link as LinkIcon } from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [slides, setSlides] = useState<SlideData[]>([]);
  const [threadResult, setThreadResult] = useState<GeneratedThread | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string>('');

  const handleFileSelect = async (file: File) => {
    try {
      setAppState(AppState.PROCESSING_PDF);
      setErrorMsg(null);
      const extractedSlides = await convertPdfToImages(file);
      setSlides(extractedSlides);
      setAppState(AppState.READY_TO_GENERATE);
    } catch (err) {
      console.error(err);
      setErrorMsg("PDFの読み込みに失敗しました。ファイルが破損しているか、パスワードがかかっている可能性があります。");
      setAppState(AppState.ERROR);
    }
  };

  const handleGenerateThread = async () => {
    if (slides.length === 0) return;
    
    try {
      setAppState(AppState.GENERATING_CONTENT);
      const result = await generateThreadContent(slides, sourceUrl);
      setThreadResult(result);
      setAppState(AppState.COMPLETED);
    } catch (err) {
      console.error(err);
      setErrorMsg("AIによる生成に失敗しました。しばらく待ってから再度お試しください。");
      setAppState(AppState.ERROR);
    }
  };

  const handleDownloadSingleImage = useCallback((slide: SlideData) => {
    const link = document.createElement('a');
    link.href = slide.imageData;
    link.download = `slide-${slide.pageNumber}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const resetApp = () => {
    setAppState(AppState.IDLE);
    setSlides([]);
    setThreadResult(null);
    setErrorMsg(null);
    setSourceUrl('');
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center cursor-pointer" onClick={resetApp}>
              <div className="bg-indigo-600 p-2 rounded-lg mr-3">
                <Layers className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                PDF to Thread
              </h1>
            </div>
            {appState === AppState.COMPLETED && (
              <button 
                onClick={resetApp}
                className="text-sm text-gray-500 hover:text-indigo-600 font-medium"
              >
                新しいファイルをアップロード
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Error Display */}
        {appState === AppState.ERROR && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-8 rounded-r-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{errorMsg}</p>
                <button 
                  onClick={resetApp}
                  className="mt-2 text-sm text-red-700 underline hover:text-red-600"
                >
                  最初に戻る
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Phase 1: Upload */}
        {(appState === AppState.IDLE || appState === AppState.PROCESSING_PDF) && (
          <div className="max-w-2xl mx-auto text-center mt-10">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
              PDFをスレッドに変えよう
            </h2>
            <p className="text-lg text-gray-500 mb-8">
              スライド資料をアップロードするだけで、画像化し、<br/>
              AIが魅力的な解説スレッドを自動生成します。
            </p>
            <div className="bg-white p-2 rounded-xl shadow-sm">
              <PdfUploader 
                onFileSelect={handleFileSelect} 
                isLoading={appState === AppState.PROCESSING_PDF} 
              />
            </div>
          </div>
        )}

        {/* Phase 2: Preview & Generate Action */}
        {appState === AppState.READY_TO_GENERATE && (
          <div className="max-w-4xl mx-auto animate-fade-in-up">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="p-8 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {slides.length}枚のスライドを読み込みました
                  </h3>
                  <p className="text-gray-500 text-sm mt-1">
                    プレビューを確認して、スレッドを生成してください。
                  </p>
                </div>
                
                <div className="flex flex-col gap-3 w-full md:w-auto">
                   <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <LinkIcon className="h-4 w-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                    </div>
                    <input
                      type="url"
                      placeholder="参考URL (任意: 公式記事など)"
                      value={sourceUrl}
                      onChange={(e) => setSourceUrl(e.target.value)}
                      className="block w-full md:w-72 pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 sm:text-sm transition-all shadow-sm"
                    />
                  </div>

                  <button
                    onClick={handleGenerateThread}
                    className="w-full md:w-auto px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-bold shadow-lg hover:shadow-indigo-500/30 transition transform hover:-translate-y-0.5 flex items-center justify-center"
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    AIでスレッドを生成
                  </button>
                </div>
              </div>
              
              <div className="p-8 bg-gray-50">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {slides.map((slide) => (
                    <div key={slide.id} className="relative aspect-[16/9] rounded-lg overflow-hidden shadow border border-gray-200 group">
                      <img 
                        src={slide.imageData} 
                        alt={`Page ${slide.pageNumber}`} 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                         <span className="text-white font-medium text-sm">Page {slide.pageNumber}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Phase 3: Loading (Generating) */}
        {appState === AppState.GENERATING_CONTENT && (
          <div className="max-w-2xl mx-auto text-center mt-20">
             <div className="relative inline-flex">
                <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center animate-pulse">
                  <Sparkles className="w-12 h-12 text-indigo-600 animate-spin-slow" />
                </div>
             </div>
             <h3 className="text-2xl font-bold text-gray-900 mt-6">AIが考え中...</h3>
             <p className="text-gray-500 mt-2">
               スライドの内容を分析し、最適な投稿文を作成しています。<br/>
               これには数秒〜1分程度かかる場合があります。
             </p>
          </div>
        )}

        {/* Phase 4: Results */}
        {appState === AppState.COMPLETED && threadResult && (
          <ThreadEditor 
            slides={slides} 
            threadData={threadResult.items} 
            onDownloadImage={handleDownloadSingleImage}
          />
        )}
      </main>
    </div>
  );
};

export default App;