import { useState, useEffect } from 'react';
import { 
  Hospital, 
  Calendar, 
  Printer, 
  BookOpen, 
  ShieldCheck, 
  ShieldAlert, 
  LogOut, 
  RefreshCw, 
  Trash2, 
  Database,
  Lock,
  ChevronRight,
  User,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { EMPLOYEES, RULES, SHIFT_DETAILS } from './constants';
import { Employee, RosterData, SystemConfig, EmployeeShifts } from './types';
import { getDaysInMonth, getDayName, isWeekend, validateShiftSelection } from './utils';
import { 
  getAdminConfig, 
  setAdminConfig, 
  subscribeToRoster, 
  saveEmployeeShifts,
  seedRosterMockData,
  clearRoster
} from './firebaseService';

// Import our custom sub-components
import RulesModal from './components/RulesModal';
import AdminSetupModal from './components/AdminSetupModal';
import AdminVerifyModal from './components/AdminVerifyModal';
import ShiftSelectionModal from './components/ShiftSelectionModal';

export default function App() {
  // State for date selection
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(7);
  
  // State for portals
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [currentUser, setCurrentUser] = useState<Employee>(EMPLOYEES[0]);

  // Real-time roster state from Firestore
  const [roster, setRoster] = useState<RosterData>({});
  const [loading, setLoading] = useState(true);

  // Modal Open/Close states
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isShiftOpen, setIsShiftOpen] = useState(false);
  const [isAdminSetupOpen, setIsAdminSetupOpen] = useState(false);
  const [isAdminVerifyOpen, setIsAdminVerifyOpen] = useState(false);

  // Selected cell for shift edit
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // Admin settings state
  const [adminConfig, setAdminConfigState] = useState<SystemConfig | null>(null);

  // Custom Alert / Feedback state
  const [alertMsg, setAlertMsg] = useState('');
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  // 1. Check & Fetch Admin password setting on mount
  useEffect(() => {
    const fetchConfig = async () => {
      const config = await getAdminConfig();
      setAdminConfigState(config);
    };
    fetchConfig();
  }, []);

  // 2. Real-time subscribe to shifts based on selected roster (year + month)
  useEffect(() => {
    setLoading(true);
    const rosterId = `${year}-${month}`;
    
    const unsubscribe = subscribeToRoster(
      rosterId,
      (data) => {
        setRoster(data);
        setLoading(false);
      },
      (err) => {
        console.error("Failed to subscribe to roster:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [year, month]);

  const daysCount = getDaysInMonth(year, month);
  const rosterId = `${year}-${month}`;

  // Helper to trigger alert dialog
  const showAlert = (msg: string) => {
    setAlertMsg(msg);
    setIsAlertOpen(true);
  };

  // Switch to Staff mode
  const handleSwitchToStaff = () => {
    setIsAdminMode(false);
  };

  // Switch to Admin mode - validation process
  const handleSwitchToAdmin = async () => {
    // 1. Refresh config state from db
    const config = await getAdminConfig();
    setAdminConfigState(config);

    if (!config || !config.isConfigured) {
      // First time setting up password
      setIsAdminSetupOpen(true);
    } else {
      // Password already set. Check localStorage session
      const hasAccess = localStorage.getItem('admin_access') === 'true';
      if (hasAccess) {
        setIsAdminMode(true);
      } else {
        setIsAdminVerifyOpen(true);
      }
    }
  };

  // Handle setting admin password (First Time)
  const handleAdminSetupSave = async (password: string) => {
    const newConfig = { isConfigured: true, password };
    await setAdminConfig(newConfig);
    setAdminConfigState(newConfig);
    
    // Grant session access and switch to Admin Mode
    localStorage.setItem('admin_access', 'true');
    setIsAdminSetupOpen(false);
    setIsAdminMode(true);
    showAlert('管理者密碼設定成功！已自動完成權限認證。');
  };

  // Handle password verification (Subsequent entries from other sessions/devices)
  const handleAdminVerify = async (password: string): Promise<boolean> => {
    if (adminConfig && adminConfig.password === password) {
      localStorage.setItem('admin_access', 'true');
      setIsAdminVerifyOpen(false);
      setIsAdminMode(true);
      return true;
    }
    return false;
  };

  // Admin Session logout
  const handleAdminLogout = () => {
    localStorage.removeItem('admin_access');
    setIsAdminMode(false);
    showAlert('已安全退出管理者模式。');
  };

  // Reset admin password button (Inside Admin Panel)
  const handleResetPassword = () => {
    setIsAdminSetupOpen(true);
  };

  // Handle Cell Click (Open Shift Selector)
  const handleCellClick = (emp: Employee, day: number) => {
    // If not in admin mode, staff can only edit their OWN shifts
    if (!isAdminMode && currentUser.id !== emp.id) {
      showAlert(`您目前是以【${currentUser.name}】身分瀏覽。前台模式下，您僅可修改您自已的自主預約排班。`);
      return;
    }
    
    setSelectedEmp(emp);
    setSelectedDay(day);
    setIsShiftOpen(true);
  };

  // Apply shift changes
  const handleApplyShift = async (shiftCode: string, priority: 'red' | 'green' | null) => {
    if (!selectedEmp || !selectedDay) return;

    const currentEmpShifts = roster[selectedEmp.id] || {};
    
    // Validate custom rule checks
    const check = validateShiftSelection(
      currentEmpShifts,
      selectedDay,
      shiftCode,
      priority,
      daysCount
    );

    if (!check.valid) {
      showAlert(check.msg || '違反排班規範限制！');
      return;
    }

    // Prepare updated shifts
    const updatedShifts = { ...currentEmpShifts };
    if (shiftCode === '') {
      delete updatedShifts[selectedDay];
    } else {
      updatedShifts[selectedDay] = { shift: shiftCode.toUpperCase(), priority };
    }

    // Save to Firestore real-time
    setIsShiftOpen(false);
    await saveEmployeeShifts(rosterId, selectedEmp.id, selectedEmp.name, selectedEmp.level, updatedShifts);
  };

  // Seed default demo shifts
  const handleSeedDemo = async () => {
    const confirmSeed = window.confirm("確定要載入手術室範例自主班表資料嗎？這將覆蓋本月現有排班。");
    if (!confirmSeed) return;
    
    setLoading(true);
    await seedRosterMockData(rosterId);
    setLoading(false);
    showAlert('範例資料載入完成！');
  };

  // Clear Roster
  const handleClearRoster = async () => {
    const confirmClear = window.confirm("確定要清空本月的所有排班紀錄嗎？此動作無法復原。");
    if (!confirmClear) return;
    
    setLoading(true);
    await clearRoster(rosterId);
    setLoading(false);
    showAlert('本月排班紀錄已完全清空。');
  };

  // --- Calculations for Daily Statistics ---
  const getDailyCounts = (day: number) => {
    let dCount = 0;
    let midCount = 0;
    let nightCount = 0;
    let rCount = 0;

    EMPLOYEES.forEach((emp) => {
      const shiftDetail = roster[emp.id]?.[day];
      if (shiftDetail) {
        const s = shiftDetail.shift.toUpperCase();
        if (s === 'R') {
          rCount++;
        } else if (s === 'D7' || s === 'E4') {
          midCount++;
        } else if (s === 'E' || s === 'E5' || s === 'C' || s === 'N') {
          nightCount++;
        } else if (s.startsWith('D')) {
          dCount++;
        }
      }
    });

    return { dCount, midCount, nightCount, rCount };
  };

  // Check compliance violations for display
  const getRosterViolations = () => {
    const violations: string[] = [];
    
    for (let d = 1; d <= daysCount; d++) {
      const { rCount } = getDailyCounts(d);
      const isWkEnd = isWeekend(year, month, d);
      
      // Mon-Fri: max off count is 3
      if (!isWkEnd && rCount > RULES.maxWeekdayOff) {
        violations.push(`${month}月${d}日 (週${getDayName(year, month, d)}) 休假人數(${rCount}) 超出平日上限 ${RULES.maxWeekdayOff} 人`);
      }
    }
    return violations;
  };

  const violationsList = getRosterViolations();

  return (
    <div className="h-screen flex flex-col overflow-hidden text-gray-800 bg-emerald-50/20 font-sans">
      
      {/* Navbar (Hidden in Print) */}
      <header className="bg-teal-700 text-white shadow-md px-4 py-3 shrink-0 flex flex-col sm:flex-row justify-between items-center gap-3 print-hide">
        <div className="flex items-center gap-3">
          <div className="bg-teal-600 p-1.5 rounded-lg">
            <Hospital className="w-6 h-6 text-emerald-200" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-wide">雲基手術室自主排班系統</h1>
            <p className="text-[10px] text-teal-100 opacity-90">雲林基督教醫院手術室同仁自主填報與排程調度</p>
          </div>
        </div>

        {/* Portal Mode Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Mode Tabs */}
          <div className="bg-teal-800/80 p-0.5 rounded-xl flex">
            <button
              onClick={handleSwitchToStaff}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${!isAdminMode ? 'bg-teal-600 text-white shadow-sm' : 'text-teal-200 hover:text-white'}`}
            >
              前台自主排班
            </button>
            <button
              onClick={handleSwitchToAdmin}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${isAdminMode ? 'bg-amber-600 text-white shadow-sm' : 'text-teal-200 hover:text-white'}`}
            >
              {adminConfig?.isConfigured ? <ShieldCheck className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              後台管理區
            </button>
          </div>

          {/* User selector (For Front-end Mode) */}
          {!isAdminMode ? (
            <div className="bg-teal-800/90 rounded-xl px-3 py-1 flex items-center gap-1.5 text-xs">
              <User className="w-3.5 h-3.5 text-teal-300" />
              <span className="text-teal-100 font-medium">當前身分：</span>
              <select 
                value={currentUser.id} 
                onChange={(e) => {
                  const selected = EMPLOYEES.find(emp => emp.id === e.target.value);
                  if (selected) setCurrentUser(selected);
                }}
                className="bg-transparent text-white font-bold outline-none cursor-pointer border-none"
              >
                {EMPLOYEES.map((emp) => (
                  <option key={emp.id} value={emp.id} className="text-gray-800">
                    {emp.name} ({emp.id.slice(-4)})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="bg-amber-900/60 rounded-xl px-3 py-1.5 flex items-center gap-2 text-xs font-bold border border-amber-500/30">
              <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></span>
              <span className="text-amber-100">護理長 (管理員)</span>
              <button 
                onClick={handleAdminLogout} 
                className="ml-1 hover:text-amber-300 transition cursor-pointer"
                title="登出管理者模式"
              >
                <LogOut className="w-4 h-4 inline" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Roster View Controls (Hidden in Print) */}
      <div className="bg-white p-3 sm:px-5 border-b border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 shrink-0 print-hide">
        {/* Roster Month Selectors */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">
            <Calendar className="w-4 h-4 text-gray-500" />
            <select 
              value={year} 
              onChange={(e) => setYear(Number(e.target.value))}
              className="bg-transparent border-none text-sm font-bold text-gray-700 outline-none cursor-pointer"
            >
              <option value={2025}>民國 114 年</option>
              <option value={2026}>民國 115 年</option>
              <option value={2027}>民國 116 年</option>
              <option value={2028}>民國 117 年</option>
            </select>
          </div>
          <div className="flex items-center gap-1 bg-gray-100 px-2 py-1.5 rounded-lg border border-gray-200">
            <select 
              value={month} 
              onChange={(e) => setMonth(Number(e.target.value))}
              className="bg-transparent border-none text-sm font-bold text-gray-700 outline-none cursor-pointer px-2"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>{m} 月</option>
              ))}
            </select>
          </div>

          <div className="text-xs text-gray-500 pl-1 font-semibold flex items-center gap-1">
            <span className="w-2 h-2 bg-teal-600 rounded-full inline-block"></span>
            手術室總編制：{EMPLOYEES.length} 人
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={() => setIsRulesOpen(true)}
            className="bg-white border border-teal-200 hover:bg-teal-50 text-teal-700 px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1 cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" /> 規範說明
          </button>
          
          <button 
            onClick={() => window.print()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1 cursor-pointer shadow"
          >
            <Printer className="w-3.5 h-3.5" /> 列印 / 導出 PDF
          </button>

          {/* Admin Power Operations */}
          {isAdminMode && (
            <div className="flex items-center gap-1.5 bg-amber-50 p-1 rounded-xl border border-amber-200 ml-1">
              <button 
                onClick={handleSeedDemo}
                className="bg-amber-600 hover:bg-amber-700 text-white px-2.5 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                title="匯入系統範例資料方便測試"
              >
                <Database className="w-3 h-3" /> 範例資料
              </button>
              <button 
                onClick={handleClearRoster}
                className="bg-white border border-red-200 hover:bg-red-50 text-red-600 px-2 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                title="清空本月所有班表"
              >
                <Trash2 className="w-3 h-3" /> 清空
              </button>
              <button 
                onClick={handleResetPassword}
                className="bg-white border border-gray-200 hover:bg-gray-100 text-gray-600 px-2 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                title="重新設定密碼"
              >
                <RefreshCw className="w-3 h-3" /> 密碼
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Real-time sync connection loading state */}
      {loading && (
        <div className="bg-teal-50 border-b border-teal-100 p-2 text-xs text-teal-800 flex items-center justify-center gap-2 font-medium shrink-0 print-hide">
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-600" />
          <span>正在與雲端 Firebase 資料庫進行安全連線與即時同步中...</span>
        </div>
      )}

      {/* Compliance Violation Banner */}
      {!loading && violationsList.length > 0 && isAdminMode && (
        <div className="bg-red-50 border-b border-red-100 p-2 text-xs text-red-700 flex items-center justify-between gap-3 shrink-0 print-hide">
          <div className="flex items-center gap-2 font-bold">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
            <span>排班警示：本月有 {violationsList.length} 項同仁預約休假超過平日上限 {RULES.maxWeekdayOff} 人</span>
          </div>
          <div className="text-[10px] text-gray-400 font-medium hidden md:block">
            休假人數原則由管理員進行最終審核調配
          </div>
        </div>
      )}

      {/* Roster Table Workspace */}
      <div className="flex-1 overflow-hidden p-3 sm:p-5 flex flex-col gap-3 relative">
        
        {/* PRINT ONLY HEADER */}
        <div className="hidden print:block text-center mb-4">
          <h1 className="text-xl font-bold text-black">雲林基督教醫院手術室輪值表</h1>
          <p className="text-sm text-gray-600">
            西元 {year} 年 (民國 {year - 1911} 年) {month} 月份 | 手術室總編制：{EMPLOYEES.length} 人
          </p>
          <div className="flex justify-between mt-3 text-xs border-b border-gray-400 pb-1">
            <span>護理長：賴秀苗</span>
            <span>排班主管確認：____________________</span>
          </div>
        </div>

        {/* Scrollable Table Area */}
        <div className="bg-white rounded-xl shadow-sm flex-1 flex flex-col overflow-hidden border border-gray-200">
          <div className="flex-1 overflow-auto bg-gray-50/50 rounded-t-xl relative">
            <table className="w-full text-center border-collapse whitespace-nowrap bg-white text-xs">
              <thead className="sticky top-0 z-30 bg-gray-100 shadow-[0_1px_2px_rgba(0,0,0,0.05)] text-gray-600">
                {/* Weekdays Row */}
                <tr className="bg-gray-100">
                  <th rowSpan={2} className="sticky left-0 z-40 bg-gray-100 border-r border-b border-gray-300 px-2 py-2 text-center text-xs font-bold text-gray-800 min-w-[50px] print:border-black">代號</th>
                  <th rowSpan={2} className="sticky left-[50px] z-40 bg-gray-100 border-r border-b border-gray-300 px-3 py-2 text-center text-xs font-bold text-gray-800 min-w-[70px] shadow-[2px_0_4px_rgba(0,0,0,0.05)] print:border-black">姓名</th>
                  {Array.from({ length: daysCount }).map((_, i) => {
                    const day = i + 1;
                    const dayName = getDayName(year, month, day);
                    const isWk = isWeekend(year, month, day);
                    return (
                      <th 
                        key={`day-name-${day}`} 
                        className={`border-r border-gray-200 px-1 py-1 text-[10px] font-bold ${isWk ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-500'} print:border-black`}
                      >
                        {dayName}
                      </th>
                    );
                  })}
                </tr>
                {/* Day Numbers Row */}
                <tr className="bg-gray-100 border-b border-gray-300">
                  {Array.from({ length: daysCount }).map((_, i) => {
                    const day = i + 1;
                    const isWk = isWeekend(year, month, day);
                    return (
                      <th 
                        key={`day-num-${day}`} 
                        className={`border-r border-gray-200 px-1.5 py-1 text-sm font-black ${isWk ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-700'} print:border-black`}
                      >
                        {day}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {EMPLOYEES.map((emp, index) => {
                  const isOwnRow = currentUser.id === emp.id;
                  const rowBg = isOwnRow && !isAdminMode ? 'bg-teal-50/40' : (index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30');

                  return (
                    <tr 
                      key={emp.id} 
                      className={`group hover:bg-teal-50/20 transition-all ${rowBg}`}
                    >
                      {/* Employee ID column */}
                      <td className="sticky left-0 z-20 bg-inherit border-r border-gray-300 px-2 py-1 text-center font-mono text-[10px] text-gray-400 font-medium print:border-black print:text-black">
                        {emp.id.slice(-4)}
                      </td>
                      {/* Employee Name column */}
                      <td className="sticky left-[50px] z-20 bg-inherit border-r border-gray-300 px-3 py-1.5 text-center font-bold text-gray-700 shadow-[2px_0_4px_rgba(0,0,0,0.03)] flex items-center justify-center gap-1 min-h-[38px] print:border-black print:text-black">
                        <span className={isOwnRow && !isAdminMode ? 'text-teal-700 font-extrabold' : ''}>
                          {emp.name}
                        </span>
                        {emp.level === 'senior' && (
                          <span className="bg-blue-50 border border-blue-100 text-blue-700 text-[8px] font-semibold px-1 rounded-sm scale-90 print:hidden">資深</span>
                        )}
                      </td>

                      {/* Days columns */}
                      {Array.from({ length: daysCount }).map((_, i) => {
                        const day = i + 1;
                        const cellData = roster[emp.id]?.[day];
                        const s = cellData?.shift || '';
                        const p = cellData?.priority;

                        let styleBg = 'bg-transparent text-gray-400';
                        let fontStyle = 'font-normal';
                        
                        if (s) {
                          fontStyle = 'font-extrabold';
                          if (s === 'R') {
                            styleBg = 'bg-rose-50 text-rose-700';
                          } else if (s === 'E' || s === 'E5') {
                            styleBg = 'bg-amber-50 text-amber-700';
                          } else if (s === 'C' || s === 'N') {
                            styleBg = 'bg-purple-50 text-purple-700';
                          } else if (s === '控') {
                            styleBg = 'bg-slate-100 text-slate-700';
                          } else if (s.startsWith('D')) {
                            styleBg = 'bg-blue-50 text-blue-700';
                          } else {
                            styleBg = 'bg-teal-50 text-teal-800';
                          }
                        }

                        // Determine priority borders
                        let priorityStyle = '';
                        if (p === 'red') {
                          priorityStyle = 'border-2 border-red-500 rounded bg-red-100/10';
                        } else if (p === 'green') {
                          priorityStyle = 'border-2 border-green-500 rounded bg-green-100/10';
                        }

                        // Determine edit rights
                        const hasEditAccess = isAdminMode || isOwnRow;
                        const hoverEffect = hasEditAccess ? 'cursor-pointer hover:bg-teal-100' : 'cursor-not-allowed opacity-80';

                        return (
                          <td 
                            key={`${emp.id}-${day}`}
                            onClick={() => handleCellClick(emp, day)}
                            className={`border-r border-gray-200 p-0 text-center align-middle relative ${hoverEffect} print:border-black`}
                          >
                            <div className={`w-full h-9 flex items-center justify-center text-sm ${styleBg} transition-all`}>
                              <div className={`w-full h-full flex items-center justify-center font-bold px-1 ${priorityStyle}`}>
                                {s || '-'}
                              </div>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>

              {/* STATS FOOTER ROW */}
              <tfoot className="sticky bottom-0 z-30 bg-gray-100 border-t-2 border-gray-300 shadow-[0_-1px_3px_rgba(0,0,0,0.05)] font-bold text-[10px] sm:text-xs">
                {/* 1. 白班 */}
                <tr className="bg-gray-100 text-gray-700">
                  <td colSpan={2} className="sticky left-0 z-40 bg-gray-100 border-r border-b border-gray-300 px-3 py-1 text-right font-black shadow-[2px_0_4px_rgba(0,0,0,0.05)] text-blue-700">白班 (目標16)</td>
                  {Array.from({ length: daysCount }).map((_, i) => {
                    const day = i + 1;
                    const { dCount } = getDailyCounts(day);
                    const isShort = dCount < RULES.reqD;
                    return (
                      <td 
                        key={`stat-d-${day}`} 
                        className={`border-r border-b border-gray-200 text-center py-1 font-extrabold ${isShort ? 'text-red-500 bg-red-50/30' : 'text-blue-700 bg-blue-50/10'}`}
                      >
                        {dCount || ''}
                      </td>
                    );
                  })}
                </tr>

                {/* 2. 中班 */}
                <tr className="bg-gray-100 text-gray-700">
                  <td colSpan={2} className="sticky left-0 z-40 bg-gray-100 border-r border-b border-gray-300 px-3 py-1 text-right font-black shadow-[2px_0_4px_rgba(0,0,0,0.05)] text-yellow-700">中班 (目標2)</td>
                  {Array.from({ length: daysCount }).map((_, i) => {
                    const day = i + 1;
                    const { midCount } = getDailyCounts(day);
                    const isShort = midCount < RULES.reqMid;
                    return (
                      <td 
                        key={`stat-mid-${day}`} 
                        className={`border-r border-b border-gray-200 text-center py-1 font-extrabold ${isShort ? 'text-red-500 bg-red-50/30' : 'text-yellow-700 bg-yellow-50/10'}`}
                      >
                        {midCount || ''}
                      </td>
                    );
                  })}
                </tr>

                {/* 3. 夜班 */}
                <tr className="bg-gray-100 text-gray-700">
                  <td colSpan={2} className="sticky left-0 z-40 bg-gray-100 border-r border-b border-gray-300 px-3 py-1 text-right font-black shadow-[2px_0_4px_rgba(0,0,0,0.05)] text-purple-700">夜班 (目標3)</td>
                  {Array.from({ length: daysCount }).map((_, i) => {
                    const day = i + 1;
                    const { nightCount } = getDailyCounts(day);
                    const isShort = nightCount < (RULES.reqSmallN + RULES.reqBigN);
                    return (
                      <td 
                        key={`stat-night-${day}`} 
                        className={`border-r border-b border-gray-200 text-center py-1 font-extrabold ${isShort ? 'text-red-500 bg-red-50/30' : 'text-purple-700 bg-purple-50/10'}`}
                      >
                        {nightCount || ''}
                      </td>
                    );
                  })}
                </tr>

                {/* 4. 休假人數 */}
                <tr className="bg-gray-100 text-gray-700">
                  <td colSpan={2} className="sticky left-0 z-40 bg-gray-100 border-r border-gray-300 px-3 py-1 text-right font-black shadow-[2px_0_4px_rgba(0,0,0,0.05)] text-rose-600">休假人數</td>
                  {Array.from({ length: daysCount }).map((_, i) => {
                    const day = i + 1;
                    const { rCount } = getDailyCounts(day);
                    const isExceeded = rCount > RULES.maxWeekdayOff && !isWeekend(year, month, day);
                    return (
                      <td 
                        key={`stat-r-${day}`} 
                        className={`border-r border-gray-200 text-center py-1 font-extrabold ${isExceeded ? 'text-red-600 bg-red-100/40' : 'text-rose-600'}`}
                      >
                        {rCount || ''}
                      </td>
                    );
                  })}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Legend Panel / Instructions (Hidden in Print) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 shrink-0 flex flex-col md:flex-row justify-between items-center gap-3 print-hide">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold text-gray-500">班別對照：</span>
            {Object.entries(SHIFT_DETAILS).map(([code, details]) => (
              <div key={code} className="flex items-center gap-1.5 text-xs font-semibold">
                <span 
                  className="px-2 py-0.5 rounded text-[10px] font-black inline-block shadow-sm"
                  style={{ backgroundColor: details.color, color: details.textColor }}
                >
                  {code}
                </span>
                <span className="text-gray-600 font-medium">{details.name.split(' ')[0]}</span>
              </div>
            ))}
          </div>

          <div className="text-[11px] text-gray-500 font-medium bg-teal-50/50 px-3 py-1 rounded-lg border border-teal-100/50">
            {isAdminMode ? (
              <span className="text-amber-700 font-semibold">★ 您已進入【管理者模式】，點擊任意儲存格即可為所有同仁排班。</span>
            ) : (
              <span className="text-teal-700">📌 您正以【{currentUser.name}】身分自主排班，點擊您該列的儲存格可自主選填與預約休假。</span>
            )}
          </div>
        </div>
      </div>

      {/* --- MODALS WORKSPACE --- */}
      
      {/* 1. Rules modal */}
      <RulesModal 
        isOpen={isRulesOpen}
        onClose={() => setIsRulesOpen(false)}
      />

      {/* 2. Setup admin password on first access */}
      <AdminSetupModal 
        isOpen={isAdminSetupOpen}
        onClose={() => setIsAdminSetupOpen(false)}
        onSave={handleAdminSetupSave}
      />

      {/* 3. Verify admin password modal */}
      <AdminVerifyModal 
        isOpen={isAdminVerifyOpen}
        onClose={() => setIsAdminVerifyOpen(false)}
        onVerify={handleAdminVerify}
      />

      {/* 4. Shift selection modal */}
      <ShiftSelectionModal 
        isOpen={isShiftOpen}
        onClose={() => setIsShiftOpen(false)}
        employee={selectedEmp}
        day={selectedDay}
        year={year}
        month={month}
        currentShifts={selectedEmp ? (roster[selectedEmp.id] || {}) : {}}
        onApply={handleApplyShift}
      />

      {/* 5. Custom System Alert Dialog */}
      {isAlertOpen && (
        <div className="fixed inset-0 bg-black/60 z-[90] flex justify-center items-center backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col transform transition-all duration-300">
            <div className="bg-red-600 text-white p-4 flex items-center gap-2 font-bold text-lg">
              <ShieldAlert className="w-5 h-5 text-red-200" /> 排班規則或權限提示
            </div>
            <div className="p-6 text-gray-700 text-sm font-semibold leading-relaxed whitespace-pre-wrap">
              {alertMsg}
            </div>
            <div className="bg-gray-50 p-4 border-t border-gray-100 flex justify-end">
              <button 
                onClick={() => setIsAlertOpen(false)} 
                className="bg-red-600 hover:bg-red-700 text-white font-bold px-5 py-2 rounded-lg text-sm transition shadow cursor-pointer"
              >
                我知道了
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
