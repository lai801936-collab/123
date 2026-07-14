import { Employee } from './types';

export const EMPLOYEES: Employee[] = [
  { id: '801936', name: '賴秀苗', level: 'senior' },
  { id: '802031', name: '張妤涓', level: 'senior' },
  { id: '802300', name: '黃如潔', level: 'senior' },
  { id: '816088', name: '林宜錦', level: 'senior' },
  { id: '816206', name: '楊育鈞', level: 'senior' },
  { id: '816834', name: '陳安琪', level: 'senior' },
  { id: '816912', name: '林敏麗', level: 'senior' },
  { id: '817496', name: '黃敏雯', level: 'senior' },
  { id: '819256', name: '黃培微', level: 'junior' },
  { id: '820061', name: '蕭慧婷', level: 'junior' },
  { id: '820084', name: '李孟怡', level: 'junior' },
  { id: '820287', name: '張琬阡', level: 'junior' },
  { id: '820482', name: '程琳恩', level: 'junior' },
  { id: '820652', name: '黃羽羚', level: 'junior' },
  { id: '820687', name: '吳佳娟', level: 'junior' },
  { id: '820740', name: '林蕙均', level: 'junior' },
  { id: '820851', name: '鍾欣諭', level: 'junior' },
  { id: '820746', name: '楊翔仁', level: 'junior' },
  { id: '820950', name: '李宜珊', level: 'junior' },
  { id: '821003', name: '陳燕雪', level: 'junior' }
];

export const RULES = {
  minRestHours: 11,
  maxRedHoliday: 2,
  maxGreenHoliday: 2,
  maxConsecutiveOff: 7,
  reqD: 16,     // D, D1-D6
  reqMid: 2,    // D7, E4 (needs senior+junior)
  reqSmallN: 2, // E, E5 (needs senior+junior)
  reqBigN: 1,   // C (needs senior)
  maxWeekdayOff: 3 // Mon-Fri max R
};

export const SHIFT_DETAILS = {
  'D': { name: '白班 (D)', color: '#eff6ff', textColor: '#1d4ed8' },
  'E': { name: '小夜 (E)', color: '#fefce8', textColor: '#a16207' },
  'C': { name: '大夜 (C)', color: '#faf5ff', textColor: '#7e22ce' },
  'R': { name: '休假 (R)', color: '#fff1f2', textColor: '#be123c' },
  '控': { name: '監控 (控)', color: '#f3f4f6', textColor: '#374151' }
};
