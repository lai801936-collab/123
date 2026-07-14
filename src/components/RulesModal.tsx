import { X, BookOpen } from 'lucide-react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RulesModal({ isOpen, onClose }: RulesModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex justify-center items-center backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col transform transition-all duration-300">
        {/* Header */}
        <div className="bg-teal-700 text-white p-4 flex justify-between items-center shrink-0">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-teal-200" /> 手術室自主排班規範摘要
          </h3>
          <button 
            onClick={onClose} 
            className="text-white hover:bg-white/20 p-1.5 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Body */}
        <div className="p-6 overflow-y-auto text-sm text-gray-700 leading-relaxed space-y-5">
          <div>
            <h4 className="font-bold text-teal-800 border-b border-teal-100 pb-1.5 mb-2 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-teal-600 rounded-full inline-block"></span>
              一、 預約班優先順序
            </h4>
            <ul className="list-disc pl-5 space-y-2 text-gray-600">
              <li>
                <span className="text-red-600 font-bold border border-red-500 px-1.5 py-0.5 rounded bg-red-50 text-xs mr-1">紅框</span>
                <span className="font-medium text-gray-800">(第一優先)</span>：每人每月最多可設定 2 段核心假，保障同仁關鍵休息需求。
              </li>
              <li>
                <span className="text-green-600 font-bold border border-green-500 px-1.5 py-0.5 rounded bg-green-50 text-xs mr-1">綠框</span>
                <span className="font-medium text-gray-800">(第二優先)</span>：每人每月最多可設定 2 段，作為人員班表調換與彈性調度參考。
              </li>
              <li>其餘一般工作日之休假，均以一般「<span className="font-semibold text-red-600">R</span>」標註。</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold text-teal-800 border-b border-teal-100 pb-1.5 mb-2 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-teal-600 rounded-full inline-block"></span>
              二、 休假與人力限制
            </h4>
            <ul className="list-disc pl-5 space-y-2 text-gray-600">
              <li><span className="font-bold text-gray-800">連假上限：</span>每次最多僅可預約連續 <span className="font-semibold text-teal-700">7</span> 天休假（避免長假影響科內運作）。</li>
              <li><span className="font-bold text-gray-800">放假名額：</span>週一至週五每日預約休假人數上限原則為 <span className="font-semibold text-teal-700">2~3</span> 人。</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold text-teal-800 border-b border-teal-100 pb-1.5 mb-2 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-teal-600 rounded-full inline-block"></span>
              三、 排班間隔與紀律
            </h4>
            <ul className="list-disc pl-5 space-y-2 text-gray-600">
              <li><span className="font-bold text-gray-800">法定休息：</span>保證兩班之間有至少 <span className="font-semibold text-teal-700">11</span> 小時的休息時間。</li>
              <li><span className="text-red-600 font-bold">禁止跳班：</span>大夜班隔日絕對不可直接接續白班（例如 C 接 D），系統會自動阻擋。</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold text-teal-800 border-b border-teal-100 pb-1.5 mb-2 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-teal-600 rounded-full inline-block"></span>
              四、 每日基本人力目標
            </h4>
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <p className="text-gray-500 font-medium">白班 (D / D1-D6)：</p>
                <p className="font-bold text-gray-800 text-sm">目標 16 人</p>
              </div>
              <div className="space-y-1">
                <p className="text-gray-500 font-medium">中班 (D7 / E4)：</p>
                <p className="font-bold text-gray-800 text-sm">目標 2 人 <span className="text-xs font-normal text-gray-500">(資深+資淺)</span></p>
              </div>
              <div className="space-y-1">
                <p className="text-gray-500 font-medium">小夜 (E / E5)：</p>
                <p className="font-bold text-gray-800 text-sm">目標 2 人 <span className="text-xs font-normal text-gray-500">(資深+資淺)</span></p>
              </div>
              <div className="space-y-1">
                <p className="text-gray-500 font-medium">大夜 (C)：</p>
                <p className="font-bold text-gray-800 text-sm">目標 1 人 <span className="text-xs font-normal text-red-500">(限資深人員)</span></p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="bg-gray-50 p-4 border-t border-gray-100 flex justify-end shrink-0">
          <button 
            onClick={onClose} 
            className="bg-teal-600 text-white px-6 py-2 rounded-lg font-bold shadow hover:bg-teal-700 transition cursor-pointer"
          >
            我瞭解了
          </button>
        </div>
      </div>
    </div>
  );
}
