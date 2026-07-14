import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  onSnapshot, 
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { SystemConfig, EmployeeShifts, RosterData } from './types';
import { EMPLOYEES } from './constants';

const CONFIG_PATH = 'config';
const ADMIN_DOC_ID = 'admin';

// 1. Get Admin Password and Config State
export async function getAdminConfig(): Promise<SystemConfig | null> {
  const path = `${CONFIG_PATH}/${ADMIN_DOC_ID}`;
  try {
    const docRef = doc(db, CONFIG_PATH, ADMIN_DOC_ID);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as SystemConfig;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

// 2. Set Admin Config / Password
export async function setAdminConfig(config: SystemConfig): Promise<void> {
  const path = `${CONFIG_PATH}/${ADMIN_DOC_ID}`;
  try {
    const docRef = doc(db, CONFIG_PATH, ADMIN_DOC_ID);
    await setDoc(docRef, config);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// 3. Listen to Roster shifts in real-time
export function subscribeToRoster(
  rosterId: string,
  onUpdate: (data: RosterData) => void,
  onError: (error: Error) => void
) {
  const colPath = `rosters/${rosterId}/shifts`;
  const shiftsColRef = collection(db, 'rosters', rosterId, 'shifts');

  return onSnapshot(
    shiftsColRef,
    (snapshot) => {
      const rosterData: RosterData = {};
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data && data.shifts) {
          rosterData[doc.id] = data.shifts as EmployeeShifts;
        }
      });
      onUpdate(rosterData);
    },
    (error) => {
      console.error("Firestore onSnapshot error:", error);
      handleFirestoreError(error, OperationType.LIST, colPath);
      onError(error instanceof Error ? error : new Error(String(error)));
    }
  );
}

// 4. Save/Update individual employee shifts
export async function saveEmployeeShifts(
  rosterId: string,
  employeeId: string,
  employeeName: string,
  level: 'senior' | 'junior',
  shifts: EmployeeShifts
): Promise<void> {
  const docPath = `rosters/${rosterId}/shifts/${employeeId}`;
  try {
    const docRef = doc(db, 'rosters', rosterId, 'shifts', employeeId);
    await setDoc(docRef, {
      employeeId,
      employeeName,
      level,
      shifts
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

// 5. Seed default/mock data if database is empty for this roster
export async function seedRosterMockData(rosterId: string): Promise<void> {
  try {
    const batch = writeBatch(db);
    
    EMPLOYEES.forEach((emp) => {
      const docRef = doc(db, 'rosters', rosterId, 'shifts', emp.id);
      const shifts: EmployeeShifts = {};
      
      // Let's generate some realistic default shifts
      for (let d = 1; d <= 31; d++) {
        const rnd = Math.random();
        if (rnd < 0.22) {
          shifts[d] = { shift: 'D', priority: null };
        } else if (rnd < 0.28) {
          shifts[d] = { shift: 'R', priority: null };
        } else if (rnd < 0.32) {
          shifts[d] = { shift: 'E', priority: null };
        }
      }

      // Add special priority blocks to mimic the prototype image
      if (emp.id === '801936') { // 賴秀苗
        shifts[1] = { shift: 'D', priority: null };
        shifts[2] = { shift: 'D', priority: null };
        shifts[3] = { shift: 'D', priority: null };
        shifts[4] = { shift: 'R', priority: 'green' };
        shifts[5] = { shift: 'R', priority: null };
      } else if (emp.id === '802031') { // 張妤涓
        shifts[1] = { shift: '控', priority: null };
        shifts[2] = { shift: '控', priority: null };
        shifts[3] = { shift: '控', priority: null };
        shifts[4] = { shift: 'R', priority: null };
        shifts[5] = { shift: 'R', priority: 'red' };
      }

      batch.set(docRef, {
        employeeId: emp.id,
        employeeName: emp.name,
        level: emp.level,
        shifts
      });
    });

    await batch.commit();
    console.log(`Successfully seeded mock data for roster: ${rosterId}`);
  } catch (error) {
    console.error("Error seeding mock data:", error);
    handleFirestoreError(error, OperationType.WRITE, `rosters/${rosterId}/shifts`);
  }
}

// 6. Clear all shifts for a roster
export async function clearRoster(rosterId: string): Promise<void> {
  try {
    const batch = writeBatch(db);
    EMPLOYEES.forEach((emp) => {
      const docRef = doc(db, 'rosters', rosterId, 'shifts', emp.id);
      batch.set(docRef, {
        employeeId: emp.id,
        employeeName: emp.name,
        level: emp.level,
        shifts: {}
      });
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `rosters/${rosterId}/shifts`);
  }
}
