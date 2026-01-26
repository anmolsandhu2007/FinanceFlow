# Finance Flow | Premium Wealth Management Ecosystem

**Finance Flow** is an advanced, production-ready personal finance and wealth management platform. Beyond simple expense tracking, it provides a comprehensive 360-degree view of your financial health, including portfolio management, tax planning, and net worth visualization.

## 💎 Advanced Features

### 📈 Wealth & Investment Management
- **Portfolio Tracking**: Manage diversified investments including Stocks, Mutual Funds, Real Estate, and Gold.
- **ROI Estimation**: Sophisticated logic to calculate estimated current value based on holding periods and expected growth rates.
- **Integrated Wealth Creation**: Mark expenses as "Investments" during transaction entry to automatically sync with your portfolio.
- **Net Worth Dashboard**: Real-time calculation of your total wealth (Cash Balance + Investment Portfolio).

### ⚖️ Smart Tax Planning
- **New Slab Regime**: Built-in calculator for the latest progressive tax slabs ($0-3L$ @ $0\%$, $3-6L$ @ $5\%$, etc.).
- **Auto-Sync Income**: Option to automatically pull annual income figures from your document Salary transactions for effortless calculation.
- **Slab Breakdown**: Detailed visualization of how your tax is distributed across different income brackets.

### 📊 Professional Analytics
- **Connected Growth Charts**: Interactive line graphs with smoothed curves and markers to visualize income vs. expense trajectories.
- **Asset Allocation**: Dynamic pie charts showcasing your investment distribution by asset class.
- **Category Insights**: Doughnut charts for deep-dives into monthly spending habits.

### 🎨 Premium User Experience
- **Glassmorphism UI**: High-end aesthetic featuring semi-transparent headers, backdrop blurs, and sophisticated radial gradients.
- **3D Interactive Cards**: Hover-responsive components with smooth scaling and deep shadows.
- **Production Persistence**: Full `localStorage` implementation ensuring all data remains personal and offline.
- **Terminology Optimized**: User-centric categories (e.g., "Travel", "Health") with automatic legacy data migration.

## 🛠️ Performance Stack

- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3.
- **Styling**: Advanced CSS Grid & Flexbox with sticky positioning and custom keyframe animations.
- **Charts**: [Chart.js](https://www.chartjs.org/) for high-performance rendering.
- **Icons**: Font Awesome 6.

## 📦 Usage Instructions

1. **Launch**: Open `index.html` in any modern browser.
2. **Setup**: Go to **Budgets** to set your monthly goals.
3. **Tracking**: Use **New Entry** to record spending. Toggle "Mark as Investment" for wealth-building expenses.
4. **Grow**: Use the **Investment Manager** to track assets outside your daily cash flow.
5. **Plan**: Switch to **Tax Calculator** to estimate your annual liabilities.

## 📂 Logic Specifications

```javascript
// Investment Object
{
  id: "inv_123...",
  name: "S&P 500 Index",
  type: "Stock",
  amountInvested: 5000,
  date: "2026-01-26",
  expectedRate: 10
}

// Global State (Persisted)
{
  transactions: [...],
  budgets: { "Food": 500, "Travel": 200, ... },
  investments: [...],
  taxSettings: { annualIncome: 0, deductions: 0, useFF: false }
}
```

## 📜 Credits & License
This project is open-source.
*Built with Gemini 3 Flash (Preview)*
