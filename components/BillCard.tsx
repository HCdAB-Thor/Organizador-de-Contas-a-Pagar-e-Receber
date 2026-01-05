
import React from 'react';
import { format, parseISO, isPast, isToday, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle2, Circle, AlertCircle, Clock, Repeat, Bell, CalendarDays } from 'lucide-react';
import { Bill, RecurrenceType } from '../types';
import { CATEGORY_ICONS, CATEGORY_COLORS } from '../constants';

interface BillCardProps {
  bill: Bill;
  onTogglePaid: (id: string) => void;
  onClick: (bill: Bill) => void;
}

export const BillCard: React.FC<BillCardProps> = ({ bill, onTogglePaid, onClick }) => {
  // Parsing robusto para evitar shifts de fuso horário
  const dateStr = bill.dueDate.split('T')[0];
  const date = parseISO(dateStr + 'T12:00:00'); 
  
  const notificationDate = subDays(date, bill.reminderDays || 0);
  const isOverdue = isPast(date) && !isToday(date) && !bill.isPaid;
  const isDueToday = isToday(date) && !bill.isPaid;
  const isRecurring = bill.recurrence && bill.recurrence !== RecurrenceType.NONE;
  const isPayable = bill.type === 'PAYABLE';

  return (
    <div 
      className={`bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between transition-all active:scale-[0.98] ${bill.isPaid ? 'opacity-60' : ''}`}
      onClick={() => onClick(bill)}
    >
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl ${CATEGORY_COLORS[bill.category]}`}>
          {CATEGORY_ICONS[bill.category]}
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className={`font-semibold text-slate-800 text-sm ${bill.isPaid ? 'line-through' : ''}`}>
              {bill.title}
            </h3>
            {isRecurring && <Repeat className="w-3 h-3 text-slate-400" />}
          </div>
          
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-medium">
              <CalendarDays className="w-3 h-3 text-slate-400" />
              <span>Vencimento: {format(date, "dd/MM/yyyy", { locale: ptBR })}</span>
              {isOverdue && (
                <span className="flex items-center gap-1 text-red-500 ml-1">
                  <AlertCircle className="w-3 h-3" />
                  Atrasada
                </span>
              )}
              {isDueToday && (
                <span className="text-amber-500 font-bold ml-1">
                  HOJE
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 italic">
              <Bell className="w-2.5 h-2.5" />
              <span>Notificação: {format(notificationDate, "dd/MM/yyyy", { locale: ptBR })}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className={`font-bold text-sm ${isPayable ? 'text-rose-600' : 'text-emerald-600'}`}>
            {isPayable ? '-' : '+'} R$ {bill.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onTogglePaid(bill.id);
          }}
          className="p-1"
        >
          {bill.isPaid ? (
            <CheckCircle2 className={`w-7 h-7 ${isPayable ? 'text-rose-500 fill-rose-50' : 'text-emerald-500 fill-emerald-50'}`} />
          ) : (
            <Circle className="w-7 h-7 text-slate-300" />
          )}
        </button>
      </div>
    </div>
  );
};
