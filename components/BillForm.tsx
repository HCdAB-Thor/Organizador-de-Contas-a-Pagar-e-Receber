
import React, { useState } from 'react';
import { X, Calendar, CalendarClock, ArrowDownLeft, ArrowUpRight, Zap } from 'lucide-react';
import { endOfWeek, endOfMonth, endOfYear, format } from 'date-fns';
import { Bill, Category, RecurrenceType, BillType } from '../types';

interface BillFormProps {
  bill?: Bill;
  defaultType?: BillType;
  onSave: (bill: Partial<Bill>) => void;
  onClose: () => void;
  onDelete?: (id: string) => void;
}

const DAYS_OF_WEEK = [
  { label: 'D', value: 0 },
  { label: 'S', value: 1 },
  { label: 'T', value: 2 },
  { label: 'Q', value: 3 },
  { label: 'Q', value: 4 },
  { label: 'S', value: 5 },
  { label: 'S', value: 6 },
];

export const BillForm: React.FC<BillFormProps> = ({ bill, defaultType, onSave, onClose, onDelete }) => {
  const [type, setType] = useState<BillType>(bill?.type || defaultType || 'PAYABLE');
  const [title, setTitle] = useState(bill?.title || '');
  const [amount, setAmount] = useState(bill?.amount.toString() || '');
  const [dueDate, setDueDate] = useState(bill?.dueDate.split('T')[0] || new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<Category>(bill?.category || Category.OTHER);
  const [reminderDays, setReminderDays] = useState(bill?.reminderDays || 1);
  const [recurrence, setRecurrence] = useState<RecurrenceType>(bill?.recurrence || RecurrenceType.NONE);
  const [recurrenceDays, setRecurrenceDays] = useState<number[]>(bill?.recurrenceDays || []);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState(bill?.recurrenceEndDate ? bill.recurrenceEndDate.split('T')[0] : '');

  const isPayable = type === 'PAYABLE';
  const themeColorClass = isPayable ? 'rose' : 'emerald';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      type,
      title,
      amount: parseFloat(amount),
      dueDate: new Date(dueDate).toISOString(),
      category,
      reminderDays: Number(reminderDays),
      isPaid: bill?.isPaid || false,
      recurrence,
      recurrenceDays: recurrence === RecurrenceType.SPECIFIC_DAYS ? recurrenceDays : [],
      recurrenceEndDate: recurrence !== RecurrenceType.NONE && recurrenceEndDate ? new Date(recurrenceEndDate).toISOString() : undefined
    });
  };

  const toggleDay = (day: number) => {
    setRecurrenceDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const fillEndDate = (target: 'week' | 'month' | 'year') => {
    const now = new Date();
    let date: Date;
    switch (target) {
      case 'week': date = endOfWeek(now, { weekStartsOn: 0 }); break;
      case 'month': date = endOfMonth(now); break;
      case 'year': date = endOfYear(now); break;
    }
    setRecurrenceEndDate(format(date, 'yyyy-MM-dd'));
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 shadow-xl animate-in slide-in-from-bottom-10 duration-300 max-h-[90vh] overflow-y-auto no-scrollbar">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-800">
            {bill ? 'Editar Registro' : 'Novo Registro'}
          </h2>
          <button onClick={onClose} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Type Selector */}
        <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
          <button 
            type="button"
            onClick={() => {
              setType('PAYABLE');
              if (category === Category.INCOME) setCategory(Category.OTHER);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${isPayable ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'}`}
          >
            <ArrowDownLeft className="w-4 h-4" /> Contas a Pagar
          </button>
          <button 
            type="button"
            onClick={() => {
              setType('RECEIVABLE');
              setCategory(Category.INCOME);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${!isPayable ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}
          >
            <ArrowUpRight className="w-4 h-4" /> Contas a Receber
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Título</label>
            <input 
              required
              type="text" 
              className={`w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 ${isPayable ? 'focus:ring-rose-500' : 'focus:ring-emerald-500'}`}
              placeholder="Ex: Aluguel, Salário, Internet..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Valor (R$)</label>
              <input 
                required
                type="number" 
                step="0.01"
                className={`w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 ${isPayable ? 'focus:ring-rose-500' : 'focus:ring-emerald-500'}`}
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Vencimento</label>
              <input 
                required
                type="date" 
                className={`w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 ${isPayable ? 'focus:ring-rose-500' : 'focus:ring-emerald-500'}`}
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
              <select 
                className={`w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 ${isPayable ? 'focus:ring-rose-500' : 'focus:ring-emerald-500'} bg-white text-sm`}
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
              >
                {Object.values(Category).map(cat => {
                   if (!isPayable && (cat === Category.INCOME || cat === Category.INVESTMENT || cat === Category.OTHER)) {
                     return <option key={cat} value={cat}>{cat}</option>;
                   }
                   if (isPayable && cat !== Category.INCOME) {
                     return <option key={cat} value={cat}>{cat}</option>;
                   }
                   return null;
                })}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Notificação</label>
              <select 
                className={`w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 ${isPayable ? 'focus:ring-rose-500' : 'focus:ring-emerald-500'} bg-white text-sm`}
                value={reminderDays}
                onChange={(e) => setReminderDays(Number(e.target.value))}
              >
                <option value={0}>No dia</option>
                <option value={1}>1 dia antes</option>
                <option value={2}>2 dias antes</option>
                <option value={3}>3 dias antes</option>
                <option value={7}>1 semana antes</option>
              </select>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
            <div className={`flex items-center gap-2 font-semibold text-sm ${isPayable ? 'text-rose-600' : 'text-emerald-600'}`}>
              <Calendar className="w-4 h-4" />
              <span>Repetir Registro</span>
            </div>
            
            <select 
              className={`w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 ${isPayable ? 'focus:ring-rose-500' : 'focus:ring-emerald-500'}`}
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value as RecurrenceType)}
            >
              {Object.values(RecurrenceType).map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>

            {recurrence !== RecurrenceType.NONE && (
              <div className="pt-2 animate-in slide-in-from-top-2 duration-200 space-y-3">
                <label className="block text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
                  <CalendarClock className="w-3 h-3" />
                  Repetir até qual data? (Opcional)
                </label>
                
                <input 
                  type="date" 
                  className={`w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 ${isPayable ? 'focus:ring-rose-500' : 'focus:ring-emerald-500'}`}
                  value={recurrenceEndDate}
                  onChange={(e) => setRecurrenceEndDate(e.target.value)}
                />

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => fillEndDate('week')}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border ${isPayable ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}
                  >
                    <Zap className="w-3 h-3" /> Fim da Semana
                  </button>
                  <button
                    type="button"
                    onClick={() => fillEndDate('month')}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border ${isPayable ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}
                  >
                    <Zap className="w-3 h-3" /> Fim do Mês
                  </button>
                  <button
                    type="button"
                    onClick={() => fillEndDate('year')}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border ${isPayable ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}
                  >
                    <Zap className="w-3 h-3" /> Fim do Ano
                  </button>
                </div>
              </div>
            )}

            {recurrence === RecurrenceType.SPECIFIC_DAYS && (
              <div className="flex justify-between items-center gap-1 mt-2">
                {DAYS_OF_WEEK.map(day => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDay(day.value)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${recurrenceDays.includes(day.value) ? (isPayable ? 'bg-rose-600 text-white shadow-md' : 'bg-emerald-600 text-white shadow-md') : 'bg-white text-slate-400 border border-slate-200'}`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="pt-2 flex flex-col gap-3">
            <button 
              type="submit"
              className={`w-full text-white font-bold py-4 rounded-xl shadow-lg active:scale-[0.98] transition-all ${isPayable ? 'bg-rose-600 shadow-rose-200' : 'bg-emerald-600 shadow-emerald-200'}`}
            >
              {bill ? 'Salvar Alterações' : 'Salvar Registro'}
            </button>
            {bill && onDelete && (
              <button 
                type="button"
                onClick={() => onDelete(bill.id)}
                className="w-full bg-red-50 text-red-600 font-bold py-4 rounded-xl active:scale-[0.98] transition-all"
              >
                Excluir Registro
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
