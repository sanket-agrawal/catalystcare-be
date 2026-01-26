interface BlockerResult {
    name: string;
    score: number;
    label: string;
  }
  
  interface ResultsEmailData {
    userName: string;
    results: BlockerResult[];
    highestBlocker: BlockerResult;
  }
  
  const CONTEXT_EXPLANATIONS: Record<string, string> = {
    'Focus': 'Your mind keeps jumping between tasks, making it hard to finish things or feel satisfied with your work.',
    'Energy': 'Physical or mental exhaustion is making even small tasks feel overwhelming.',
    'Mood': 'Emotional ups and downs are affecting your ability to stay consistent and motivated.',
    'Decisions': 'You struggle to make choices quickly, leading to procrastination and feeling stuck.',
    'Motivation': 'You know what to do but can\'t seem to get yourself to actually do it.',
    'Planning': 'You have ideas but struggle to organize them into clear, actionable steps.'
  };
  
  const FOCUS_ADVICE: Record<string, string> = {
    'Focus': 'Try the Pomodoro technique: 25 min work, 5 min break. Just one task at a time.',
    'Energy': 'Prioritize sleep and hydration. Consider a short walk or 10-min meditation daily.',
    'Mood': 'Journal for 5 minutes each morning. Track patterns to identify triggers.',
    'Decisions': 'Use the 2-minute rule: If it takes less than 2 minutes, do it now.',
    'Motivation': 'Start with the smallest possible action. Build momentum gradually.',
    'Planning': 'Break big goals into 3 simple steps. Write them down where you\'ll see them.'
  };
  
  const getProgressBarColor = (score: number): string => {
    if (score < 30) return 'bg-green-500';
    if (score < 50) return 'bg-yellow-500';
    if (score < 70) return 'bg-orange-500';
    return 'bg-red-500';
  };
  
  const getScoreColor = (score: number): string => {
    if (score < 30) return 'bg-green-50 text-green-700 border-green-200';
    if (score < 50) return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    if (score < 70) return 'bg-orange-50 text-orange-700 border-orange-200';
    return 'bg-red-50 text-red-700 border-red-200';
  };
  
  export const resultsEmailTemplate = (data: ResultsEmailData) => {
    const { userName, results, highestBlocker } = data;
    const rotation = (highestBlocker.score / 100) * 180 - 90;
  
    return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Your Mental Load Results - Catalyst Care</title>
      <style>
        body {
          font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background-color: #f8fafc;
          margin: 0;
          padding: 0;
          line-height: 1.6;
        }
        .email-container {
          max-width: 600px;
          margin: 40px auto;
          background-color: #ffffff;
        }
        .header {
          background-color: #0c3e6f;
          padding: 30px 20px;
          text-align: center;
          border-radius: 12px 12px 0 0;
        }
        .header h1 {
          color: #ffffff;
          margin: 0;
          font-size: 24px;
          font-weight: 700;
        }
        .header p {
          color: #e0f2fe;
          margin: 8px 0 0 0;
          font-size: 14px;
        }
        .content {
          padding: 30px 20px;
        }
        .section {
          background-color: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
        }
        .section-title {
          font-size: 16px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 15px 0;
        }
        .blocker-item {
          display: flex;
          align-items: center;
          padding: 12px;
          margin-bottom: 10px;
          background-color: #f8fafc;
          border: 1px solid #f1f5f9;
          border-radius: 8px;
        }
        .blocker-name {
          width: 80px;
          font-size: 13px;
          font-weight: 700;
          color: #334155;
        }
        .progress-bar {
          flex: 1;
          height: 8px;
          background-color: #e2e8f0;
          border-radius: 4px;
          overflow: hidden;
          margin: 0 12px;
        }
        .progress-fill {
          height: 100%;
          transition: width 0.3s ease;
        }
        .score-badge {
          font-size: 12px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 12px;
          white-space: nowrap;
        }
        .gauge-container {
          text-align: center;
          padding: 20px 0;
        }
        .gauge-svg {
          width: 200px;
          height: 120px;
          margin: 0 auto;
        }
        .gauge-score {
          font-size: 32px;
          font-weight: 900;
          color: #1e293b;
          margin: 10px 0 5px 0;
        }
        .gauge-label {
          font-size: 11px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .main-blocker {
          background: linear-gradient(135deg, #0c3e6f 0%, #1e40af 100%);
          border-radius: 12px;
          padding: 25px 20px;
          color: #ffffff;
          text-align: center;
          margin-bottom: 20px;
        }
        .main-blocker h2 {
          font-size: 18px;
          margin: 0 0 20px 0;
          font-weight: 700;
        }
        .main-blocker h3 {
          font-size: 22px;
          margin: 15px 0 10px 0;
          font-weight: 900;
        }
        .advice-grid {
          display: table;
          width: 100%;
          margin-top: 20px;
        }
        .advice-item {
          display: table-cell;
          width: 50%;
          padding: 15px;
          vertical-align: top;
        }
        .advice-box {
          background-color: rgba(255, 255, 255, 0.15);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 8px;
          padding: 15px;
          text-align: left;
        }
        .advice-title {
          font-size: 12px;
          font-weight: 700;
          margin: 0 0 8px 0;
          color: #fef3c7;
        }
        .advice-text {
          font-size: 13px;
          margin: 0;
          line-height: 1.5;
          color: #ffffff;
        }
        .legend {
          display: table;
          width: 100%;
          margin-top: 15px;
          padding-top: 15px;
          border-top: 1px solid #f1f5f9;
        }
        .legend-item {
          display: table-cell;
          width: 25%;
          text-align: center;
          padding: 8px;
          font-size: 11px;
          border-radius: 6px;
          font-weight: 700;
        }
        .cta-section {
          text-align: center;
          padding: 20px;
          background-color: #f8fafc;
          border-radius: 12px;
          margin: 20px 0;
        }
        .cta-button {
          display: inline-block;
          padding: 14px 30px;
          background-color: #0c3e6f;
          color: #ffffff;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 700;
          font-size: 15px;
          margin: 10px 5px;
        }
        .footer {
          text-align: center;
          padding: 30px 20px;
          background-color: #f8fafc;
          border-radius: 0 0 12px 12px;
        }
        .footer p {
          color: #64748b;
          font-size: 12px;
          margin: 5px 0;
        }
        @media only screen and (max-width: 600px) {
          .email-container {
            margin: 20px 10px;
          }
          .advice-item {
            display: block;
            width: 100%;
            margin-bottom: 10px;
          }
          .legend-item {
            display: block;
            width: 100%;
            margin-bottom: 5px;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        
        <!-- Header -->
        <div class="header">
          <h1>✨ Your "Stuck Pattern" Overview</h1>
          <p>Hi ${userName}, here are the areas slowing you down the most right now</p>
        </div>
  
        <!-- Content -->
        <div class="content">
          
          <!-- Mental Load Map -->
          <div class="section">
            <h2 class="section-title">📊 Mental Load Map</h2>
            <p style="font-size: 13px; color: #64748b; margin: 0 0 15px 0;">
              Higher score = more difficulty in that area
            </p>
  
            ${results
              .map(
                (item) => `
            <div class="blocker-item">
              <div class="blocker-name">${item.name}</div>
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${item.score}%; background-color: ${
                  item.score < 30
                    ? '#22c55e'
                    : item.score < 50
                    ? '#eab308'
                    : item.score < 70
                    ? '#f97316'
                    : '#ef4444'
                };"></div>
              </div>
              <div class="score-badge" style="${
                item.score < 30
                  ? 'background-color: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0;'
                  : item.score < 50
                  ? 'background-color: #fefce8; color: #a16207; border: 1px solid #fef08a;'
                  : item.score < 70
                  ? 'background-color: #fff7ed; color: #c2410c; border: 1px solid #fed7aa;'
                  : 'background-color: #fef2f2; color: #b91c1c; border: 1px solid #fecaca;'
              }">
                ${item.score} — ${item.label}
              </div>
            </div>
            `
              )
              .join('')}
  
            <!-- Legend -->
            <div class="legend">
              <div class="legend-item" style="background-color: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0;">
                0-29<br/>OK
              </div>
              <div class="legend-item" style="background-color: #fefce8; color: #a16207; border: 1px solid #fef08a;">
                30-49<br/>Mild
              </div>
              <div class="legend-item" style="background-color: #fff7ed; color: #c2410c; border: 1px solid #fed7aa;">
                50-69<br/>High
              </div>
              <div class="legend-item" style="background-color: #fef2f2; color: #b91c1c; border: 1px solid #fecaca;">
                70-100<br/>Very high
              </div>
            </div>
          </div>
  
          <!-- Main Blocker -->
          <div class="main-blocker">
            <h2>⭐ Main Area to Focus On</h2>
  
            <!-- Gauge Chart -->
            <div class="gauge-container">
              <svg class="gauge-svg" viewBox="0 0 200 120">
                <!-- Background arc -->
                <path
                  d="M 20 100 A 80 80 0 0 1 180 100"
                  fill="none"
                  stroke="#e2e8f0"
                  stroke-width="16"
                  stroke-linecap="round"
                />
                
                <!-- Green segment -->
                <path
                  d="M 20 100 A 80 80 0 0 1 60 30"
                  fill="none"
                  stroke="#22c55e"
                  stroke-width="16"
                  stroke-linecap="round"
                />
                
                <!-- Yellow segment -->
                <path
                  d="M 60 30 A 80 80 0 0 1 140 30"
                  fill="none"
                  stroke="#f59e0b"
                  stroke-width="16"
                  stroke-linecap="round"
                />
                
                <!-- Red segment -->
                <path
                  d="M 140 30 A 80 80 0 0 1 180 100"
                  fill="none"
                  stroke="#ef4444"
                  stroke-width="16"
                  stroke-linecap="round"
                />
                
                <!-- Needle -->
                <line
                  x1="100"
                  y1="100"
                  x2="100"
                  y2="50"
                  stroke="#1e293b"
                  stroke-width="3"
                  stroke-linecap="round"
                  transform="rotate(${rotation} 100 100)"
                />
                
                <!-- Center dot -->
                <circle cx="100" cy="100" r="6" fill="#ffffff" stroke="#cbd5e1" stroke-width="2" />
              </svg>
              
              <div class="gauge-score">${highestBlocker.score}</div>
              <div class="gauge-label">${highestBlocker.name}</div>
            </div>
  
            <h3>${highestBlocker.name}</h3>
            <div style="display: inline-block; padding: 6px 14px; background-color: rgba(239, 68, 68, 0.2); border-radius: 16px; font-size: 13px; font-weight: 700; margin: 10px 0;">
              ${highestBlocker.score}/100 — ${highestBlocker.label}
            </div>
  
            <p style="font-size: 14px; margin: 15px 0; opacity: 0.95;">
              Improving this area first usually makes everything else feel easier.
            </p>
  
            <!-- Advice Grid -->
            <div class="advice-grid">
              <div class="advice-item">
                <div class="advice-box">
                  <div class="advice-title">💡 What this means</div>
                  <div class="advice-text">${CONTEXT_EXPLANATIONS[highestBlocker.name]}</div>
                </div>
              </div>
              <div class="advice-item">
                <div class="advice-box">
                  <div class="advice-title">✅ First step</div>
                  <div class="advice-text">${FOCUS_ADVICE[highestBlocker.name]}</div>
                </div>
              </div>
            </div>
          </div>
  
          <!-- CTA Section -->
          <div class="cta-section">
            <p style="font-size: 15px; color: #334155; font-weight: 600; margin: 0 0 15px 0;">
              Ready to get unstuck?
            </p>
            <a href="https://catalystcare.in/book-session" class="cta-button">
               Talk to an Expert
            </a>
            <a href="https://catalystcare.in/programs" class="cta-button" style="background-color: #16a34a;">
               Get Guided Support
            </a>
          </div>
  
        </div>
  
        <!-- Footer -->
        <div class="footer">
          <p style="font-weight: 600; color: #0c3e6f; font-size: 14px;">
            Catalyst Care
          </p>
          <p>
            © ${new Date().getFullYear()} Catalyst Care - Your Partner in Mental Wellness
          </p>
          <p>
            Empowering minds, nurturing souls
          </p>
          <a href="https://catalystcare.in" style="color: #16B7C2; text-decoration: none; font-weight: 600;">
            Visit Our Platform →
          </a>
        </div>
  
      </div>
    </body>
  </html>
    `;
  };