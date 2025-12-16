import React, { useRef } from 'react';
import { Upload, FileText, AlertCircle } from 'lucide-react';

interface PdfUploaderProps {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
}

const PdfUploader: React.FC<PdfUploaderProps> = ({ onFileSelect, isLoading }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf') {
        onFileSelect(file);
      } else {
        alert('PDFファイルのみ対応しています。');
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div 
      className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer 
        ${isLoading ? 'bg-gray-50 border-gray-300 cursor-wait' : 'border-indigo-300 hover:bg-indigo-50 hover:border-indigo-400 bg-white'}`}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={() => !isLoading && inputRef.current?.click()}
    >
      <input 
        type="file" 
        accept="application/pdf" 
        className="hidden" 
        ref={inputRef} 
        onChange={handleChange}
        disabled={isLoading}
      />
      
      <div className="flex flex-col items-center justify-center space-y-4">
        {isLoading ? (
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-12 w-12 bg-indigo-200 rounded-full mb-4"></div>
            <p className="text-gray-500 font-medium">PDFを処理中...</p>
          </div>
        ) : (
          <>
            <div className="bg-indigo-100 p-4 rounded-full">
              <Upload className="w-8 h-8 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">PDFをアップロード</h3>
              <p className="text-gray-500 text-sm mt-1">ドラッグ＆ドロップ または クリックして選択</p>
            </div>
            <div className="flex items-center text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full border">
              <FileText className="w-3 h-3 mr-1" />
              最大 50MB まで
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PdfUploader;