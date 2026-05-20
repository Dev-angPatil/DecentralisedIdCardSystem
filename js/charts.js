/**
 * js/charts.js
 * Data visualization layer for ChainCampus using Chart.js.
 * Implements glassmorphism aesthetics and custom themes using CSS variables.
 */

// Retrieve design token colors dynamically from stylesheet
function getThemeColors() {
  const style = getComputedStyle(document.body);
  return {
    teal: style.getPropertyValue('--teal').trim() || '#1a4a47',
    tealLight: style.getPropertyValue('--teal-light').trim() || '#2a7a74',
    tealGlow: style.getPropertyValue('--teal-glow').trim() || 'rgba(26, 74, 71, 0.20)',
    amber: style.getPropertyValue('--amber').trim() || '#f59e0b',
    amberGlow: style.getPropertyValue('--amber-glow').trim() || 'rgba(245, 158, 11, 0.25)',
    stroke: style.getPropertyValue('--stroke').trim() || 'rgba(0, 0, 0, 0.08)',
    text: style.getPropertyValue('--text').trim() || '#0f1923',
    textSoft: style.getPropertyValue('--text-soft').trim() || '#4a6274',
    fontFamily: "'Inter', system-ui, sans-serif"
  };
}

let attendanceChartInstance = null;
let transactionChartInstance = null;
let profileChartInstance = null;

/**
 * Render smooth Line Chart showing attendance records accumulation over time
 */
export function renderAttendanceChart(canvasId, records = []) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const colors = getThemeColors();
  const ctx = canvas.getContext('2d');

  if (attendanceChartInstance) {
    attendanceChartInstance.destroy();
  }

  // Pre-process and sort records chronologically
  const sortedRecords = [...records]
    .filter(r => r.date)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const dates = [];
  const cumulativeCount = [];
  let count = 0;

  sortedRecords.forEach(r => {
    const formattedDate = new Date(r.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    dates.push(formattedDate);
    count++;
    cumulativeCount.push(count);
  });

  // Fallback if no records exist
  const labels = dates.length ? dates : ['No Data'];
  const data = cumulativeCount.length ? cumulativeCount : [0];

  // Create gradient fill
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height || 200);
  gradient.addColorStop(0, colors.tealLight + '50'); // 30% opacity
  gradient.addColorStop(1, colors.tealLight + '05'); // 2% opacity

  attendanceChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Classes Attended',
        data: data,
        borderColor: colors.tealLight,
        borderWidth: 3,
        backgroundColor: gradient,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: colors.teal,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          titleColor: colors.text,
          bodyColor: colors.textSoft,
          titleFont: { family: colors.fontFamily, weight: 'bold' },
          bodyFont: { family: colors.fontFamily },
          borderColor: colors.stroke,
          borderWidth: 1,
          padding: 10,
          cornerRadius: 8,
          displayColors: false
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: colors.textSoft, font: { family: colors.fontFamily, size: 10 } }
        },
        y: {
          grid: { color: colors.stroke, drawBorder: false },
          ticks: { 
            color: colors.textSoft, 
            font: { family: colors.fontFamily, size: 10 },
            stepSize: 1,
            precision: 0 
          }
        }
      }
    }
  });
}

/**
 * Render Bar Chart representing frequency of different action categories on-chain
 */
export function renderTransactionChart(canvasId, txLog = []) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const colors = getThemeColors();
  const ctx = canvas.getContext('2d');

  if (transactionChartInstance) {
    transactionChartInstance.destroy();
  }

  // Group transactions by category type
  const categories = {
    'Registration': 0,
    'Attendance': 0,
    'Enrollment': 0,
    'Events': 0
  };

  txLog.forEach(t => {
    const act = (t.action || '').toLowerCase();
    if (act.includes('register') || act.includes('identity')) {
      categories['Registration']++;
    } else if (act.includes('attendance') || act.includes('mark')) {
      categories['Attendance']++;
    } else if (act.includes('enroll') || act.includes('course')) {
      categories['Enrollment']++;
    } else if (act.includes('event')) {
      categories['Events']++;
    }
  });

  const labels = Object.keys(categories);
  const data = Object.values(categories);

  transactionChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Tx Count',
        data: data,
        backgroundColor: [
          colors.teal + 'd0',
          colors.amber + 'd0',
          colors.tealLight + 'd0',
          '#8b5cf6d0' // violet
        ],
        borderColor: [
          colors.teal,
          colors.amber,
          colors.tealLight,
          '#8b5cf6'
        ],
        borderWidth: 1.5,
        borderRadius: 6,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          titleColor: colors.text,
          bodyColor: colors.textSoft,
          titleFont: { family: colors.fontFamily, weight: 'bold' },
          bodyFont: { family: colors.fontFamily },
          borderColor: colors.stroke,
          borderWidth: 1,
          padding: 10,
          cornerRadius: 8,
          displayColors: false
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: colors.textSoft, font: { family: colors.fontFamily, size: 10 } }
        },
        y: {
          grid: { color: colors.stroke, drawBorder: false },
          ticks: { 
            color: colors.textSoft, 
            font: { family: colors.fontFamily, size: 10 },
            stepSize: 1,
            precision: 0
          }
        }
      }
    }
  });
}

/**
 * Render Polar Area or Radar activity chart for the Profile Page Identity Mirror
 */
export function renderProfileActivityChart(canvasId, state = {}) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const colors = getThemeColors();
  const ctx = canvas.getContext('2d');

  if (profileChartInstance) {
    profileChartInstance.destroy();
  }

  const enrolledCount = state.enrolledCourses?.length || 0;
  const attendanceCount = state.attendanceRecords?.length || 0;
  const txCount = state.txLog?.length || 0;
  const eventsCount = state.events?.filter(e => e.verified).length || 0;

  profileChartInstance = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: ['Courses Enrolled', 'Classes Attended', 'Verified Events', 'On-Chain Transactions'],
      datasets: [{
        label: 'My Student Metrics',
        data: [enrolledCount, attendanceCount, eventsCount, txCount],
        backgroundColor: colors.tealGlow,
        borderColor: colors.tealLight,
        borderWidth: 2,
        pointBackgroundColor: colors.teal,
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: colors.teal
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          titleColor: colors.text,
          bodyColor: colors.textSoft,
          borderColor: colors.stroke,
          borderWidth: 1,
          cornerRadius: 8
        }
      },
      scales: {
        r: {
          angleLines: { color: colors.stroke },
          grid: { color: colors.stroke },
          pointLabels: {
            color: colors.textSoft,
            font: { family: colors.fontFamily, size: 9, weight: '600' }
          },
          ticks: {
            display: false,
            stepSize: 2
          }
        }
      }
    }
  });
}
