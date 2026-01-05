
import { Bill, AppSettings } from '../types';

const BILLS_KEY = 'billsync_bills';
const SETTINGS_KEY = 'billsync_settings';

export const storage = {
  getBills: (): Bill[] => {
    const data = localStorage.getItem(BILLS_KEY);
    return data ? JSON.parse(data) : [];
  },
  saveBills: (bills: Bill[]) => {
    localStorage.setItem(BILLS_KEY, JSON.stringify(bills));
  },
  getSettings: (): AppSettings => {
    const data = localStorage.getItem(SETTINGS_KEY);
    return data ? JSON.parse(data) : {
      defaultReminderDays: 1,
      userName: 'Usuário',
      currency: 'R$'
    };
  },
  saveSettings: (settings: AppSettings) => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }
};
