import { useState } from 'react';
import { FileUpload } from './components/FileUpload';
import { MatchTable } from './components/MatchTable';
import { parseCSV } from './utils/csvParser';
import { reconcileData } from './utils/reconcileLogic';
import { Transaction, ReconciliationSummary, MatchResult } from './types';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ShieldCheck, FileText, Settings, RefreshCw, Database } from 'lucide-react';

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#6366F1'];

function App() {
  const [bankData, setBankData] = useState<Transaction[]>([]);
  const [bookData, setBookData] = useState<Transaction[]>([]);
  const [results, setResults] = useState<MatchResult[]>([]);
  const [summary, setSummary] = useState<ReconciliationSummary | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'dashboard'>('upload');

  const handleBankUpload = (content: string) => {
    try {
      const data = parseCSV(content, 'BANK');
      setBankData(data);
    } catch (e: any) {
      alert('Error parsing Bank CSV: ' + e.message);
    }
  };

  const handleBookUpload = (content: string) => {
    try {
      const data = parseCSV(content, 'BOOK');
      setBookData(data);
    } catch (e: any) {
      alert('Error parsing Book CSV: ' + e.message);
    }
  };

  const handleProcess = () => {
    if (bankData.length === 0 || bookData.length === 0) {
      alert('กรุณาอัปโหลดไฟล์ให้ครบทั้ง 2 ไฟล์');
      return;
    }
    const { results: res, summary: sum } = reconcileData(bankData, bookData);
    setResults(res);
    setSummary(sum);
    setActiveTab('dashboard');
  };

  const reset = () => {
    setBankData([]);
    setBookData([]);
    setResults([]);
    setSummary(null);
    setActiveTab('upload');
  };

  // Pie Chart Data
  const pieData = summary ? [
    { name: 'Matched', value: summary.matchedCount },
    { name: 'Potential', value: summary.potentialCount },
    { name: 'Unmatched (Bank)', value: summary.unmatchedBankCount },
    { name: 'Unmatched (Book)', value: summary.unmatchedBookCount },
  ] : [];

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-800">
      {/* Navbar */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <ShieldCheck className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">ReconAI</span>
            </div>
            {/* API Key Input Removed per Guidelines */}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Step 1: Upload */}
        {activeTab === 'upload' && (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900">เริ่มการกระทบยอดบัญชี</h1>
              <p className="mt-2 text-gray-600">อัปโหลดไฟล์ CSV จากธนาคารและระบบบัญชีเพื่อเริ่มต้น</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h2 className="text-lg font-semibold flex items-center">
                  <Database className="mr-2 text-blue-500" /> Bank Statement (Source of Truth)
                </h2>
                <FileUpload label="อัปโหลด Bank CSV" onFileSelect={handleBankUpload} color="blue" />
                {bankData.length > 0 && (
                  <div className="bg-blue-50 p-3 rounded text-sm text-blue-700 flex items-center">
                    <CheckCircleIcon className="w-4 h-4 mr-2" /> โหลดข้อมูลสำเร็จ: {bankData.length} รายการ
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h2 className="text-lg font-semibold flex items-center">
                  <FileText className="mr-2 text-green-500" /> Book / GL Record
                </h2>
                <FileUpload label="อัปโหลด Book CSV" onFileSelect={handleBookUpload} color="green" />
                {bookData.length > 0 && (
                  <div className="bg-green-50 p-3 rounded text-sm text-green-700 flex items-center">
                    <CheckCircleIcon className="w-4 h-4 mr-2" /> โหลดข้อมูลสำเร็จ: {bookData.length} รายการ
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-center mt-8">
              <button
                onClick={handleProcess}
                disabled={bankData.length === 0 || bookData.length === 0}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg shadow-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center text-lg"
              >
                <Settings className="mr-2 h-5 w-5" /> ประมวลผลการจับคู่ (Reconcile)
              </button>
            </div>
            
            {/* Example Template */}
            <div className="mt-12 p-6 bg-gray-50 rounded-lg border border-gray-200">
               <h3 className="font-semibold text-gray-700 mb-2">โครงสร้างไฟล์ CSV ที่รองรับ</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono text-gray-600">
                  <div className="bg-white p-3 border rounded">
                     <strong>Bank Format:</strong><br/>
                     Date, Description, Amount<br/>
                     2023-10-01, Transfer from A, 5000.00
                  </div>
                  <div className="bg-white p-3 border rounded">
                     <strong>Book Format:</strong><br/>
                     Date, Detail, Total<br/>
                     2023-10-01, Receive A, 5000.00
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* Step 2: Dashboard & Results */}
        {activeTab === 'dashboard' && summary && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">ผลสรุปการ Reconcile</h2>
              <button onClick={reset} className="flex items-center text-gray-600 hover:text-blue-600">
                <RefreshCw className="w-4 h-4 mr-1" /> เริ่มต้นใหม่
              </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard title="Total Bank Items" value={summary.totalBank} color="bg-blue-100 text-blue-800" />
              <StatCard title="Matched" value={summary.matchedCount} color="bg-green-100 text-green-800" />
              <StatCard title="Unmatched (Bank)" value={summary.unmatchedBankCount} color="bg-red-100 text-red-800" />
              <StatCard title="Unmatched (Book)" value={summary.unmatchedBookCount} color="bg-orange-100 text-orange-800" />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               <div className="bg-white p-6 rounded-lg shadow col-span-1 flex flex-col items-center justify-center">
                  <h3 className="text-lg font-medium mb-4">สัดส่วนผลลัพธ์</h3>
                  <div className="w-full h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {pieData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36}/>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
               </div>
               
               <div className="bg-white p-6 rounded-lg shadow col-span-2">
                 <h3 className="text-lg font-medium mb-4">รายละเอียดรายการ (Match Detail)</h3>
                 <p className="text-sm text-gray-500 mb-4">
                   รายการที่ Unmatched หรือ Potential Match สามารถใช้ AI ช่วยวิเคราะห์ได้โดยการกดปุ่ม "วิเคราะห์ด้วย AI" ในตาราง
                 </p>
                 {/* Match Table Wrapper to control height if needed */}
                 <div className="">
                    <MatchTable results={results} />
                 </div>
               </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Helpers
const CheckCircleIcon = ({ className }: { className: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);

const StatCard = ({ title, value, color }: { title: string, value: number, color: string }) => (
  <div className={`p-4 rounded-lg shadow-sm ${color}`}>
    <p className="text-sm font-medium opacity-80">{title}</p>
    <p className="text-3xl font-bold mt-1">{value}</p>
  </div>
);

export default App;