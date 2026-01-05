
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LayoutDashboard, 
  CalendarDays, 
  CalendarRange, 
  Settings as SettingsIcon, 
  Plus,
  Bell,
  Wallet,
  Filter,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ArrowDownLeft,
  ArrowUpRight,
  Info,
  Smartphone,
  ExternalLink
} from 'lucide-react';
import { 
  addDays, 
  addWeeks, 
  addMonths, 
  addYears, 
  isSameDay, 
  getDay, 
  parseISO,
  isAfter,
  startOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  isWithinInterval,
  isToday,
  setMonth,
  getMonth,
  format
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Bill, ViewType, AppSettings, Category, RecurrenceType, SummaryPeriod, BillType } from './types';
import { storage } from './services/storage';
import { getBillInsights } from './services/gemini';
import { BillForm } from './components/BillForm';
import { ListView, MonthlyView, WeeklyView } from './components/Views';

const App: React.FC = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [settings, setSettings] = useState<AppSettings>(storage.getSettings());
  const [currentView, setCurrentView] = useState<ViewType>('list');
  const [summaryPeriod, setSummaryPeriod] = useState<SummaryPeriod>('month');
  const [activeType, setActiveType] = useState<BillType>('PAYABLE');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | undefined>(undefined);
  const [insights, setInsights] = useState<string>("Carregando dicas financeiras...");
  const [isInsightExpanded, setIsInsightExpanded] = useState(false);
  
  const [viewDate, setViewDate] = useState(new Date());
  
  const insightRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    setBills(storage.getBills());
  }, []);

  useEffect(() => {
    storage.saveBills(bills);
    updateInsights();
  }, [bills]);

  useEffect(() => {
    storage.saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (insightRef.current && !insightRef.current.contains(event.target as Node)) {
        setIsInsightExpanded(false);
      }
    };
    if (isInsightExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isInsightExpanded]);

  const updateInsights = async () => {
    const text = await getBillInsights(bills);
    setInsights(text);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    if (Math.abs(diff) > 50) {
      toggleActiveType();
    }
    touchStartX.current = null;
  };

  const toggleActiveType = () => {
    setActiveType(prev => prev === 'PAYABLE' ? 'RECEIVABLE' : 'PAYABLE');
  };

  const generateRecurrences = (baseBill: Bill): Bill[] => {
    if (!baseBill.recurrence || baseBill.recurrence === RecurrenceType.NONE) {
      return [baseBill];
    }
    const instances: Bill[] = [];
    const startDate = parseISO(baseBill.dueDate);
    const horizonDate = baseBill.recurrenceEndDate 
      ? parseISO(baseBill.recurrenceEndDate) 
      : addMonths(startDate, 12);
    let currentDate = startDate;
    const parentId = baseBill.id;
    instances.push(baseBill);
    const createInstance = (date: Date) => ({
      ...baseBill,
      id: Math.random().toString(36).substr(2, 9),
      dueDate: date.toISOString(),
      parentId: parentId,
      isPaid: false
    });
    switch (baseBill.recurrence) {
      case RecurrenceType.DAILY:
        currentDate = addDays(currentDate, 1);
        while (currentDate <= horizonDate) {
          instances.push(createInstance(currentDate));
          currentDate = addDays(currentDate, 1);
        }
        break;
      case RecurrenceType.WEEKLY:
        currentDate = addWeeks(currentDate, 1);
        while (currentDate <= horizonDate) {
          instances.push(createInstance(currentDate));
          currentDate = addWeeks(currentDate, 1);
        }
        break;
      case RecurrenceType.MONTHLY:
        currentDate = addMonths(currentDate, 1);
        while (currentDate <= horizonDate) {
          instances.push(createInstance(currentDate));
          currentDate = addMonths(currentDate, 1);
        }
        break;
      case RecurrenceType.ANNUALLY:
        currentDate = addYears(currentDate, 1);
        while (currentDate <= horizonDate) {
          instances.push(createInstance(currentDate));
          currentDate = addYears(currentDate, 1);
        }
        break;
      case RecurrenceType.SPECIFIC_DAYS:
        if (baseBill.recurrenceDays && baseBill.recurrenceDays.length > 0) {
          currentDate = addDays(currentDate, 1);
          while (currentDate <= horizonDate) {
            if (baseBill.recurrenceDays.includes(getDay(currentDate))) {
              instances.push(createInstance(currentDate));
            }
            currentDate = addDays(currentDate, 1);
          }
        }
        break;
    }
    return instances;
  };

  const handleSaveBill = (billData: Partial<Bill>) => {
    if (editingBill) {
      setBills(prev => prev.map(b => b.id === editingBill.id ? { ...b, ...billData } as Bill : b));
    } else {
      const newBill: Bill = {
        id: Math.random().toString(36).substr(2, 9),
        title: billData.title || '',
        amount: billData.amount || 0,
        dueDate: billData.dueDate || new Date().toISOString(),
        category: billData.category || Category.OTHER,
        type: billData.type || activeType,
        isPaid: false,
        reminderDays: billData.reminderDays ?? settings.defaultReminderDays,
        notes: billData.notes,
        recurrence: billData.recurrence,
        recurrenceDays: billData.recurrenceDays,
        recurrenceEndDate: billData.recurrenceEndDate
      };
      const allInstances = generateRecurrences(newBill);
      setBills(prev => [...prev, ...allInstances]);
    }
    setIsFormOpen(false);
    setEditingBill(undefined);
  };

  const handleDeleteBill = (id: string) => {
    const billToDelete = bills.find(b => b.id === id);
    if (billToDelete?.parentId || (billToDelete?.recurrence && billToDelete?.recurrence !== RecurrenceType.NONE)) {
      if (confirm('Deseja excluir apenas este registro ou toda a série recorrente?')) {
        const pId = billToDelete.parentId || billToDelete.id;
        setBills(prev => prev.filter(b => b.id !== pId && b.parentId !== pId));
      } else {
        setBills(prev => prev.filter(b => b.id !== id));
      }
    } else {
      setBills(prev => prev.filter(b => b.id !== id));
    }
    setIsFormOpen(false);
    setEditingBill(undefined);
  };

  const handleTogglePaid = (id: string) => {
    setBills(prev => prev.map(b => b.id === id ? { ...b, isPaid: !b.isPaid } : b));
  };

  const openEdit = (bill: Bill) => {
    setEditingBill(bill);
    setIsFormOpen(true);
  };

  const filteredBillsByType = useMemo(() => bills.filter(b => b.type === activeType), [bills, activeType]);

  const filteredBills = useMemo(() => {
    const now = new Date();
    switch (summaryPeriod) {
      case 'today':
        return filteredBillsByType.filter(b => isToday(parseISO(b.dueDate)));
      case 'week':
        return filteredBillsByType.filter(b => isWithinInterval(parseISO(b.dueDate), { 
          start: startOfWeek(now, { weekStartsOn: 0 }), 
          end: endOfWeek(now, { weekStartsOn: 0 }) 
        }));
      case 'month':
        return filteredBillsByType.filter(b => isWithinInterval(parseISO(b.dueDate), { 
          start: startOfMonth(now), 
          end: endOfMonth(now) 
        }));
      case 'year':
        return filteredBillsByType.filter(b => isWithinInterval(parseISO(b.dueDate), { 
          start: startOfMonth(viewDate), 
          end: endOfMonth(viewDate) 
        }));
      case 'all':
      default:
        return filteredBillsByType;
    }
  }, [filteredBillsByType, summaryPeriod, viewDate]);

  const unpaidInPeriod = useMemo(() => filteredBills.filter(b => !b.isPaid), [filteredBills]);
  const totalInPeriod = useMemo(() => 
    unpaidInPeriod.reduce((acc, curr) => acc + curr.amount, 0),
  [unpaidInPeriod]);

  const unpaidCountInPeriod = useMemo(() => unpaidInPeriod.length, [unpaidInPeriod]);
  const totalUnpaidCount = useMemo(() => bills.filter(b => !b.isPaid).length, [bills]);

  const isPayableActive = activeType === 'PAYABLE';
  const themeClass = isPayableActive ? 'bg-rose-600' : 'bg-emerald-600';
  const shadowClass = isPayableActive ? 'shadow-rose-100' : 'shadow-emerald-100';
  const accentTextClass = isPayableActive ? 'text-rose-600' : 'text-emerald-600';
  const bgAccentClass = isPayableActive ? 'bg-rose-100' : 'bg-emerald-100';

  const periodLabels: Record<SummaryPeriod, string> = {
    all: 'no Geral',
    today: 'hoje',
    week: 'nesta semana',
    month: 'este mês',
    year: 'em ' + format(viewDate, 'MMMM', { locale: ptBR })
  };

  const pendingMessage = useMemo(() => {
    const count = unpaidCountInPeriod;
    const period = periodLabels[summaryPeriod];
    const typeLabel = isPayableActive ? 'contas a pagar' : 'contas a receber';
    const singularTypeLabel = isPayableActive ? 'conta a pagar' : 'conta a receber';
    if (count === 0) return `Nenhuma ${singularTypeLabel} ${period}`;
    if (count === 1) return `Você tem 1 ${singularTypeLabel} ${period}`;
    return `Você tem ${count} ${typeLabel} ${period}`;
  }, [unpaidCountInPeriod, summaryPeriod, isPayableActive, viewDate]);

  const monthsOfYear = Array.from({ length: 12 }, (_, i) => setMonth(new Date(), i));

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-50 flex flex-col relative pb-20">
      <header className="px-6 pt-8 pb-4 sticky top-0 bg-slate-50/80 backdrop-blur-md z-30">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Olá, {settings.userName}!</h1>
            <p className="text-slate-500 text-sm transition-all duration-300">{pendingMessage}</p>
          </div>
          <button className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 relative">
            <Bell className="w-6 h-6 text-slate-600" />
            {totalUnpaidCount > 0 && <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />}
          </button>
        </div>

        <div 
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className={`${themeClass} rounded-3xl p-6 text-white shadow-xl ${shadowClass} transition-all duration-500 relative overflow-hidden mb-4`}
        >
          <button onClick={toggleActiveType} className="absolute left-1 top-1/2 -translate-y-1/2 p-2 bg-white/10 rounded-full active:scale-90 transition-all z-10"><ChevronLeft className="w-5 h-5 opacity-70" /></button>
          <button onClick={toggleActiveType} className="absolute right-1 top-1/2 -translate-y-1/2 p-2 bg-white/10 rounded-full active:scale-90 transition-all z-10"><ChevronRight className="w-5 h-5 opacity-70" /></button>

          <div className="flex justify-between items-start mb-4 px-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white/20 rounded-md">
                   {isPayableActive ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                   <p className="text-[10px] font-bold uppercase tracking-wider">{isPayableActive ? 'A Pagar' : 'A Receber'} {periodLabels[summaryPeriod]}</p>
                </div>
                <div className="relative">
                   <select value={summaryPeriod} onChange={(e) => setSummaryPeriod(e.target.value as SummaryPeriod)} className="absolute inset-0 opacity-0 cursor-pointer">
                     <option value="all">Tudo</option><option value="today">Hoje</option><option value="week">Semana</option><option value="month">Mês</option><option value="year">Ano (Meses)</option>
                   </select>
                   <Filter className="w-3 h-3 text-white/50" />
                </div>
              </div>
              <h2 className="text-3xl font-bold animate-in fade-in slide-in-from-left-4 duration-300">R$ {totalInPeriod.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
            </div>
            <div className="bg-white/20 p-2 rounded-xl"><Wallet className="w-6 h-6" /></div>
          </div>
          
          <div ref={insightRef} onClick={() => setIsInsightExpanded(!isInsightExpanded)} className={`cursor-pointer transition-all duration-300 ease-in-out bg-white/10 p-3 rounded-2xl text-xs overflow-hidden mx-4 ${isInsightExpanded ? 'ring-2 ring-white/30 bg-white/20' : ''}`}>
             <div className="flex items-center justify-between gap-2 mb-1">
               <span className="font-bold whitespace-nowrap opacity-80">DICA AI:</span>
               {isInsightExpanded ? <ChevronUp className="w-3 h-3 opacity-60" /> : <ChevronDown className="w-3 h-3 opacity-60" />}
             </div>
             <p className={`italic transition-all duration-300 ${isInsightExpanded ? 'line-clamp-none mt-1 leading-relaxed opacity-100' : 'line-clamp-1 opacity-80'}`}>{insights}</p>
          </div>
        </div>

        {summaryPeriod === 'year' && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3 animate-in fade-in slide-in-from-top-2 duration-300">
            {monthsOfYear.map((m, idx) => {
              const isActive = getMonth(viewDate) === idx;
              return (
                <button key={idx} onClick={() => setViewDate(setMonth(viewDate, idx))} className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold border transition-all ${isActive ? (isPayableActive ? 'bg-rose-600 text-white border-rose-600 shadow-md' : 'bg-emerald-600 text-white border-emerald-600 shadow-md') : 'bg-white text-slate-500 border-slate-100 shadow-sm'}`}>
                  {format(m, 'MMM', { locale: ptBR }).toUpperCase()}
                </button>
              );
            })}
          </div>
        )}

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {Object.entries(periodLabels).map(([key, label]) => (
            <button key={key} onClick={() => { setSummaryPeriod(key as SummaryPeriod); if (key !== 'year') setViewDate(new Date()); }} className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${summaryPeriod === key ? (isPayableActive ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700') : 'bg-white text-slate-400 border border-slate-100'}`}>
              {key === 'all' ? 'GERAL' : key === 'year' ? 'Navegar Ano' : label.split(' ').pop()?.toUpperCase()}
            </button>
          ))}
        </div>
      </header>

      <main className="px-6 flex-1">
        {currentView === 'list' && <ListView bills={filteredBills} onTogglePaid={handleTogglePaid} onEditBill={openEdit} />}
        {currentView === 'monthly' && <MonthlyView bills={filteredBillsByType} onTogglePaid={handleTogglePaid} onEditBill={openEdit} viewDate={viewDate} setViewDate={setViewDate} />}
        {currentView === 'weekly' && <WeeklyView bills={filteredBillsByType} onTogglePaid={handleTogglePaid} onEditBill={openEdit} viewDate={viewDate} />}
        {currentView === 'settings' && (
          <div className="space-y-6 pb-24">
            <h2 className="text-xl font-bold text-slate-800">Configurações</h2>
            
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Seu Nome</label>
                <input type="text" className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400" value={settings.userName} onChange={(e) => setSettings({...settings, userName: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Notificação padrão</label>
                <select className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-400" value={settings.defaultReminderDays} onChange={(e) => setSettings({...settings, defaultReminderDays: Number(e.target.value)})}>
                  <option value={1}>1 dia antes</option><option value={2}>2 dias antes</option><option value={3}>3 dias antes</option>
                </select>
              </div>
            </div>

            {/* Nova Seção: Exportar APK */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-4">
               <div className="flex items-center gap-2 font-bold text-slate-800">
                  <Smartphone className="w-5 h-5 text-indigo-600" />
                  <span>Instalar no Android (APK)</span>
               </div>
               <p className="text-xs text-slate-500 leading-relaxed">
                  Para ter este app como um ícone no seu celular e funcionando 100% offline, você pode:
               </p>
               <ol className="text-xs text-slate-600 space-y-2 list-decimal pl-4">
                  <li>No Chrome, clique nos <strong>três pontinhos</strong> no canto superior direito.</li>
                  <li>Selecione <strong>"Instalar aplicativo"</strong> ou "Adicionar à tela inicial".</li>
                  <li>O app aparecerá na sua lista de aplicativos como um APK nativo.</li>
               </ol>
               <div className="pt-2">
                 <a 
                    href="https://www.pwabuilder.com" 
                    target="_blank" 
                    className="flex items-center justify-center gap-2 w-full py-3 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold border border-indigo-100"
                  >
                   Gerar APK Profissional <ExternalLink className="w-3 h-3" />
                 </a>
               </div>
            </div>

            <div className={`p-5 rounded-2xl ${bgAccentClass} border ${isPayableActive ? 'border-rose-100' : 'border-emerald-100'} space-y-2`}>
              <div className={`flex items-center gap-2 font-bold text-sm ${accentTextClass}`}><Info className="w-4 h-4" /><span>Sobre seus dados</span></div>
              <p className="text-xs text-slate-600 leading-relaxed">O sistema utiliza o armazenamento local do seu dispositivo para manter seus dados disponíveis offline e protegidos no próprio aparelho.</p>
            </div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/80 backdrop-blur-lg border-t border-slate-100 flex items-center justify-around py-3 px-6 z-40">
        <button onClick={() => setCurrentView('list')} className={`flex flex-col items-center gap-1 p-2 transition-all ${currentView === 'list' ? accentTextClass : 'text-slate-400'}`}><LayoutDashboard className="w-6 h-6" /><span className="text-[10px] font-medium">Contas</span></button>
        <button onClick={() => setCurrentView('weekly')} className={`flex flex-col items-center gap-1 p-2 transition-all ${currentView === 'weekly' ? accentTextClass : 'text-slate-400'}`}><CalendarRange className="w-6 h-6" /><span className="text-[10px] font-medium">Semanal</span></button>
        <button onClick={() => { setEditingBill(undefined); setIsFormOpen(true); }} className={`${themeClass} text-white w-14 h-14 rounded-full flex items-center justify-center -mt-12 shadow-xl border-4 border-slate-50 active:scale-90 transition-all`}><Plus className="w-8 h-8" /></button>
        <button onClick={() => setCurrentView('monthly')} className={`flex flex-col items-center gap-1 p-2 transition-all ${currentView === 'monthly' ? accentTextClass : 'text-slate-400'}`}><CalendarDays className="w-6 h-6" /><span className="text-[10px] font-medium">Mensal</span></button>
        <button onClick={() => setCurrentView('settings')} className={`flex flex-col items-center gap-1 p-2 transition-all ${currentView === 'settings' ? accentTextClass : 'text-slate-400'}`}><SettingsIcon className="w-6 h-6" /><span className="text-[10px] font-medium">Ajustes</span></button>
      </nav>

      {isFormOpen && <BillForm bill={editingBill} defaultType={activeType} onSave={handleSaveBill} onClose={() => setIsFormOpen(false)} onDelete={handleDeleteBill} />}
    </div>
  );
};

export default App;
