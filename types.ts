
export type ViewType = 'list' | 'daily' | 'weekly' | 'monthly' | 'annual' | 'settings';
export type SummaryPeriod = 'all' | 'today' | 'week' | 'month' | 'year';
export type BillType = 'PAYABLE' | 'RECEIVABLE';

export enum Category {
  HOUSING = 'Moradia',
  EDUCATION = 'Educação',
  FOOD = 'Alimentação',
  TRANSPORT = 'Transporte',
  ENTERTAINMENT = 'Lazer',
  UTILITIES = 'Utilidades',
  HEALTH = 'Saúde',
  INCOME = 'Renda/Salário',
  INVESTMENT = 'Investimento',
  OTHER = 'Outros'
}

export enum RecurrenceType {
  NONE = 'Nenhuma',
  DAILY = 'Diário',
  WEEKLY = 'Semanal',
  MONTHLY = 'Mensal',
  ANNUALLY = 'Anual',
  SPECIFIC_DAYS = 'Dias da semana'
}

export interface Bill {
  id: string;
  title: string;
  amount: number;
  dueDate: string; // ISO string
  category: Category;
  type: BillType;
  isPaid: boolean;
  reminderDays: number;
  notes?: string;
  recurrence?: RecurrenceType;
  recurrenceDays?: number[];
  recurrenceEndDate?: string;
  parentId?: string;
}

export interface AppSettings {
  defaultReminderDays: number;
  userName: string;
  currency: string;
}
