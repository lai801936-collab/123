import { ShiftDetail, EmployeeShifts, ValidationResult } from './types';
import { RULES } from './constants';

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function validateShiftSelection(
  empRoster: EmployeeShifts,
  date: number,
  shiftCode: string,
  priority: 'red' | 'green' | null,
  totalDays: number
): ValidationResult {
  if (!shiftCode) return { valid: true };

  const s = shiftCode.toUpperCase();

  // 1. 11-Hour Rest Rule (No Jumping Shifts)
  if (s.startsWith('D')) {
    // If today is Day shift, check yesterday
    if (date > 1) {
      const prev = empRoster[date - 1]?.shift?.toUpperCase() || '';
      if (prev.startsWith('E') || prev === 'C' || prev.startsWith('N')) {
        return {
          valid: false,
          msg: `違反「11小時休息規定」：昨日為夜班/中班 (${prev})，今日不可排白班 (${s})，請避免跳班！`
        };
      }
    }
  }

  if (s.startsWith('E') || s === 'C' || s.startsWith('N')) {
    // If today is night/evening shift, check tomorrow
    if (date < totalDays) {
      const next = empRoster[date + 1]?.shift?.toUpperCase() || '';
      if (next.startsWith('D')) {
        return {
          valid: false,
          msg: `違反「11小時休息規定」：今日為中班/夜班 (${s})，明日已排白班 (${next})，請避免跳班！`
        };
      }
    }
  }

  // 2. Holiday Priority Box Limits
  if (priority === 'red' || priority === 'green') {
    let redCount = 0;
    let greenCount = 0;
    for (let d = 1; d <= totalDays; d++) {
      if (d === date) continue; // Skip the date currently being updated
      if (empRoster[d]?.priority === 'red') redCount++;
      if (empRoster[d]?.priority === 'green') greenCount++;
    }

    if (priority === 'red' && redCount >= RULES.maxRedHoliday) {
      return {
        valid: false,
        msg: `每月紅框 (第一優先節日) 上限為 ${RULES.maxRedHoliday} 段，您已達上限！`
      };
    }
    if (priority === 'green' && greenCount >= RULES.maxGreenHoliday) {
      return {
        valid: false,
        msg: `每月綠框 (第二優先節日) 上限為 ${RULES.maxGreenHoliday} 段，您已達上限！`
      };
    }
  }

  // 3. Consecutive Days Off (Max 7)
  if (s === 'R') {
    let count = 1;
    // Check backwards
    for (let d = date - 1; d >= 1; d--) {
      if (empRoster[d]?.shift?.toUpperCase() === 'R') {
        count++;
      } else {
        break;
      }
    }
    // Check forwards
    for (let d = date + 1; d <= totalDays; d++) {
      if (empRoster[d]?.shift?.toUpperCase() === 'R') {
        count++;
      } else {
        break;
      }
    }

    if (count > RULES.maxConsecutiveOff) {
      return {
        valid: false,
        msg: `為避免人力短缺，每次最多僅可預約連續 ${RULES.maxConsecutiveOff} 天休假！`
      };
    }
  }

  return { valid: true };
}

// Get day name
export function getDayName(year: number, month: number, day: number): string {
  const dateObj = new Date(year, month - 1, day);
  const dayIndex = dateObj.getDay();
  const dayStrs = ['日', '一', '二', '三', '四', '五', '六'];
  return dayStrs[dayIndex];
}

// Is Weekend helper
export function isWeekend(year: number, month: number, day: number): boolean {
  const dateObj = new Date(year, month - 1, day);
  const dayIndex = dateObj.getDay();
  return dayIndex === 0 || dayIndex === 6;
}
