// Finance Flow - Production Ready Logic
document.addEventListener('DOMContentLoaded', () => {
    // State Management
    const defaultBudgets = {
        'Food': 500, 'Travel': 200, 'Bills': 1000, 'Entertainment': 300, 
        'Shopping': 400, 'Investment': 1000, 'Salary': 0, 'Health': 200, 'Others': 200
    };

    let rawTransactions = JSON.parse(localStorage.getItem('ff_transactions')) || [];
    let rawBudgets = JSON.parse(localStorage.getItem('ff_budgets')) || {};

    // Migration: Transport -> Travel
    rawTransactions = rawTransactions.map(t => ({ ...t, category: t.category === 'Transport' ? 'Travel' : t.category }));
    if (rawBudgets['Transport']) {
        rawBudgets['Travel'] = rawBudgets['Transport'];
        delete rawBudgets['Transport'];
    }

    let state = {
        transactions: rawTransactions,
        budgets: { ...defaultBudgets, ...rawBudgets },
        investments: JSON.parse(localStorage.getItem('ff_investments')) || [],
        taxSettings: JSON.parse(localStorage.getItem('ff_taxSettings')) || {
            annualIncome: 0, deductions: 0, useFF: false
        },
        currentFilter: {
            month: new Date().getMonth(),
            year: new Date().getFullYear()
        }
    };

    // DOM Elements
    const sidebarItems = document.querySelectorAll('.sidebar-nav li');
    const pages = document.querySelectorAll('.page');
    const pageTitle = document.getElementById('page-title');
    const filterSelect = document.getElementById('filter-month-year');
    
    // Summary Elements
    const headBalance = document.getElementById('header-total-balance');
    const monIncome = document.getElementById('monthly-income');
    const monExpense = document.getElementById('monthly-expense');
    const headNetWorth = document.getElementById('total-net-worth');

    // Charts
    let trendChart, categoryChart, investChart;

    // --- INITIALIZATION ---
    function init() {
        populateFilter();
        setupNavigation();
        setupModals();
        setupEventListeners();
        updateGlobalState();
    }

    // --- NAVIGATION ---
    function setupNavigation() {
        sidebarItems.forEach(item => {
            item.addEventListener('click', () => {
                const pageId = item.getAttribute('data-page');
                if (!pageId) return; 

                sidebarItems.forEach(i => i.classList.remove('active'));
                item.classList.add('active');

                pages.forEach(p => p.classList.add('hidden'));
                document.getElementById(`${pageId}-page`).classList.remove('hidden');
                pageTitle.innerText = item.innerText.trim();

                refreshActivePage(pageId);
                if (window.innerWidth <= 992) document.getElementById('sidebar').classList.remove('active');
            });
        });

        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const target = btn.getAttribute('data-tab');
                document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
                document.getElementById(target).classList.remove('hidden');
                
                if (target === 'invest-manager') renderInvestments();
                else renderTax();
            });
        });
    }

    function refreshActivePage(pageId) {
        if (pageId === 'dashboard') renderDashboard();
        if (pageId === 'transactions') renderTransactionsTable();
        if (pageId === 'budgets') renderBudgets();
        if (pageId === 'tax-invest') {
            const activeTab = document.querySelector('.tab-btn.active').getAttribute('data-tab');
            if (activeTab === 'invest-manager') renderInvestments();
            else renderTax();
        }
    }

    // --- CORE LOGIC ---
    function updateGlobalState() {
        const income = state.transactions.filter(t => t.type === 'income');
        const expense = state.transactions.filter(t => t.type === 'expense');

        const totalIncomeAcrossTime = income.reduce((s,t) => s + parseFloat(t.amount || 0), 0);
        const totalExpenseAcrossTime = expense.reduce((s,t) => s + parseFloat(t.amount || 0), 0);
        const cashBalance = totalIncomeAcrossTime - totalExpenseAcrossTime;

        const totalInvested = state.investments.reduce((s,i) => s + parseFloat(i.amountInvested || 0), 0);
        
        headBalance.innerText = formatCurrency(cashBalance);
        headBalance.className = `value ${cashBalance >= 0 ? 'balance-positive' : 'balance-negative'}`;
        headNetWorth.innerText = formatCurrency(cashBalance + totalInvested);

        localStorage.setItem('ff_transactions', JSON.stringify(state.transactions));
        localStorage.setItem('ff_investments', JSON.stringify(state.investments));
        localStorage.setItem('ff_budgets', JSON.stringify(state.budgets));
        localStorage.setItem('ff_taxSettings', JSON.stringify(state.taxSettings));

        renderActivePageUI();
    }

    // --- DASHBOARD ---
    function renderDashboard() {
        const filtered = getFilteredTransactions();
        const inc = filtered.filter(t => t.type === 'income').reduce((s,t) => s + parseFloat(t.amount), 0);
        const exp = filtered.filter(t => t.type === 'expense').reduce((s,t) => s + parseFloat(t.amount), 0);

        monIncome.innerText = formatCurrency(inc);
        monExpense.innerText = formatCurrency(exp);
        document.getElementById('monthly-savings').innerText = formatCurrency(inc - exp);

        renderDashboardCharts(filtered);
    }

    function renderDashboardCharts(filtered) {
        const ctxTrend = document.getElementById('trend-chart').getContext('2d');
        const ctxCat = document.getElementById('category-chart').getContext('2d');

        const monthsLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const curYear = state.currentFilter.year;
        const trendData = monthsLabels.map((m, i) => {
            const mTrans = state.transactions.filter(t => {
                const d = new Date(t.date);
                return d.getMonth() === i && d.getFullYear() === curYear;
            });
            return {
                inc: mTrans.filter(t => t.type === 'income').reduce((s,t) => s + parseFloat(t.amount || 0), 0),
                exp: mTrans.filter(t => t.type === 'expense').reduce((s,t) => s + parseFloat(t.amount || 0), 0)
            };
        });

        if (trendChart) trendChart.destroy();
        trendChart = new Chart(ctxTrend, {
            type: 'line',
            data: {
                labels: monthsLabels,
                datasets: [
                    { 
                        label: 'Income', 
                        data: trendData.map(d => d.inc), 
                        borderColor: '#4169E1',
                        backgroundColor: '#4169E1',
                        fill: false,
                        tension: 0.3,
                        pointRadius: 5,
                        pointHoverRadius: 7,
                        borderWidth: 3
                    },
                    { 
                        label: 'Expense', 
                        data: trendData.map(d => d.exp), 
                        borderColor: '#EF4444',
                        backgroundColor: '#EF4444',
                        fill: false,
                        tension: 0.3,
                        pointRadius: 5,
                        pointHoverRadius: 7,
                        borderWidth: 3
                    }
                ]
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: '#e2e8f0'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });

        const expByCat = {};
        filtered.filter(t => t.type === 'expense').forEach(t => {
            expByCat[t.category] = (expByCat[t.category] || 0) + parseFloat(t.amount);
        });

        if (categoryChart) categoryChart.destroy();
        categoryChart = new Chart(ctxCat, {
            type: 'doughnut',
            data: {
                labels: Object.keys(expByCat),
                datasets: [{
                    data: Object.values(expByCat),
                    backgroundColor: ['#4169E1', '#EF4444', '#FFD700', '#2ecc71', '#9b59b6', '#f39c12', '#1E3A8A', '#e67e22']
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    // --- TRANSACTIONS ---
    function renderTransactionsTable() {
        const tbody = document.getElementById('transactions-body');
        const searchInput = document.getElementById('transaction-search');
        const search = searchInput ? searchInput.value.toLowerCase() : '';
        let filtered = getFilteredTransactions();

        if (search) {
            filtered = filtered.filter(t => t.notes.toLowerCase().includes(search) || t.category.toLowerCase().includes(search));
        }

        tbody.innerHTML = filtered.sort((a,b) => new Date(b.date) - new Date(a.date)).map(t => `
            <tr>
                <td>${formatDate(t.date)}</td>
                <td><span class="tag">${t.category}</span></td>
                <td class="type-${t.type}">${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)}</td>
                <td>${t.notes || '-'}</td>
                <td>
                    <button class="btn-icon btn-edit" onclick="window.editTransaction('${t.id}')"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon btn-delete" onclick="window.deleteTransaction('${t.id}')"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    }

    // --- BUDGETS ---
    function renderBudgets() {
        const container = document.getElementById('budgets-container');
        const filtered = getFilteredTransactions();
        container.innerHTML = '<h2>Monthly Budgets</h2>';

        Object.keys(state.budgets).forEach(cat => {
            if (cat === 'Salary') return;
            const spent = filtered.filter(t => t.type === 'expense' && t.category === cat).reduce((s,t) => s + parseFloat(t.amount), 0);
            const limit = state.budgets[cat];
            const percent = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
            
            let color = 'var(--green)';
            if (percent > 60) color = 'var(--gold)';
            if (percent >= 100) color = 'var(--red)';

            container.innerHTML += `
                <div class="card budget-item" style="flex-direction:column; align-items:stretch">
                    <div class="budget-label" style="display:flex; justify-content:space-between; margin-bottom:10px;">
                        <strong>${cat}</strong>
                        <span>${formatCurrency(spent)} / ${formatCurrency(limit)}</span>
                    </div>
                    <div class="progress-bar" style="height:10px; background:#e2e8f0; border-radius:5px; overflow:hidden">
                        <div class="progress-fill" style="width:${percent}%; height:100%; background:${color}; transition: width 0.5s ease"></div>
                    </div>
                </div>
            `;
        });
    }

    // --- TAX CALCULATOR ---
    function renderTax() {
        const incomeField = document.getElementById('tax-annual-income');
        if (state.taxSettings.useFF) {
            const incomeThisYear = state.transactions.filter(t => {
                const d = new Date(t.date);
                return t.type === 'income' && d.getFullYear() === state.currentFilter.year;
            }).reduce((s,t) => s + parseFloat(t.amount), 0);
            incomeField.value = incomeThisYear;
            state.taxSettings.annualIncome = incomeThisYear;
        } else {
            incomeField.value = state.taxSettings.annualIncome;
        }
        document.getElementById('tax-deductions').value = state.taxSettings.deductions;
        document.getElementById('tax-use-ff-income').checked = state.taxSettings.useFF;
        calculateTax();
    }

    function calculateTax() {
        const income = parseFloat(document.getElementById('tax-annual-income').value) || 0;
        const deductions = parseFloat(document.getElementById('tax-deductions').value) || 0;
        const taxable = Math.max(0, income - deductions);
        
        let tax = 0;
        const slabs = [
            { limit: 300000, rate: 0 },
            { limit: 300000, rate: 0.05 },
            { limit: 300000, rate: 0.10 },
            { limit: 300000, rate: 0.15 },
            { limit: 300000, rate: 0.20 },
            { limit: Infinity, rate: 0.30 }
        ];

        let remaining = taxable;
        const breakdown = [];
        slabs.forEach(s => {
            if (remaining <= 0) return;
            const taxableInThisSlab = Math.min(remaining, s.limit);
            const taxForSlab = taxableInThisSlab * s.rate;
            tax += taxForSlab;
            if (taxForSlab > 0) breakdown.push(`Slab @ ${s.rate*100}%: ${formatCurrency(taxForSlab)}`);
            remaining -= taxableInThisSlab;
        });

        document.getElementById('taxable-income-val').innerText = formatCurrency(taxable);
        document.getElementById('tax-payable-val').innerText = formatCurrency(tax);
        document.getElementById('tax-rate-val').innerText = taxable > 0 ? ((tax / taxable) * 100).toFixed(1) + '%' : '0%';
        document.getElementById('tax-monthly-val').innerText = formatCurrency(tax / 12);
        document.getElementById('tax-slab-breakdown').innerHTML = breakdown.map(b => `<div>${b}</div>`).join('');
    }

    // --- INVESTMENTS ---
    function renderInvestments() {
        const tbody = document.getElementById('investments-body');
        const investedSum = state.investments.reduce((s,i) => s + parseFloat(i.amountInvested), 0);
        
        let estValue = 0;
        state.investments.forEach(inv => {
            const date = new Date(inv.date);
            const monthsHeld = (new Date() - date) / (1000 * 60 * 60 * 24 * 30.44);
            const rate = parseFloat(inv.expectedRate || 10) / 100;
            estValue += inv.amountInvested * (1 + (rate * (monthsHeld/12)));
        });

        document.getElementById('total-invested-val').innerText = formatCurrency(investedSum);
        document.getElementById('est-current-val').innerText = formatCurrency(estValue);

        tbody.innerHTML = state.investments.map(i => `
            <tr>
                <td>${i.name}</td>
                <td>${i.type}</td>
                <td>${formatCurrency(i.amountInvested)}</td>
                <td>
                    <button class="btn-icon btn-edit" onclick="window.editInvestment('${i.id}')"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon btn-delete" onclick="window.deleteInvestment('${i.id}')"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');

        renderInvestChart();
    }

    function renderInvestChart() {
        const ctx = document.getElementById('invest-type-chart').getContext('2d');
        const byType = {};
        state.investments.forEach(i => { byType[i.type] = (byType[i.type] || 0) + parseFloat(i.amountInvested); });

        if (investChart) investChart.destroy();
        investChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: Object.keys(byType),
                datasets: [{ data: Object.values(byType), backgroundColor: ['#4169E1', '#EF4444', '#FFD700', '#2ecc71', '#9b59b6'] }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    // --- HANDLERS ---
    function setupEventListeners() {
        document.getElementById('open-add-modal').addEventListener('click', () => openModal('transaction'));
        document.getElementById('open-invest-modal').addEventListener('click', () => openModal('invest'));
        document.querySelectorAll('.close-modal').forEach(b => b.addEventListener('click', closeModal));

        document.getElementById('transaction-form').addEventListener('submit', handleTransactionSubmit);
        document.getElementById('invest-form').addEventListener('submit', handleInvestSubmit);
        document.getElementById('budget-form').addEventListener('submit', handleBudgetSubmit);

        filterSelect.addEventListener('change', () => {
            const [y, m] = filterSelect.value.split('-');
            state.currentFilter = { year: parseInt(y), month: parseInt(m) };
            refreshActivePage(document.querySelector('.sidebar-nav li.active').getAttribute('data-page'));
        });

        const searchBox = document.getElementById('transaction-search');
        if (searchBox) searchBox.addEventListener('input', renderTransactionsTable);

        document.getElementById('calculate-tax-btn').addEventListener('click', () => {
            state.taxSettings.annualIncome = parseFloat(document.getElementById('tax-annual-income').value);
            state.taxSettings.deductions = parseFloat(document.getElementById('tax-deductions').value);
            state.taxSettings.useFF = document.getElementById('tax-use-ff-income').checked;
            calculateTax();
            localStorage.setItem('ff_taxSettings', JSON.stringify(state.taxSettings));
        });

        document.getElementById('export-data').addEventListener('click', exportData);
        document.getElementById('import-data').addEventListener('change', importData);

        document.getElementById('mobile-toggle').addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('active');
        });

        document.getElementById('open-budget-modal').addEventListener('click', () => {
            const container = document.getElementById('budget-inputs-container');
            container.innerHTML = Object.keys(state.budgets).map(cat => `
                <div class="form-group">
                    <label>${cat} Budget Limit</label>
                    <input type="number" data-category="${cat}" value="${state.budgets[cat]}" required>
                </div>
            `).join('');
            document.getElementById('budget-modal').style.display = 'block';
        });
    }

    function setupModals() {
        window.onclick = (event) => {
            if (event.target.classList.contains('modal')) closeModal();
        };
    }

    function handleTransactionSubmit(e) {
        e.preventDefault();
        const id = document.getElementById('edit-id').value;
        const data = {
            id: id || Date.now().toString(),
            amount: parseFloat(document.getElementById('amount').value),
            type: document.getElementById('type').value,
            category: document.getElementById('category').value,
            date: document.getElementById('date').value,
            notes: document.getElementById('notes').value,
            isInvestment: document.getElementById('is-investment').checked
        };

        if (id) {
            const idx = state.transactions.findIndex(t => t.id === id);
            state.transactions[idx] = data;
        } else {
            state.transactions.push(data);
            if (data.isInvestment && data.type === 'expense') {
                state.investments.push({
                    id: 'inv_' + data.id,
                    name: `Linked: ${data.category}`,
                    type: 'Other',
                    amountInvested: data.amount,
                    date: data.date,
                    expectedRate: 10
                });
            }
        }
        closeModal();
        updateGlobalState();
    }

    function handleInvestSubmit(e) {
        e.preventDefault();
        const id = document.getElementById('invest-id').value;
        const data = {
            id: id || 'inv_' + Date.now().toString(),
            name: document.getElementById('invest-name').value,
            type: document.getElementById('invest-type').value,
            amountInvested: parseFloat(document.getElementById('invest-amount').value),
            date: document.getElementById('invest-date').value,
            expectedRate: parseFloat(document.getElementById('invest-rate').value)
        };

        if (id) {
            const idx = state.investments.findIndex(i => i.id === id);
            state.investments[idx] = data;
        } else {
            state.investments.push(data);
        }
        closeModal();
        updateGlobalState();
        renderInvestments();
    }

    function handleBudgetSubmit(e) {
        e.preventDefault();
        const inputs = e.target.querySelectorAll('input[data-category]');
        inputs.forEach(i => { state.budgets[i.getAttribute('data-category')] = parseFloat(i.value); });
        localStorage.setItem('ff_budgets', JSON.stringify(state.budgets));
        closeModal();
        renderBudgets();
    }

    window.deleteTransaction = (id) => {
        if(confirm('Delete?')) {
            state.transactions = state.transactions.filter(t => t.id !== id);
            updateGlobalState();
            renderActivePageUI();
        }
    };

    window.editTransaction = (id) => {
        const t = state.transactions.find(t => t.id === id);
        openModal('transaction', t);
    };

    window.editInvestment = (id) => {
        const i = state.investments.find(inv => inv.id === id);
        openModal('invest', i);
    };

    window.deleteInvestment = (id) => {
        if(confirm('Delete investment?')) {
            state.investments = state.investments.filter(i => i.id !== id);
            updateGlobalState();
            renderInvestments();
        }
    };

    function openModal(type, data = null) {
        if (type === 'transaction') {
            document.getElementById('transaction-modal').style.display = 'block';
            document.getElementById('transaction-form').reset();
            document.getElementById('edit-id').value = '';
            document.getElementById('date').valueAsDate = new Date();
            if (data) {
                document.getElementById('edit-id').value = data.id;
                document.getElementById('amount').value = data.amount;
                document.getElementById('type').value = data.type;
                document.getElementById('category').value = data.category;
                document.getElementById('date').value = data.date;
                document.getElementById('notes').value = data.notes;
                document.getElementById('is-investment').checked = data.isInvestment;
            }
        } else if (type === 'invest') {
            document.getElementById('invest-modal').style.display = 'block';
            document.getElementById('invest-form').reset();
            document.getElementById('invest-id').value = '';
            document.getElementById('invest-date').valueAsDate = new Date();
            if (data) {
                document.getElementById('invest-id').value = data.id;
                document.getElementById('invest-name').value = data.name;
                document.getElementById('invest-type').value = data.type;
                document.getElementById('invest-amount').value = data.amountInvested;
                document.getElementById('invest-date').value = data.date;
                document.getElementById('invest-rate').value = data.expectedRate;
            }
        }
    }

    function closeModal() {
        document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
    }

    function renderActivePageUI() {
        const activeNav = document.querySelector('.sidebar-nav li.active');
        const page = activeNav ? activeNav.getAttribute('data-page') : 'dashboard';
        refreshActivePage(page);
    }

    function getFilteredTransactions() {
        return state.transactions.filter(t => {
            // Using YYYY-MM-DD format directly to avoid timezone shifts
            const [year, month] = t.date.split('-').map(Number);
            return (month - 1) === state.currentFilter.month && year === state.currentFilter.year;
        });
    }

    function populateFilter() {
        const sel = document.getElementById('filter-month-year');
        const now = new Date();
        sel.innerHTML = '';
        for (let i = 0; i < 24; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const val = `${d.getFullYear()}-${d.getMonth()}`;
            sel.innerHTML += `<option value="${val}">${d.toLocaleDateString('default', { month: 'long', year: 'numeric' })}</option>`;
        }
    }

    function formatCurrency(n) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n); }
    function formatDate(s) { return new Date(s).toLocaleDateString(); }

    function exportData() {
        const blob = new Blob([JSON.stringify(state)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `finance_flow_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
    }

    function importData(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const imported = JSON.parse(ev.target.result);
                state = { ...state, ...imported };
                updateGlobalState();
                alert('Data imported! Reloading...');
                location.reload();
            } catch (err) { alert('Invalid file'); }
        };
        reader.readAsText(file);
    }

    init();
});
