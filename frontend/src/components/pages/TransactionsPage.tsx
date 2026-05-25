import { useState, useMemo } from 'react';
import { useAppStore } from '@/store';
import type { Transaction } from '@/store/types';
import { TransactionDetailsModal } from '@/components/transactions/TransactionDetailsModal';
import { useToast } from '@/components/ui/use-toast';
import { transactionsApi } from '@/lib/api';
import { fmtMXN } from '../pika/atoms';
import { 
  Search, Download, ArrowUpRight, ArrowDownLeft, 
  ArrowLeftRight, FileText, Loader2, X, Filter
} from 'lucide-react';

function formatDate(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) return 'Hoy';
  if (days === 1) return 'Ayer';
  if (days < 7) return `Hace ${days} días`;
  
  return date.toLocaleDateString('es-MX', { month: 'short', day: 'numeric' });
}

function getStatusBadge(status: string) {
  const variants: Record<string, string> = {
    completed: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200/45 dark:border-emerald-500/20',
    pending: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200/45 dark:border-amber-500/20',
    failed: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-200/45 dark:border-rose-500/20'
  };
  return variants[status] || 'bg-muted text-muted-foreground';
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    completed: 'Exitoso',
    pending: 'Pendiente',
    failed: 'Fallido'
  };
  return labels[status] || status;
}

function getTypeIcon(type: string) {
  const icons: Record<string, React.ReactNode> = {
    incoming: <ArrowDownLeft className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />,
    outgoing: <ArrowUpRight className="h-4 w-4 text-rose-600 dark:text-rose-400" />,
    transfer: <ArrowLeftRight className="h-4 w-4 text-blue-600 dark:text-blue-400" />,
    payment: <FileText className="h-4 w-4 text-primary" />
  };
  return icons[type] || <FileText className="h-4 w-4" />;
}

function getTypeColor(type: string) {
  const colors: Record<string, string> = {
    incoming: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
    outgoing: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400',
    transfer: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
    payment: 'bg-primary/10 text-primary'
  };
  return colors[type] || 'bg-muted text-muted-foreground';
}

export default function TransactionsPage() {
  const { transactions } = useAppStore();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ start?: string; end?: string }>({});
  const [isExporting, setIsExporting] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch = !searchQuery || 
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.from?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.to?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
      
      const matchesDate = (!dateRange.start || new Date(t.date) >= new Date(dateRange.start)) &&
                         (!dateRange.end || new Date(t.date) <= new Date(dateRange.end));
      
      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [transactions, searchQuery, statusFilter, dateRange]);

  const groupedTransactions = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    
    filteredTransactions.forEach(t => {
      const date = new Date(t.date);
      const key = date.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
      const capitalizedKey = key.charAt(0).toUpperCase() + key.slice(1);
      if (!groups[capitalizedKey]) groups[capitalizedKey] = [];
      groups[capitalizedKey].push(t);
    });
    
    return groups;
  }, [filteredTransactions]);

  const stats = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.type === 'incoming')
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses = filteredTransactions
      .filter(t => t.type === 'outgoing')
      .reduce((sum, t) => sum + t.amount, 0);
    return { income, expenses };
  }, [filteredTransactions]);

  const handleExport = async (format: 'csv' | 'pdf') => {
    setIsExporting(true);
    const result = await transactionsApi.export(format, dateRange);
    
    if (result.data) {
      const link = document.createElement('a');
      link.href = result.data.url;
      link.download = result.data.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({ title: `Transacciones exportadas como ${format.toUpperCase()}` });
    } else {
      toast({ title: result.error || 'Fallo al exportar transacciones', variant: 'destructive' });
    }
    setIsExporting(false);
  };

  const handleTransactionClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsDetailsOpen(true);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setDateRange({});
  };

  const hasFilters = searchQuery || statusFilter !== 'all' || dateRange.start || dateRange.end;

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto pb-12">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black font-display text-foreground tracking-tight">Transacciones</h1>
          <p className="text-muted-foreground font-semibold text-sm mt-1">
            Consulta el historial completo de tus cobros y retiros SPEI
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleExport('pdf')}
            disabled={isExporting}
            className="px-5 py-2.5 bg-background border border-border hover:bg-muted text-foreground font-bold rounded-full text-xs shadow-sm flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : <Download className="h-4 w-4 text-muted-foreground" />}
            Exportar PDF
          </button>
        </div>
      </div>

      {/* ── STATS BLOCK ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-3xl p-5 shadow-sm">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block mb-1">Ingresos</span>
          <span className="text-xl font-black font-display text-emerald-600 dark:text-emerald-400">+{fmtMXN(stats.income)}</span>
        </div>
        <div className="bg-card border border-border rounded-3xl p-5 shadow-sm">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block mb-1">Egresos</span>
          <span className="text-xl font-black font-display text-foreground/80">-{fmtMXN(stats.expenses)}</span>
        </div>
        <div className="bg-card border border-border rounded-3xl p-5 shadow-sm">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block mb-1">Monto Neto</span>
          <span className={`text-xl font-black font-display ${stats.income - stats.expenses >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {fmtMXN(stats.income - stats.expenses)}
          </span>
        </div>
      </div>

      {/* ── FILTERS PANEL ── */}
      <div className="bg-card border border-border rounded-3xl p-4 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            placeholder="Buscar por concepto o destinatario..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-muted/40 hover:bg-muted/60 border border-border rounded-full text-xs font-semibold outline-none transition-all placeholder:text-muted-foreground text-foreground"
          />
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex items-center">
            <Filter className="absolute left-3 h-3.5 w-3.5 text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-8 pr-4 py-2.5 bg-muted/40 hover:bg-muted/60 border border-border rounded-full text-xs font-bold outline-none cursor-pointer transition-all appearance-none text-foreground"
            >
              <option value="all">Todos los estados</option>
              <option value="completed">Exitosos</option>
              <option value="pending">Pendientes</option>
              <option value="failed">Fallidos</option>
            </select>
          </div>
          <input
            type="date"
            value={dateRange.start || ''}
            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            className="px-4 py-2 bg-muted/40 hover:bg-muted/60 border border-border rounded-full text-xs font-bold outline-none cursor-pointer text-foreground"
          />
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="w-8 h-8 rounded-full border border-border bg-muted hover:bg-muted/80 flex items-center justify-center text-muted-foreground transition-all active:scale-90"
              title="Limpiar filtros"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── LIST PANEL ── */}
      <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-sm">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground flex flex-col items-center">
            <FileText className="w-12 h-12 text-muted-foreground/60 mb-3" />
            <h4 className="text-sm font-extrabold text-foreground">No encontramos transacciones</h4>
            <p className="text-xs text-muted-foreground max-w-xs mt-1">
              {hasFilters ? 'Prueba ajustando los filtros de búsqueda o fechas.' : 'Tus cobros completados aparecerán aquí.'}
            </p>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="mt-4 px-5 py-2.5 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-bold rounded-full text-xs transition-all active:scale-95"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedTransactions).map(([month, txs]) => (
              <div key={month} className="space-y-3">
                <h3 className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider px-1">
                  {month}
                </h3>
                <div className="divide-y divide-border/60 bg-muted/5 border border-border rounded-2xl overflow-hidden">
                  {txs.map((transaction) => (
                    <div
                      key={transaction.id}
                      onClick={() => handleTransactionClick(transaction)}
                      className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${getTypeColor(transaction.type)}`}>
                          {getTypeIcon(transaction.type)}
                        </div>
                        <div>
                          <p className="font-extrabold text-sm text-foreground group-hover:text-primary transition-colors">
                            {transaction.description}
                          </p>
                          <p className="text-xs text-muted-foreground font-semibold mt-0.5">
                            {transaction.from || transaction.to} • {formatDate(transaction.date)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <div className="space-y-1">
                          <p className={`font-black font-display text-sm ${transaction.type === 'incoming' ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'}`}>
                            {transaction.type === 'incoming' ? '+' : '-'}
                            {fmtMXN(transaction.amount)}
                          </p>
                          <span className={`inline-block text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${getStatusBadge(transaction.status)}`}>
                            {getStatusLabel(transaction.status)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <TransactionDetailsModal
        transaction={selectedTransaction}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
      />
    </div>
  );
}
