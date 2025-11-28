import React from 'react';
import { UploadCloud } from 'lucide-react';

interface FileUploadProps {
  label: string;
  onFileSelect: (content: string) => void;
  color: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({ label, onFileSelect, color }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onFileSelect(event.target.result as string);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className={`border-2 border-dashed border-${color}-300 bg-${color}-50 p-6 rounded-lg text-center hover:bg-${color}-100 transition-colors`}>
      <UploadCloud className={`mx-auto h-12 w-12 text-${color}-500 mb-3`} />
      <h3 className="text-lg font-medium text-gray-900 mb-1">{label}</h3>
      <p className="text-sm text-gray-500 mb-4">รองรับไฟล์ CSV</p>
      <input 
        type="file" 
        accept=".csv"
        onChange={handleFileChange}
        className="block w-full text-sm text-gray-500
          file:mr-4 file:py-2 file:px-4
          file:rounded-full file:border-0
          file:text-sm file:font-semibold
          file:bg-white file:text-blue-700
          hover:file:bg-blue-50
        "
      />
    </div>
  );
};
