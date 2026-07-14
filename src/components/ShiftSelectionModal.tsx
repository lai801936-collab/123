import { useState, useEffect, FormEvent } from 'react';
import { X, Eraser, Check } from 'lucide-react';
import { ShiftDetail, EmployeeShifts, Employee } from '../types';
import { SHIFT_DETAILS } from '../constants';

interface ShiftSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  day: number | null;
  year: number;
  month: number;
  currentShifts: EmployeeShifts;
  onApply: (shiftCode: string, priority: 'red' | 'green' | null) => void;
}

export default function ShiftSelectionModal({
  isOpen,
  onClose,
  employee,
  day,
  year,
  month,
  currentShifts,
  onApply
}: ShiftSelectionModalProps) {
  const [customShift, setCustomShift] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Priority counts
  const [priorityCount, setPriorityCount] = useState({ red: 0, green: 0 });

  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      setCustomShift('');

      // Calculate priority counts for the current employee
      let red = 0;
      let green = 0;
      Object.keys(currentShifts).forEach((d) => {
        const numDay = Number(d);
        if (numDay === day) return; // Skip the selected day
        if (currentShifts[numDay]?.priority === 'red') red++;
        if (currentShifts[numDay]?.priority === 'green') green++;
      });
      setPriorityCount({ red, green });
    }
  }, [isOpen, currentShifts, day]);

  if (!isOpen || !employee || !day) return null;

  const dayOfWeekStrs = ['日', '一', '二', '三', '四', '五', '六'];
  const dateObj = new Date(year, month - 1, day);
  const dayName = dayOfWeekStrs[dateObj.getDay()];

  const handleCustomSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!customShift.trim()) return;
    onApply(customShift.trim().toUpperCase(), null);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-end sm:items-center backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:w-[420px] overflow-hidden transform transition-all duration-300">
        {/* Header */}
        <div className="bg-teal-600 text-white p-4 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-lg" id="modal-emp-name">選擇排班別</h3>
            <p className="text-xs text-teal-100" id="modal-date-info">
              {employee.name} — {year}年{month}月{day}日 ({dayName})
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="text-white bg-white/20 hover:bg-white/30 rounded-full w-8 h-8 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {errorMsg && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs font-bold border-l-4 border-red-500">
              {errorMsg}
            </div>
          )}

          {/* Regular shifts */}
          <div>
            <p className="text-xs text-gray-500 font-bold mb-2">常規科內班別</p>
            <div className="grid grid-cols-4 gap-2">
              <button 
                type="button"
                onClick={() => onApply('D', null)}
                className="py-2.5 rounded-lg font-bold border-2 border-blue-100 bg-blue-50 text-blue-700 hover:bg-blue-100 transition cursor-pointer flex flex-col items-center justify-center"
              >
                <span className="text-sm">D</span>
                <span className="text-[9px] font-normal text-blue-600">白班</span>
              </button>
              <button 
                type="button"
                onClick={() => onApply('E', null)}
                className="py-2.5 rounded-lg font-bold border-2 border-yellow-100 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 transition cursor-pointer flex flex-col items-center justify-center"
              >
                <span className="text-sm">E</span>
                <span className="text-[9px] font-normal text-yellow-600">小夜</span>
              </button>
              <button 
                type="button"
                onClick={() => onApply('C', null)}
                className="py-2.5 rounded-lg font-bold border-2 border-purple-100 bg-purple-50 text-purple-700 hover:bg-purple-100 transition cursor-pointer flex flex-col items-center justify-center"
              >
                <span className="text-sm">C</span>
                <span className="text-[9px] font-normal text-purple-600">大夜</span>
              </button>
              <button 
                type="button"
                onClick={() => onApply('', null)}
                className="py-2.5 rounded-lg font-bold border-2 border-dashed border-gray-300 bg-white text-gray-500 hover:bg-gray-50 transition cursor-pointer flex flex-col items-center justify-center"
              >
                <Eraser className="w-4 h-4 text-gray-400 mb-0.5" />
                <span className="text-[10px]">清除班別</span>
              </button>
            </div>
          </div>

          {/* Special holiday priority boxes */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs text-gray-500 font-bold">自主預約休假 (規範上限 2)</p>
              <span className="text-xs font-semibold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">
                已用: 紅 {priorityCount.red}/2 綠 {priorityCount.green}/2
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {/* Red priority */}
              <button 
                type="button"
                onClick={() => {
                  if (priorityCount.red >= 2) {
                    setErrorMsg('每月第一優先紅框已達 2 段上限！');
                  } else {
                    onApply('R', 'red');
                  }
                }}
                className={`py-2 rounded-lg font-bold border-2 border-red-500 text-red-700 hover:bg-red-50 transition cursor-pointer flex flex-col items-center justify-center leading-tight ${priorityCount.red >= 2 ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'bg-red-50/20'}`}
              >
                <span className="text-sm">R (紅框)</span>
                <span className="text-[9px] font-normal text-red-600">第一優先核心假</span>
              </button>

              {/* Green priority */}
              <button 
                type="button"
                onClick={() => {
                  if (priorityCount.green >= 2) {
                    setErrorMsg('每月第二優先綠框已達 2 段上限！');
                  } else {
                    onApply('R', 'green');
                  }
                }}
                className={`py-2 rounded-lg font-bold border-2 border-green-500 text-green-700 hover:bg-green-50 transition cursor-pointer flex flex-col items-center justify-center leading-tight ${priorityCount.green >= 2 ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'bg-green-50/20'}`}
              >
                <span className="text-sm">R (綠框)</span>
                <span className="text-[9px] font-normal text-green-600">第二優先休假</span>
              </button>

              {/* Normal holiday */}
              <button 
                type="button"
                onClick={() => onApply('R', null)}
                className="py-2 rounded-lg font-bold border-2 border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100 transition cursor-pointer flex flex-col items-center justify-center leading-tight"
              >
                <span className="text-sm">R (一般)</span>
                <span className="text-[9px] font-normal text-gray-500">一般排休/例休</span>
              </button>
            </div>
          </div>

          {/* Custom and specialized shifts */}
          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-500 font-bold mb-2">其他細分/指定班別 (如 D1-D7, E4, E5, 控)</p>
            <form onSubmit={handleCustomSubmit} className="flex gap-2">
              <input 
                type="text" 
                value={customShift}
                onChange={(e) => setCustomShift(e.target.value)}
                placeholder="例如 D1, E4, 控..." 
                className="flex-1 border-2 border-gray-200 rounded-lg px-3 py-1.5 uppercase focus:border-teal-500 focus:outline-none font-bold text-sm"
              />
              <button 
                type="submit"
                className="bg-teal-600 text-white px-4 py-1.5 rounded-lg font-bold text-sm hover:bg-teal-700 transition cursor-pointer flex items-center gap-1 shrink-0"
              >
                <Check className="w-4 h-4" /> 套用
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
