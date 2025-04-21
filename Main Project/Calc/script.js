// --- DOM Elements ---
const initialInvestmentEl = document.getElementById("initialInvestment");
const regularContributionEl = document.getElementById("regularContribution");
const contributionFrequencyEl = document.getElementById(
    "contributionFrequency"
);
const interestRateEl = document.getElementById("interestRate");
const compoundingFrequencyEl = document.getElementById("compoundingFrequency");
const yearsEl = document.getElementById("years");

const futureValueEl = document.getElementById("futureValue");
const totalContributionsEl = document.getElementById("totalContributions");
const totalInterestEl = document.getElementById("totalInterest");

const ctx = document.getElementById("growthChart").getContext("2d");

// --- Chart.js Setup ---
let growthChart; // To hold the chart instance

function initializeChart() {
    if (growthChart) {
        growthChart.destroy(); // Destroy previous chart if exists
    }
    growthChart = new Chart(ctx, {
        type: "line", // Will be dynamically updated, starting as line avoids errors
        data: {
            labels: [], // Years
            datasets: [
                {
                    label: "Total Aportado",
                    data: [],
                    borderColor: "rgba(215, 201, 165, 1)",
                    backgroundColor: "rgba(215, 201, 165, 0.4)",
                    fill: true,
                    tension: 0.1, // Smoothes the line
                    pointRadius: 0, // Hide points for area chart look
                    order: 2, // Draw contributions below interest
                },
                {
                    label: "Interés Generado",
                    data: [],
                    borderColor: "rgba(45, 64, 44, 1)", // muted dark green
                    backgroundColor: "rgba(45, 64, 44, 0.3)",
                    fill: true,
                    tension: 0.1,
                    pointRadius: 0,
                    order: 1, // Draw interest on top
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    mode: "index",
                    intersect: false,
                    callbacks: {
                        // Custom tooltip to show total value easily
                        footer: function (tooltipItems) {
                            let sum = 0;
                            tooltipItems.forEach(function (tooltipItem) {
                                sum += tooltipItem.parsed.y;
                            });
                            return "Total Value: " + formatCurrency(sum);
                        },
                    },
                },
                legend: {
                    position: "top",
                },
                title: {
                    display: true,
                    text: "Crecimiento en el Tiempo",
                },
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: "Año",
                    },
                    stacked: false, // Keep X axis standard
                },
                y: {
                    title: {
                        display: true,
                        text: "Valor ($)",
                    },
                    stacked: true, // Stack the datasets on the Y axis
                    ticks: {
                        // Format Y-axis labels as currency
                        callback: function (value, index, values) {
                            return formatCurrency(value);
                        },
                    },
                },
            },
            interaction: {
                // For hover effects
                mode: "index",
                intersect: false,
            },
        },
    });
}

// --- Calculation Logic ---
function calculateCompoundGrowth() {
    const P = parseFloat(initialInvestmentEl.value) || 0;
    const PMT = parseFloat(regularContributionEl.value) || 0;
    const contribFreq = parseInt(contributionFrequencyEl.value); // 12, 4, 1
    const r = (parseFloat(interestRateEl.value) || 0) / 100; // Annual rate as decimal
    const n = parseInt(compoundingFrequencyEl.value); // Compounding periods per year (12, 4, 2, 1)
    const t = parseInt(yearsEl.value) || 0;

    let futureValue = P;
    let totalContributions = P;
    let cumulativeInterest = 0;

    // Data for chart
    const yearsLabels = ["Start"];
    const contributionData = [P];
    const interestData = [0]; // Start with zero interest

    // Calculate period rate and contribution per period
    const ratePerPeriod = r / n;
    // How many contributions occur per compounding period?
    const contribsPerCompPeriod = n / contribFreq;
    const pmtPerCompPeriod = PMT * contribsPerCompPeriod;

    // Simulate year by year for chart data
    let currentBalance = P;
    let cumulativeContributions = P;
    for (let year = 1; year <= t; year++) {
        let balanceAtYearStart = currentBalance;
        let contributionsThisYear = 0;

        for (let period = 1; period <= n; period++) {
            // Add contribution at the START of the period it's due
            // This is a simplification - assumes contributions happen right before compounding
            if (contribFreq > 0 && (period - 1) % (n / contribFreq) === 0) {
                const contributionAmount = PMT; // The actual amount added per contribution event
                currentBalance += contributionAmount;
                cumulativeContributions += contributionAmount;
                contributionsThisYear += contributionAmount;
            }

            // Calculate interest for the period
            let interestThisPeriod = currentBalance * ratePerPeriod;
            currentBalance += interestThisPeriod; // Add interest
        }

        yearsLabels.push(`Año ${year}`);
        contributionData.push(cumulativeContributions); // Total principal paid in by this year end
        // Interest is the total balance minus the total contributions
        interestData.push(currentBalance - cumulativeContributions);
    }

    // Final precise calculation using formula (more accurate for final numbers than loop)
    // Compound interest for principal
    const finalP = P * Math.pow(1 + r / n, n * t);
    // Future value of an ordinary annuity for contributions
    // Note: This standard formula assumes contributions match compounding frequency.
    // Adjusting perfectly for mismatched frequencies is complex. We'll use the loop result for display consistency.
    // const finalPMT = PMT * ( (Math.pow(1 + r/n, n*t) - 1) / (r/n) ) * (1 / contribsPerCompPeriod); // Simplified adjustment

    // Use the loop result for display consistency
    futureValue = currentBalance;
    totalContributions = cumulativeContributions; // From loop
    cumulativeInterest = futureValue - totalContributions;

    // --- Update Display ---
    futureValueEl.textContent = formatCurrency(futureValue);
    totalContributionsEl.textContent = formatCurrency(totalContributions);
    totalInterestEl.textContent = formatCurrency(cumulativeInterest);

    // --- Update Chart ---
    // Ensure the chart instance exists
    if (!growthChart) {
        initializeChart();
    }

    growthChart.data.labels = yearsLabels;
    growthChart.data.datasets[0].data = contributionData; // Contributions dataset
    growthChart.data.datasets[1].data = interestData; // Interest dataset
    growthChart.update(); // Redraw the chart
}

// --- Formatting Helper ---
function formatCurrency(value) {
    return value.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
    });
}

// --- Event Listeners for Real-Time Updates ---
const inputs = [
    initialInvestmentEl,
    regularContributionEl,
    contributionFrequencyEl,
    interestRateEl,
    compoundingFrequencyEl,
    yearsEl,
];
inputs.forEach((input) => {
    input.addEventListener("input", calculateCompoundGrowth); // Recalculate on any input change
    input.addEventListener("change", calculateCompoundGrowth); // Also catch changes for selects/blur
});

// --- Initial Calculation & Chart Render ---
document.addEventListener("DOMContentLoaded", () => {
    initializeChart(); // Set up the chart structure first
    calculateCompoundGrowth(); // Then run the initial calculation and populate
});
