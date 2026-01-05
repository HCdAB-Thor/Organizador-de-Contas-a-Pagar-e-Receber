
import React from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  parseISO, 
  startOfWeek, 
  endOfWeek,
  isSameMonth,
  addMonths,
  subMonths
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Bill, ViewType } from '../types';
import { BillCard } from './BillCard';

interface ViewProps {
  bills: Bill[];
  onTogglePaid: (id: string) => void;
  onEditBill: (bill: Bill) => void;
  viewDate?: Date;
  setViewDate?: (date: Date) => void;
}

const safeParseDate = (isoStr: string) => parseISO(isoStr.split('T')[0] + 'T12:00:00');

export const ListView: React.FC<ViewProps> = ({ bills, onTogglePaid, onEditBill }) => {
  const sortedBills = [...bills].sort((a, b) => safeParseDate(a.dueDate).getTime() - safeParseDate(b.dueDate).getTime());
  
  if (bills.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <p className="text-lg">Nenhum registro encontrado</p>
        <p className="text-sm">Tente ajustar o filtro de período ou navegue entre os meses</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-24">
      {sortedBills.map(bill => (
        <BillCard key={bill.id} bill={bill} onTogglePaid={onTogglePaid} onClick={onEditBill} />
      ))}
    </div>
  );
};

export const MonthlyView: React.FC<ViewProps> = ({ bills, onTogglePaid, onEditBill, viewDate = new Date(), setViewDate }) => {
  const today = new Date();
  const start = startOfMonth(viewDate);
  const end = endOfMonth(viewDate);
  const days = eachDayOfInterval({ start, end });

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800 capitalize">{format(viewDate, 'MMMM yyyy', { locale: ptBR })}</h2>
        {setViewDate && (
          <div className="flex gap-1">
            <button onClick={() => setViewDate(subMonths(viewDate, 1))} className="p-1.5 bg-white border border-slate-100 rounded-lg text-slate-400">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setViewDate(addMonths(viewDate, 1))} className="p-1.5 bg-white border border-slate-100 rounded-lg text-slate-400">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-7 gap-2 mb-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-50">
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
          <div key={i} className="text-center text-xs font-bold text-slate-400 mb-2">{d}</div>
        ))}
        {days.map(day => {
          const dayBills = bills.filter(b => isSameDay(safeParseDate(b.dueDate), day));
          const hasPayable = dayBills.some(b => b.type === 'PAYABLE');
          const hasReceivable = dayBills.some(b => b.type === 'RECEIVABLE');
          const isTodayDay = isSameDay(day, today);

          return (
            <div key={day.toString()} className="aspect-square relative flex items-center justify-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-all ${isTodayDay ? 'bg-indigo-600 text-white font-bold shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}>
                {format(day, 'd')}
              </div>
              <div className="absolute bottom-0 flex gap-0.5">
                {hasPayable && <div className="w-1 h-1 rounded-full bg-rose-500" />}
                {hasReceivable && <div className="w-1 h-1 rounded-full bg-emerald-500" />}
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="space-y-3">
        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">Vencimentos do Mês</h3>
        {bills
          .filter(b => isSameMonth(safeParseDate(b.dueDate), viewDate))
          .sort((a, b) => safeParseDate(a.dueDate).getTime() - safeParseDate(b.dueDate).getTime())
          .map(bill => (
            <BillCard key={bill.id} bill={bill} onTogglePaid={onTogglePaid} onClick={onEditBill} />
          ))}
      </div>
    </div>
  );
};

export const WeeklyView: React.FC<ViewProps> = ({ bills, onTogglePaid, onEditBill, viewDate = new Date() }) => {
  const today = new Date();
  const start = startOfWeek(viewDate, { weekStartsOn: 0 });
  const end = endOfWeek(viewDate, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start, end });

  return (
    <div className="space-y-6 pb-24">
       <div className="flex items-center gap-2 mb-2">
        <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
        <h2 className="text-lg font-bold text-slate-800">Esta Semana</h2>
      </div>

      <div className="space-y-8">
        {days.map(day => {
          const dayBills = bills.filter(b => isSameDay(safeParseDate(b.dueDate), day));
          return (
            <div key={day.toString()} className="space-y-3">
              <div className="flex items-center gap-2">
                 <div className={`px-3 py-1 rounded-lg text-[10px] font-bold tracking-wider ${isSameDay(day, today) ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-200 text-slate-600'}`}>
                  {format(day, 'EEEE, dd', { locale: ptBR }).toUpperCase()}
                 </div>
                 <div className="h-px bg-slate-100 flex-1" />
              </div>
              {dayBills.length > 0 ? (
                <div className="space-y-2">
                  {dayBills.map(bill => (
                    <BillCard key={bill.id} bill={bill} onTogglePaid={onTogglePaid} onClick={onEditBill} />
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-slate-400 italic px-2">Nenhum vencimento para este dia</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
