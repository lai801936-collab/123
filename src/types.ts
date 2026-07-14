export interface Employee {
  id: string;
  name: string;
  level: 'senior' | 'junior';
}

export interface ShiftDetail {
  shift: string;
  priority: 'red' | 'green' | null;
}

export interface EmployeeShifts {
  [day: number]: ShiftDetail;
}

export interface RosterData {
  [employeeId: string]: EmployeeShifts;
}

export interface SystemConfig {
  isConfigured: boolean;
  password?: string;
}

export interface ValidationResult {
  valid: boolean;
  msg?: string;
}
