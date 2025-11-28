import React, { useState, useRef } from 'react';
import { UploadCloud } from 'lucide-react';

interface FileUploadProps {
  label: string;
  onFileSelect: (content: string) => void;
  color: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({ label, onFileSelect, color }) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    // Basic validation for CSV extension
    if (!file.name.toLowerCase().endsWith('.csv')) {
      alert('กรุณาอัปโหลดไฟล์นามสกุล .csv เท่านั้น');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        onFileSelect(event.target.result as string);
      }
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  return (
    <div 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      className={`
        relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 group
        ${isDragging 
          ? `border-${color}-500 bg-${color}-100 scale-[1.02] shadow-lg` 
          : `border-${color}-300 bg-${color}-50 hover:bg-${color}-100`
        }
      `}
    >
      <input 
        ref={inputRef}
        type="file" 
        accept=".csv"
        onChange={handleFileChange}
        className="hidden"
      />
      
      <div className="flex flex-col items-center justify-center pointer-events-none">
        <UploadCloud 
          className={`h-12 w-12 mb-3 transition-colors duration-200 ${
            isDragging ? `text-${color}-600 scale-110` : `text-${color}-500`
          }`} 
        />
        
        <h3 className="text-lg font-medium text-gray-900 mb-1">{label}</h3>
        
        <p className={`text-sm mb-2 transition-colors ${isDragging ? `text-${color}-700 font-bold` : 'text-gray-500'}`}>
          {isDragging ? 'วางไฟล์เพื่ออัปโหลดทันที!' : 'คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวางที่นี่'}
        </p>
        
        <p className="text-xs text-gray-400">รองรับไฟล์ CSV</p>
      </div>
    </div>
  );
};