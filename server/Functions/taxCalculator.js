const calculateTaxStep = (netIncome) => {
    if (netIncome <= 150000) return 0;
    if (netIncome <= 300000) return (netIncome - 150000) * 0.05;
    if (netIncome <= 500000) return 7500 + (netIncome - 300000) * 0.10;
    if (netIncome <= 750000) return 27500 + (netIncome - 500000) * 0.15;
    if (netIncome <= 1000000) return 65000 + (netIncome - 750000) * 0.20;
    if (netIncome <= 2000000) return 115000 + (netIncome - 1000000) * 0.25;
    if (netIncome <= 5000000) return 365000 + (netIncome - 2000000) * 0.30;
    return 1265000 + (netIncome - 5000000) * 0.35;
};

module.exports = { calculateTaxStep };