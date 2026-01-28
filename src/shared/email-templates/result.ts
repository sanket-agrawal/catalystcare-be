import { serverConfig } from "../config/server.config";

interface BlockerResult {
  name: string;
  score?: number;
  label: string;
}

interface ResultsEmailData {
  assessmentTitle: string;
  results: BlockerResult[];
  highestBlocker: BlockerResult;
  contextExplanation: string;
  focusAdvice: string;
}

/* ------------------ Score Utilities ------------------ */

const normalizeScore = (score?: number): number => {
  if (typeof score !== "number" || isNaN(score)) return 0;
  return Math.max(0, Math.min(100, Math.round(score)));
};

const getBarColor = (score?: number) => {
  const s = normalizeScore(score);
  if (s < 30) return "#22c55e";
  if (s < 50) return "#eab308";
  if (s < 70) return "#f97316";
  return "#ef4444";
};

const getBadgeStyle = (score?: number) => {
  const s = normalizeScore(score);
  if (s < 30) return "background:#ecfdf5;color:#065f46;border:1px solid #a7f3d0;";
  if (s < 50) return "background:#fffbeb;color:#92400e;border:1px solid #fde68a;";
  if (s < 70) return "background:#fff7ed;color:#9a3412;border:1px solid #fed7aa;";
  return "background:#fef2f2;color:#991b1b;border:1px solid #fecaca;";
};

/* ------------------ Template Generator ------------------ */

export const generateResultsEmailHTML = (data: ResultsEmailData): string => {
  const {
    assessmentTitle,
    results,
    highestBlocker,
    contextExplanation,
    focusAdvice
  } = data;

  const year = new Date().getFullYear();

  const resultsRows = results.map(item => {
    const score = normalizeScore(item.score);

    return `
      <tr>
        <td style="padding:10px 0;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="120" style="font-size:13px;font-weight:600;color:#1e293b;">
                ${item.name}
              </td>

              <td>
                <table width="100%" cellpadding="0" cellspacing="0"
                  style="background:#e5e7eb;border-radius:6px;">
                  <tr>
                    <td width="${score}%" style="
                      height:8px;
                      background:${getBarColor(score)};
                      border-radius:6px;
                    "></td>
                    <td></td>
                  </tr>
                </table>
              </td>

              <td width="130" align="right">
                <span style="
                  display:inline-block;
                  padding:4px 10px;
                  border-radius:12px;
                  font-size:12px;
                  font-weight:600;
                  ${getBadgeStyle(score)}
                ">
                  ${score} — ${item.label}
                </span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `;
  }).join("");

  const focusScore = normalizeScore(highestBlocker.score);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>${assessmentTitle} Results</title>
</head>

<body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="padding:20px;">
  <tr>
    <td align="center">

      <table width="600" cellpadding="0" cellspacing="0"
        style="background:#ffffff;border-radius:14px;overflow:hidden;">



        <!-- Header -->
        <tr>
  <td
    style="background:#0c3e6f;padding:28px;text-align:center;"
    align="center"
  >
    <img
      src="${serverConfig.baseFrontendUrl}/assets/favicon.ico"
      alt="Catalyst Care"
      width="120"
      align="center"
      style="display:block;margin:0 auto;"
    />

    <h1 style="margin:12px 0 0;color:#ffffff;font-size:22px;text-align:center;">
      ${assessmentTitle}
    </h1>

    <p style="margin:8px 0 0;color:#e0f2fe;font-size:14px;text-align:center;">
      Hello, here’s your personalized snapshot
    </p>
  </td>
</tr>


        <!-- Content -->
        <tr>
          <td style="padding:24px;">

            <!-- Assessment Map -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
              <tr>
                <td style="font-size:16px;font-weight:700;color:#1e293b;padding-bottom:8px;">
                  Assessment Map
                </td>
              </tr>
              ${resultsRows}
            </table>

            <!-- Score Guide -->
            <table width="100%" style="margin-bottom:24px;">
              <tr>
                <td style="font-size:12px;color:#475569;">
                  <strong>Score guide:</strong><br/>
                  <span style="color:#22c55e;">0–29 OK</span> ·
                  <span style="color:#eab308;">30–49 Mild</span> ·
                  <span style="color:#f97316;">50–69 High</span> ·
                  <span style="color:#ef4444;">70–100 Very high</span>
                </td>
              </tr>
            </table>

            <!-- Main Focus -->
            <table width="100%" style="background:#0c3e6f;border-radius:12px;margin-bottom:24px;">
              <tr>
                <td style="padding:22px;color:#ffffff;text-align:center;">
                  <p style="font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:0;">
                    Main Area to Focus On
                  </p>
                  <h2 style="margin:10px 0 4px;font-size:22px;">
                    ${highestBlocker.name}
                  </h2>
                  <p style="margin:0;font-size:14px;font-weight:600;">
                    ${focusScore} / 100 — ${highestBlocker.label}
                  </p>

                  <table width="100%" style="margin-top:14px;background:#1e40af;border-radius:6px;">
                    <tr>
                      <td width="${focusScore}%" style="
                        height:10px;
                        background:#f97316;
                        border-radius:6px;
                      "></td>
                      <td></td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- Insight -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr>
                <td width="50%" style="padding:6px;">
                  <table width="100%" style="background:#f1f5f9;border-radius:8px;">
                    <tr>
                      <td style="padding:14px;">
                        <strong style="font-size:13px;">What this means</strong>
                        <p style="margin:8px 0 0;font-size:13px;color:#334155;">
                          ${contextExplanation}
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>

                <td width="50%" style="padding:6px;">
                  <table width="100%" style="background:#f1f5f9;border-radius:8px;">
                    <tr>
                      <td style="padding:14px;">
                        <strong style="font-size:13px;">First step</strong>
                        <p style="margin:8px 0 0;font-size:13px;color:#334155;">
                          ${focusAdvice}
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- CTAs -->
            <table width="100%">
              <tr>
                <td align="center" style="padding:8px;">
                  <a href="https://catalystcare.in/book-session"
                    style="display:inline-block;padding:12px 22px;border:1px solid #0c3e6f;
                    color:#0c3e6f;text-decoration:none;border-radius:8px;font-weight:600;">
                    Talk to an expert
                  </a>
                </td>
                <td align="center" style="padding:8px;">
                  <a href="https://catalystcare.in/guided-support"
                    style="display:inline-block;padding:12px 22px;background:#0c3e6f;
                    color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;">
                    Guided support
                  </a>
                </td>
              </tr>
            </table>

          </td>
        </tr>

        <!-- Footer -->
         <tr>
                <td align="center" style="background-color: #f3f4f6; padding: 12px; 
                    font-size: 13px; color: #555;">
                  © Catalyst Care |
                  <a href="${serverConfig.baseFrontendUrl}" 
                     style="color: #007bff; text-decoration: none;">${serverConfig.baseFrontendUrl}</a>
                </td>
              </tr>

      </table>

    </td>
  </tr>
</table>

</body>
</html>
`;
};
