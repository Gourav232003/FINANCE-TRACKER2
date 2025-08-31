export type AnalyzeTxn = {
  date: string; // ISO
  amountPaise: number; // positive value
  type: 'INFLOW' | 'OUTFLOW';
  category?: string | null;
};

const ESSENTIALS = new Set([
  'rent','utilities','electricity','water','gas','internet','mobile',
  'groceries','education','healthcare','insurance','transport','emi','loan'
]);
const DISCRETIONARY = new Set([
  'dining','shopping','entertainment','travel','subscriptions','luxury'
]);

function inr(nPaise: number) {
  const n = Math.round(nPaise / 100);
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

export function analyzeTransactions(
  txns: AnalyzeTxn[],
  opts?: { start?: Date; end?: Date; surplusInvestThresholdPaise?: number; discretionaryHighRatio?: number }
) {
  const end = opts?.end ?? new Date();
  const start = opts?.start ?? new Date(end.getTime() - 30 * 24 * 3600 * 1000);
  const investThreshold = opts?.surplusInvestThresholdPaise ?? 700000; // ₹7,000
  const highDisc = opts?.discretionaryHighRatio ?? 0.4;

  const inRange = txns.filter(t => {
    const d = new Date(t.date);
    return d >= start && d <= end;
  });

  let income = 0, expense = 0, ess = 0, disc = 0;
  for (const t of inRange) {
    if (t.type === 'INFLOW') income += t.amountPaise;
    else {
      expense += t.amountPaise;
      const cat = (t.category || '').toLowerCase();
      if (ESSENTIALS.has(cat)) ess += t.amountPaise;
      else if (DISCRETIONARY.has(cat)) disc += t.amountPaise;
    }
  }
  const net = income - expense;
  const discRatio = expense > 0 ? disc / expense : 0;

  const recommendations: string[] = [];
  const insights: string[] = [];

  insights.push(`Income: ${inr(income)}, Expenses: ${inr(expense)}, Net: ${inr(net)} over ${Math.ceil((+end - +start)/86400000)} days.`);
  insights.push(`Essentials: ${inr(ess)} (${Math.round((ess/Math.max(1,expense))*100)}%), Discretionary: ${inr(disc)} (${Math.round(discRatio*100)}%).`);

  if (discRatio >= highDisc) {
    recommendations.push(`Save: Discretionary spend is high (${Math.round(discRatio*100)}%). Consider reducing dining/shopping to free up ₹3–5k/month.`);
  }
  if (net >= investThreshold) {
    recommendations.push(`Invest: You have a surplus of ${inr(net)}. Consider a SIP of ${inr(Math.floor(net*0.5))} in a conservative balanced fund or an RD.`);
  } else if (net < 0) {
    recommendations.push(`Save: You are overspending by ${inr(-net)}. Prioritise essentials and pause non-essential spends.`);
  }

  if (ess < expense * 0.3) {
    recommendations.push(`Buy essentials: Essentials seem low this period. Ensure groceries, utilities, and insurance are covered to avoid last-minute premiums.`);
  }

  return { start, end, income, expense, net, essentials: ess, discretionary: disc, insights, recommendations };
}

