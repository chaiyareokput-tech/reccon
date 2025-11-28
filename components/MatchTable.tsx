import React, { useState } from 'react';
import { MatchResult, MatchStatus } from '../types';
import { CheckCircle, AlertTriangle, XCircle, Sparkles, Loader2 } from 'lucide-react';
import { analyzeMismatch } from '../services/geminiService';

interface MatchTableProps {
  results: MatchResult[];
}

export const MatchTable: React.FC<MatchTableProps> = ({ results }) => {
  const [filter, setFilter] = useState<MatchStatus | 'ALL'>('ALL');
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<Record<string, string>>({});

  const filteredResults = results.filter(r => filter === 'ALL' || r.status === filter);

  const handleAnalyze = async (item: MatchResult) => {
    setAnalyzingId(item.id);
    const suggestion = await analyzeMismatch(item);
    setAiSuggestions(prev => ({ ...prev, [item.id]: suggestion }));
    setAnalyzingId(null);
  };

  const getStatusIcon = (status: MatchStatus) => {
    switch (status) {
      case MatchStatus.MATCHED: return <CheckCircle className="text-green-500 w-5 h-5" />;
      case MatchStatus.POTENTIAL: return <AlertTriangle className="text-yellow-500 w-5 h-5" />;
      case MatchStatus.UNMATCHED: return <XCircle className="text-red-500 w-5 h-5" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Filters */}
      <div className="p-4 border-b flex space-x-2 bg-gray-50">
        {(['ALL', MatchStatus.MATCHED, MatchStatus.POTENTIAL, MatchStatus.UNMATCHED] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === f 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'bg-white text-gray-700 border hover:bg-gray-100'
            }`}
          >
            {f === 'ALL' ? 'ทั้งหมด' : f === MatchStatus.MATCHED ? 'ตรงกัน (Matched)' : f === MatchStatus.POTENTIAL ? 'ต้องตรวจสอบ (Potential)' : 'ไม่ตรงกัน (Unmatched)'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">สถานะ</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50">ข้อมูล Bank (Source of Truth)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-green-50">ข้อมูล GL (Book)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">หมายเหตุ / AI</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredResults.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(item.status)}
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      item.status === MatchStatus.MATCHED ? 'bg-green-100 text-green-800' :
                      item.status === MatchStatus.POTENTIAL ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {item.confidence}%
                    </span>
                  </div>
                </td>
                
                {/* Bank Data */}
                <td className="px-6 py-4 bg-blue-50/30 text-sm text-gray-700 align-top">
                  {item.bankTx ? (
                    <div>
                      <div className="font-bold">{item.bankTx.date}</div>
                      <div>{item.bankTx.description}</div>
                      <div className="font-mono mt-1 text-blue-700 font-bold">
                        {item.bankTx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-400 italic">- ไม่มีข้อมูล -</span>
                  )}
                </td>

                {/* Book Data */}
                <td className="px-6 py-4 bg-green-50/30 text-sm text-gray-700 align-top">
                  {item.bookTx ? (
                    <div>
                      <div className="font-bold">{item.bookTx.date}</div>
                      <div>{item.bookTx.description}</div>
                      <div className="font-mono mt-1 text-green-700 font-bold">
                        {item.bookTx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-400 italic">- ไม่มีข้อมูล -</span>
                  )}
                </td>

                {/* Notes & Actions */}
                <td className="px-6 py-4 text-sm text-gray-500 align-top w-1/4">
                  <p className="mb-2">{item.note}</p>
                  
                  {item.status !== MatchStatus.MATCHED && (
                    <div className="mt-2">
                       {aiSuggestions[item.id] ? (
                         <div className="bg-purple-50 p-3 rounded border border-purple-200 text-purple-800 text-xs">
                           <div className="flex items-center mb-1 font-bold">
                              <Sparkles className="w-3 h-3 mr-1" /> AI Suggestion:
                           </div>
                           {aiSuggestions[item.id]}
                         </div>
                       ) : (
                         <button
                          onClick={() => handleAnalyze(item)}
                          disabled={analyzingId === item.id}
                          className="flex items-center text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200 disabled:opacity-50 transition-colors"
                         >
                           {analyzingId === item.id ? (
                             <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> กำลังวิเคราะห์...</>
                           ) : (
                             <><Sparkles className="w-3 h-3 mr-1" /> วิเคราะห์ด้วย AI</>
                           )}
                         </button>
                       )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};