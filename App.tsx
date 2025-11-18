import React, { useState, useEffect, useMemo } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line 
} from 'recharts';
import { 
  LayoutDashboard, Plus, Download, History, Wallet, Target, Sparkles, Trash2, TrendingUp, LogOut, User as UserIcon, Moon, Sun, Menu
} from 'lucide-react';
import { categorizeTransaction, getAIInsights } from './services/geminiService';
import { Button } from './components/Button';
import { Card } from './components/Card';
import { BudgetPlanner } from './components/BudgetPlanner';
import { AuthPage } from './components/AuthPage';
import { 
  Transaction, TransactionType, Category, Budget, BudgetPlanParsed, User 
} from './types';
import { 
  EXPENSE_CATEGORIES, INCOME_CATEGORIES, COLORS, INITIAL_TRANSACTIONS 
} from './constants';

// --- Helper Components ---

const StatCard = ({ title, value, trend, icon: Icon, colorClass }: any) => (
  <div className="bg-surface/80 backdrop-blur-sm border border-zinc-200 dark:border-white/5 rounded-2xl p-6 flex items-center justify-between relative overflow-hidden group transition-all hover:border-zinc-300 dark:hover:border-white/10 shadow-sm dark:shadow-none">
    <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity ${colorClass.replace('text-', 'bg-')}`}></div>
    <div>
      <p className="text-zinc-500 dark:text-zinc-500 text-sm font-medium mb-1">{title}</p>
      <h3 className="text-3xl font-bold text-zinc-900 dark:text-white font-mono tracking-tight">
        ${value.toLocaleString()}
      </h3>
      {trend && (
        <div className="flex items-center mt-2 text-xs text-green-500 dark:text-green-400">
          <TrendingUp className="h-3 w-3 mr-1" />
          <span>{trend}</span>
        </div>
      )}
    </div>
    <div className={`h-12 w-12 rounded-xl ${colorClass} bg-opacity-10 flex items-center justify-center border border-zinc-100 dark:border-white/5`}>
      <Icon className={`h-6 w-6 ${colorClass}`} />
    </div>
  </div>
);

// --- Main App ---

const App: React.FC = () => {
  // --- Theme State ---
  const [isDark, setIsDark] = useState(() => {
     if (typeof window !== 'undefined') {
       return window.matchMedia('(prefers-color-scheme: dark)').matches;
     }
     return true;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // --- User State ---
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('bb_user');
    return saved ? JSON.parse(saved) : null;
  });

  // --- App State ---
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('bb_transactions');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  const [budgets, setBudgets] = useState<Budget[]>(() => {
    const saved = localStorage.getItem('bb_budgets');
    return saved ? JSON.parse(saved) : EXPENSE_CATEGORIES.map(cat => ({
      category: cat,
      limit: 0,
      spent: 0
    }));
  });

  const [view, setView] = useState<'dashboard' | 'transactions' | 'budget'>('dashboard');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTx, setNewTx] = useState<Partial<Transaction>>({
    type: TransactionType.EXPENSE,
    amount: 0,
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [aiAdvice, setAiAdvice] = useState<string>("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  // --- Effects ---
  
  useEffect(() => {
    if (user) {
      localStorage.setItem('bb_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('bb_user');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('bb_transactions', JSON.stringify(transactions));
    updateBudgetSpending();
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('bb_budgets', JSON.stringify(budgets));
  }, [budgets]);

  // --- Logic ---

  const handleLogout = () => {
    setUser(null);
    setView('dashboard');
  };

  const updateBudgetSpending = () => {
    const currentMonth = new Date().getMonth();
    const spendingMap = new Map<string, number>();

    transactions.forEach(tx => {
      const txDate = new Date(tx.date);
      if (tx.type === TransactionType.EXPENSE && txDate.getMonth() === currentMonth) {
        const current = spendingMap.get(tx.category) || 0;
        spendingMap.set(tx.category, current + tx.amount);
      }
    });

    setBudgets(prev => prev.map(b => ({
      ...b,
      spent: spendingMap.get(b.category) || 0
    })));
  };

  const handleAddTransaction = async () => {
    if (!newTx.amount || !newTx.description) return;

    let category = newTx.category;
    if (!category) {
      // Auto-categorize if not selected
      category = await categorizeTransaction(newTx.description);
    }

    const transaction: Transaction = {
      id: Date.now().toString(),
      amount: parseFloat(newTx.amount.toString()),
      type: newTx.type as TransactionType,
      category: category || Category.OTHER,
      description: newTx.description,
      date: newTx.date || new Date().toISOString()
    };

    setTransactions(prev => [transaction, ...prev]);
    setShowAddModal(false);
    setNewTx({ type: TransactionType.EXPENSE, amount: 0, description: '', date: new Date().toISOString().split('T')[0] });
  };

  const handleApplyBudgetPlan = (plan: BudgetPlanParsed) => {
    const newBudgets = [...budgets];
    plan.budgets.forEach(pb => {
      const idx = newBudgets.findIndex(b => b.category.toLowerCase() === pb.category.toLowerCase());
      if (idx >= 0) {
        newBudgets[idx].limit = pb.limit;
      } else {
        const mappedCat = EXPENSE_CATEGORIES.find(c => c.toLowerCase() === pb.category.toLowerCase());
        if (mappedCat) {
           const existingIdx = newBudgets.findIndex(b => b.category === mappedCat);
           if (existingIdx >= 0) newBudgets[existingIdx].limit = pb.limit;
        }
      }
    });
    setBudgets(newBudgets);
    setAiAdvice(plan.advice);
  };

  const exportCSV = () => {
    const headers = ['ID', 'Date', 'Type', 'Category', 'Description', 'Amount'];
    const rows = transactions.map(t => [t.id, t.date, t.type, t.category, t.description, t.amount]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "budget_buddy_transactions.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const refreshAIInsights = async () => {
    setIsAiLoading(true);
    const advice = await getAIInsights(transactions, budgets);
    setAiAdvice(advice);
    setIsAiLoading(false);
  };

  // --- Computed Data ---
  const totalIncome = transactions
    .filter(t => t.type === TransactionType.INCOME)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const balance = totalIncome - totalExpense;

  const pieData = useMemo(() => {
    const data: { [key: string]: number } = {};
    transactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .forEach(t => {
        data[t.category] = (data[t.category] || 0) + t.amount;
      });
    return Object.keys(data).map(k => ({ name: k, value: data[k] }));
  }, [transactions]);

  const budgetProgressData = budgets
    .filter(b => b.limit > 0)
    .map(b => ({
      name: b.category,
      Limit: b.limit,
      Spent: b.spent
    }));

  // --- Auth Guard ---
  if (!user) {
    return <AuthPage onLogin={setUser} />;
  }

  // --- Render ---

  return (
    <div className="flex h-screen bg-background text-zinc-900 dark:text-zinc-100 font-sans overflow-hidden transition-colors duration-300">
      
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-zinc-200 dark:border-white/5 bg-surface/50 dark:bg-black/80 backdrop-blur-xl relative z-50">
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-zinc-200 dark:border-white/5">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-lg shadow-lg shadow-blue-900/20">
            <Wallet className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight text-zinc-900 dark:text-white">BudgetBuddy</span>
        </div>

        {/* Navigation */}
        <div className="flex-1 py-6 px-3 space-y-1">
          <button 
            onClick={() => setView('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              view === 'dashboard' 
                ? 'bg-zinc-100 dark:bg-white/10 text-blue-600 dark:text-blue-400 shadow-sm' 
                : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <LayoutDashboard size={18} />
            Dashboard
          </button>
          <button 
             onClick={() => setView('transactions')}
             className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              view === 'transactions' 
                ? 'bg-zinc-100 dark:bg-white/10 text-blue-600 dark:text-blue-400 shadow-sm' 
                : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <History size={18} />
            Transactions
          </button>
          <button 
             onClick={() => setView('budget')}
             className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              view === 'budget' 
                ? 'bg-zinc-100 dark:bg-white/10 text-blue-600 dark:text-blue-400 shadow-sm' 
                : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Target size={18} />
            Budget Planning
          </button>
        </div>

        {/* Add Button in Sidebar */}
        <div className="px-4 mb-6">
          <button 
            onClick={() => setShowAddModal(true)}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus size={18} />
            Record Entry
          </button>
        </div>

        {/* Bottom Section: Theme + User */}
        <div className="p-4 border-t border-zinc-200 dark:border-white/5 bg-zinc-50/50 dark:bg-black/20">
          <div className="flex justify-between items-center mb-4 px-1">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Appearance</span>
            <button 
              onClick={() => setIsDark(!isDark)}
              className="p-2 rounded-lg bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
          
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-black border border-zinc-200 dark:border-white/10 shadow-sm">
            <img 
               src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} 
               alt="User" 
               className="h-9 w-9 rounded-lg bg-zinc-100 dark:bg-white/10 object-cover"
            />
            <div className="flex-1 min-w-0">
               <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{user.name}</p>
               <p className="text-xs text-zinc-500 truncate">{user.email}</p>
            </div>
            <button 
               onClick={handleLogout}
               className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
               title="Sign Out"
             >
                <LogOut size={16} />
             </button>
          </div>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-surface/90 backdrop-blur-lg border-b border-zinc-200 dark:border-zinc-800 z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-1.5 rounded-lg">
            <Wallet className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-lg dark:text-white">BudgetBuddy</span>
        </div>
        <button onClick={() => setIsDark(!isDark)} className="p-2 text-zinc-600 dark:text-zinc-400">
           {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-surface/90 backdrop-blur-lg border-t border-zinc-200 dark:border-zinc-800 z-50 pb-safe">
        <div className="flex justify-around p-3 items-center">
          <button onClick={() => setView('dashboard')} className={`p-2 rounded-lg flex flex-col items-center gap-1 ${view === 'dashboard' ? 'text-blue-600 dark:text-blue-500' : 'text-zinc-500'}`}>
            <LayoutDashboard size={20} />
            <span className="text-[10px]">Home</span>
          </button>
          <button onClick={() => setView('transactions')} className={`p-2 rounded-lg flex flex-col items-center gap-1 ${view === 'transactions' ? 'text-blue-600 dark:text-blue-500' : 'text-zinc-500'}`}>
            <History size={20} />
            <span className="text-[10px]">History</span>
          </button>
           <button onClick={() => setShowAddModal(true)} className="p-3 rounded-full bg-blue-600 text-white -mt-8 shadow-lg shadow-blue-600/30 border-4 border-white dark:border-black">
            <Plus size={24} />
          </button>
          <button onClick={() => setView('budget')} className={`p-2 rounded-lg flex flex-col items-center gap-1 ${view === 'budget' ? 'text-blue-600 dark:text-blue-500' : 'text-zinc-500'}`}>
            <Target size={20} />
            <span className="text-[10px]">Plan</span>
          </button>
          <button onClick={handleLogout} className="p-2 rounded-lg flex flex-col items-center gap-1 text-zinc-500">
            <LogOut size={20} />
            <span className="text-[10px]">Exit</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pt-20 md:pt-8 px-4 sm:px-6 lg:px-8 pb-24 md:pb-8">
        <div className="max-w-6xl mx-auto">
          
          {/* Dashboard View */}
          {view === 'dashboard' && (
            <div className="space-y-6 animate-fade-in">
              {/* Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard 
                  title="Total Balance" 
                  value={balance} 
                  icon={Wallet} 
                  colorClass="text-blue-500" 
                  trend="+2.5% from last month"
                />
                <StatCard 
                  title="Monthly Income" 
                  value={totalIncome} 
                  icon={TrendingUp} 
                  colorClass="text-green-500" 
                />
                <StatCard 
                  title="Monthly Expense" 
                  value={totalExpense} 
                  icon={Target} 
                  colorClass="text-red-500" 
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Charts */}
                <Card className="lg:col-span-2" title="Spending Analysis">
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={budgetProgressData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: isDark ? '#000' : '#fff', borderColor: isDark ? '#333' : '#e4e4e7', borderRadius: '12px', color: isDark ? '#fff' : '#000' }}
                          itemStyle={{ color: isDark ? '#fff' : '#000' }}
                          cursor={{ fill: isDark ? '#27272a' : '#f4f4f5', opacity: 0.4 }}
                        />
                        <Bar dataKey="Spent" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
                        <Bar dataKey="Limit" fill={isDark ? '#27272a' : '#e4e4e7'} radius={[4, 4, 0, 0]} barSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                {/* AI Advisor & Pie */}
                <div className="space-y-6">
                  <Card title="Expense Breakdown">
                     <div className="h-[200px] w-full flex justify-center items-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || COLORS.Other} stroke="none" />
                              ))}
                            </Pie>
                            <Tooltip 
                              contentStyle={{ backgroundColor: isDark ? '#000' : '#fff', borderColor: isDark ? '#333' : '#e4e4e7', borderRadius: '8px', color: isDark ? '#fff' : '#000' }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                     </div>
                     <div className="flex flex-wrap gap-2 mt-4 justify-center">
                        {pieData.slice(0, 4).map((entry) => (
                          <div key={entry.name} className="flex items-center text-xs text-zinc-500 dark:text-zinc-400">
                            <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: COLORS[entry.name as keyof typeof COLORS] || COLORS.Other }} />
                            {entry.name}
                          </div>
                        ))}
                     </div>
                  </Card>

                  <Card 
                    title="BudgetBuddy Advisor" 
                    className="border-blue-500/20 bg-gradient-to-b from-blue-500/5 to-transparent"
                    action={
                      <button onClick={refreshAIInsights} className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition-transform hover:scale-110">
                        <Sparkles size={16} />
                      </button>
                    }
                  >
                    <div className="min-h-[100px]">
                      {isAiLoading ? (
                        <div className="flex gap-2 animate-pulse">
                          <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                          <div className="h-2 w-2 bg-blue-500 rounded-full delay-75"></div>
                          <div className="h-2 w-2 bg-blue-500 rounded-full delay-150"></div>
                        </div>
                      ) : (
                        <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                          {aiAdvice || "Click the sparkles to analyze your spending patterns and get tips!"}
                        </p>
                      )}
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {/* Transactions View */}
          {view === 'transactions' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Transaction History</h2>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={exportCSV}>
                     <Download className="h-4 w-4 mr-2" /> Export CSV
                  </Button>
                </div>
              </div>

              <Card className="overflow-hidden p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-zinc-50 dark:bg-white/5 text-xs uppercase text-zinc-500 font-medium">
                      <tr>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Description</th>
                        <th className="px-6 py-4">Category</th>
                        <th className="px-6 py-4 text-right">Amount</th>
                        <th className="px-6 py-4"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-white/5">
                      {transactions.map((t) => (
                        <tr key={t.id} className="hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400 font-mono">
                            {new Date(t.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-zinc-900 dark:text-white">
                            {t.description}
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-transparent">
                              {t.category}
                            </span>
                          </td>
                          <td className={`px-6 py-4 text-sm font-mono font-bold text-right ${t.type === TransactionType.INCOME ? 'text-green-600 dark:text-green-500' : 'text-zinc-700 dark:text-zinc-200'}`}>
                            {t.type === TransactionType.INCOME ? '+' : '-'}${t.amount.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-right">
                             <button 
                               onClick={() => setTransactions(prev => prev.filter(x => x.id !== t.id))}
                               className="text-zinc-400 hover:text-red-500 transition-colors"
                             >
                               <Trash2 size={16} />
                             </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* Budget Planning View */}
          {view === 'budget' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Budget Settings</h2>
                <BudgetPlanner onApplyBudget={handleApplyBudgetPlan} />
                
                <Card title="Category Limits">
                  <div className="space-y-4">
                    {budgets.map((b, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-white/5 rounded-lg border border-zinc-200 dark:border-white/5">
                        <div className="flex flex-col">
                           <span className="font-medium text-zinc-900 dark:text-zinc-200">{b.category}</span>
                           <span className="text-xs text-zinc-500">Spent: ${b.spent}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-500 text-sm">$</span>
                          <input 
                            type="number" 
                            value={b.limit}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              setBudgets(prev => {
                                const next = [...prev];
                                next[i] = { ...next[i], limit: isNaN(val) ? 0 : val };
                                return next;
                              });
                            }}
                            className="w-24 bg-transparent border-b border-zinc-300 dark:border-zinc-700 focus:border-blue-500 outline-none text-right font-mono text-sm text-zinc-900 dark:text-white transition-colors"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
              
              <div className="space-y-6">
                <Card title="Visual Budget Analysis">
                   <div className="h-[400px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={budgetProgressData}>
                          <XAxis dataKey="name" stroke="#71717a" fontSize={10} angle={-45} textAnchor="end" height={60} />
                          <YAxis stroke="#71717a" />
                          <Tooltip 
                            contentStyle={{ backgroundColor: isDark ? '#000' : '#fff', borderColor: isDark ? '#333' : '#e4e4e7', color: isDark ? '#fff' : '#000' }} 
                          />
                          <Line type="monotone" dataKey="Spent" stroke="#ef4444" strokeWidth={2} dot={false} />
                          <Line type="monotone" dataKey="Limit" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                   </div>
                   <p className="text-sm text-zinc-500 text-center mt-4">
                     Dotted line represents your limits. Solid red line represents actual spending.
                   </p>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Add Transaction Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 dark:bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 w-full max-w-md rounded-2xl p-6 shadow-2xl animate-scale-in">
            <h3 className="text-xl font-bold mb-6 text-zinc-900 dark:text-white">Log Transaction</h3>
            
            <div className="space-y-4">
              <div className="flex gap-2 bg-zinc-100 dark:bg-black/40 p-1 rounded-lg">
                <button 
                  onClick={() => setNewTx({...newTx, type: TransactionType.EXPENSE})}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${newTx.type === TransactionType.EXPENSE ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow' : 'text-zinc-500'}`}
                >
                  Expense
                </button>
                <button 
                  onClick={() => setNewTx({...newTx, type: TransactionType.INCOME})}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${newTx.type === TransactionType.INCOME ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow' : 'text-zinc-500'}`}
                >
                  Income
                </button>
              </div>

              <div>
                <label className="block text-xs text-zinc-500 mb-1 uppercase tracking-wider">Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">$</span>
                  <input 
                    type="number"
                    value={newTx.amount || ''}
                    onChange={(e) => setNewTx({...newTx, amount: parseFloat(e.target.value)})}
                    className="w-full bg-zinc-50 dark:bg-black/50 border border-zinc-200 dark:border-white/10 rounded-lg py-3 pl-8 pr-4 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-mono text-lg transition-all"
                    placeholder="0.00"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-zinc-500 mb-1 uppercase tracking-wider">Description</label>
                <input 
                  type="text"
                  value={newTx.description}
                  onChange={(e) => setNewTx({...newTx, description: e.target.value})}
                  className="w-full bg-zinc-50 dark:bg-black/50 border border-zinc-200 dark:border-white/10 rounded-lg py-3 px-4 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="e.g. Grocery Store, Netflix"
                />
                <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                  <Sparkles size={12} /> Auto-categorization enabled
                </p>
              </div>

              <div>
                <label className="block text-xs text-zinc-500 mb-1 uppercase tracking-wider">Category (Optional)</label>
                <select 
                  value={newTx.category || ''}
                  onChange={(e) => setNewTx({...newTx, category: e.target.value})}
                  className="w-full bg-zinc-50 dark:bg-black/50 border border-zinc-200 dark:border-white/10 rounded-lg py-3 px-4 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none transition-all"
                >
                  <option value="">Auto-detect</option>
                  {(newTx.type === TransactionType.EXPENSE ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                 <label className="block text-xs text-zinc-500 mb-1 uppercase tracking-wider">Date</label>
                 <input 
                   type="date"
                   value={newTx.date}
                   onChange={(e) => setNewTx({...newTx, date: e.target.value})}
                   className="w-full bg-zinc-50 dark:bg-black/50 border border-zinc-200 dark:border-white/10 rounded-lg py-3 px-4 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                 />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <Button variant="ghost" className="flex-1" onClick={() => setShowAddModal(false)}>Cancel</Button>
              <Button className="flex-1" onClick={handleAddTransaction}>Save Transaction</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;