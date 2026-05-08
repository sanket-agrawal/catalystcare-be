// assessmentResultTemplate.ts
// - Uses configKey (not key) for all insight lookups — fixes null content
// - Elegant email design with gradient header, styled cards, clean typography

import { serverConfig } from "../config/server.config";
import {
  getZoneContent,
  getAssessmentConfig,
  getScoreBand,
  ZoneBandContent,
} from "../insights/Assessments";

export interface AssessmentResultEmailPayload {
  name?: string;
  assessmentTitle: string;
  assessmentSlug: string;

  primaryZone: {
    key: string;        // DB key e.g. "EMOTIONAL_EXPRESSION"
    configKey: string;  // config key e.g. "emotional_expression"
    title: string;
    scaledScore: number;
    label: string;
  };

  zones: Array<{
    key: string;
    configKey: string;  // used for all config/insight lookups
    title: string;
    scaledScore: number;
    label: string;
  }>;
}

// ─────────────────────────────────────────────
// Score bar
// ─────────────────────────────────────────────
function scoreBarHtml(score: number, color: string): string {
  const w = Math.min(Math.max(score, 0), 100);
  return `
<table width="100%" cellpadding="0" cellspacing="0"
       style="background:#e5e7eb;border-radius:99px;height:8px;margin:10px 0 16px;">
  <tr>
    <td width="${w}%"
        style="background:${color};border-radius:99px;height:8px;"></td>
    <td width="${100 - w}%"></td>
  </tr>
</table>`;
}

// ─────────────────────────────────────────────
// Band colour helper
// ─────────────────────────────────────────────
function bandColor(score: number): string {
  if (score < 30) return "#10b981"; // green  — not a concern
  if (score < 50) return "#f59e0b"; // amber  — mild
  if (score < 70) return "#f97316"; // orange — active
  return "#ef4444";                 // red    — strong
}

// ─────────────────────────────────────────────
// Top zone card (rank 0 = primary, rank 1 = secondary)
// Uses configKey for insight lookup
// ─────────────────────────────────────────────
function topZoneCardHtml(
  zone: { configKey: string; title: string; scaledScore: number },
  rank: number,
  content: ZoneBandContent | null,
  bandLabel: string
): string {
  const isPrimary = rank === 0;
  const accentColor = isPrimary ? "#4f46e5" : "#0891b2";
  const rankLabel = isPrimary ? "Most affected area" : "Second most affected area";
  const barColor = bandColor(zone.scaledScore);

  // Direction always available — content is guaranteed non-null at call site
  // but we guard anyway for safety
  const insightText = content?.insight ?? "";
  const directionText = content?.direction ?? "";

  return `
<table width="100%" cellpadding="0" cellspacing="0"
       style="margin-bottom:20px;border-radius:10px;overflow:hidden;
              border:1px solid #e5e7eb;">
  <tr>
    <!-- Coloured left accent bar -->
    <td width="4" style="background:${accentColor};border-radius:10px 0 0 10px;"></td>
    <td style="padding:20px 22px;background:#ffffff;">

      <!-- Rank pill -->
      <table cellpadding="0" cellspacing="0" style="margin-bottom:10px;">
        <tr>
          <td style="background:${accentColor}18;border-radius:99px;
                     padding:3px 10px;font-size:11px;font-weight:700;
                     color:${accentColor};text-transform:uppercase;
                     letter-spacing:0.07em;">
            ${rankLabel}
          </td>
        </tr>
      </table>

      <!-- Zone title -->
      <p style="margin:0 0 2px;font-size:18px;font-weight:700;color:#111827;
                line-height:1.3;">
        ${zone.title}
      </p>

      <!-- Score + label -->
      <p style="margin:0;font-size:13px;color:#6b7280;">
        Score: <strong style="color:#111827;">${zone.scaledScore}/100</strong>
        &nbsp;&middot;&nbsp;
        <span style="color:${barColor};font-weight:600;">${bandLabel}</span>
      </p>

      <!-- Score bar -->
      ${scoreBarHtml(zone.scaledScore, barColor)}

      ${insightText ? `
      <!-- Insight -->
      <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#374151;">
        ${insightText}
      </p>` : ""}

      ${directionText ? `
      <!-- Direction box -->
      <table width="100%" cellpadding="0" cellspacing="0"
             style="background:${accentColor}0d;border-radius:8px;">
        <tr>
          <td style="padding:12px 16px;">
            <p style="margin:0 0 4px;font-size:11px;font-weight:700;
                      color:${accentColor};text-transform:uppercase;
                      letter-spacing:0.07em;">
              What to do
            </p>
            <p style="margin:0;font-size:14px;line-height:1.7;color:#1f2937;">
              ${directionText}
            </p>
          </td>
        </tr>
      </table>` : ""}

    </td>
  </tr>
</table>`;
}

// ─────────────────────────────────────────────
// Main template
// ─────────────────────────────────────────────
export const assessmentResultTemplate = (
  payload: AssessmentResultEmailPayload
): string => {
  const { assessmentTitle, assessmentSlug, zones } = payload;

  const config = getAssessmentConfig(assessmentSlug);

  const scaleLegend = config?.scaleLegend ?? [
    { range: "0–29", label: "Not a significant concern" },
    { range: "30–49", label: "Mild strain" },
    { range: "50–69", label: "Active strain" },
    { range: "70–100", label: "Strong strain" },
  ];

  const reportHeadline = config?.reportHeadline ?? assessmentTitle;
  const reportSubheadline =
    config?.reportSubheadline ??
    "Below is a clear snapshot of how things are showing up for you right now.";

  // ── Top 2 zones sorted by scaledScore desc ──
  const topTwoZones = [...zones]
    .sort((a, b) => b.scaledScore - a.scaledScore)
    .slice(0, 2);

  const topZonesHtml = topTwoZones
    .map((zone, idx) => {
      const band = getScoreBand(zone.scaledScore);
      // KEY FIX: use configKey not key for all lookups
      const bandLabel =
        config?.zones[zone.configKey]?.bands[band]?.label ?? zone.label;
      const content = getZoneContent(assessmentSlug, zone.configKey, zone.scaledScore);
      return topZoneCardHtml(zone, idx, content, bandLabel);
    })
    .join("");

  // ── Full breakdown rows ──
  const zoneRowsHtml = zones
    .map((z) => {
      const band = getScoreBand(z.scaledScore);
      const labelFromConfig =
        config?.zones[z.configKey]?.bands[band]?.label ?? z.label;
      const barColor = bandColor(z.scaledScore);
      return `
<tr>
  <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;">
    <p style="margin:0;font-size:14px;font-weight:600;color:#111827;">
      ${z.title}
    </p>
    <table width="100%" cellpadding="0" cellspacing="0"
           style="background:#e5e7eb;border-radius:99px;height:6px;margin-top:6px;">
      <tr>
        <td width="${z.scaledScore}%"
            style="background:${barColor};border-radius:99px;height:6px;"></td>
        <td width="${100 - z.scaledScore}%"></td>
      </tr>
    </table>
  </td>
  <td align="right" style="padding:12px 0 12px 16px;border-bottom:1px solid #f3f4f6;
                            white-space:nowrap;vertical-align:top;">
    <span style="font-size:14px;font-weight:700;color:#111827;">
      ${z.scaledScore}/100
    </span><br/>
    <span style="font-size:12px;color:${barColor};font-weight:600;">
      ${labelFromConfig}
    </span>
  </td>
</tr>`;
    })
    .join("");

  // ── Legend rows ──
  const legendColors = ["#10b981", "#f59e0b", "#f97316", "#ef4444"];
  const legendRowsHtml = scaleLegend
    .map(
      (row, i) => `
<tr>
  <td style="padding:4px 0;font-size:13px;color:#374151;">
    <span style="display:inline-block;width:10px;height:10px;border-radius:50%;
                 background:${legendColors[i] ?? "#6b7280"};
                 margin-right:8px;vertical-align:middle;"></span>
    <strong>${row.range}</strong> &nbsp;${row.label}
  </td>
</tr>`
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Your ${assessmentTitle} Results</title>
</head>

<body style="margin:0;padding:0;background:#f0f2f8;
             font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0 60px;">
<tr><td align="center">

<!-- ═══════════════════════════════════════════
     OUTER CARD
════════════════════════════════════════════ -->
<table width="600" cellpadding="0" cellspacing="0"
       style="background:#ffffff;border-radius:16px;overflow:hidden;
              box-shadow:0 4px 32px rgba(0,0,0,0.08);">

  <!-- ── GRADIENT HEADER ── -->
  <tr>
    <td style="background:linear-gradient(135deg,#1e1b4b 0%,#312e81 50%,#1e40af 100%);
               padding:32px 36px 28px;text-align:center;">

      <!-- Wordmark -->
      <p style="margin:0 0 20px;font-size:26px;font-weight:800;letter-spacing:-0.5px;">
        <span style="color:#ffffff;">Catalyst</span><span style="color:#67e8f9;">Care</span>
      </p>

      <!-- Report headline -->
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;
                 color:#ffffff;line-height:1.3;">
        ${reportHeadline}
      </h1>
      <p style="margin:0;font-size:14px;color:#c7d2fe;line-height:1.6;
                max-width:440px;margin:0 auto;">
        ${reportSubheadline}
      </p>

    </td>
  </tr>

  <!-- ── BODY ── -->
  <tr>
    <td style="padding:36px 36px 0;">

      <!-- Section label -->
      <p style="margin:0 0 16px;font-size:12px;font-weight:700;color:#6b7280;
                text-transform:uppercase;letter-spacing:0.08em;">
        Areas needing attention
      </p>

      <!-- TOP 2 ZONE CARDS -->
      ${topZonesHtml}

      <!-- ── DIVIDER ── -->
      <table width="100%" cellpadding="0" cellspacing="0"
             style="margin:8px 0 28px;">
        <tr>
          <td style="border-top:1px solid #e5e7eb;"></td>
        </tr>
      </table>

      <!-- ── FULL BREAKDOWN ── -->
      <p style="margin:0 0 4px;font-size:16px;font-weight:700;color:#111827;">
        Full Score Breakdown
      </p>
      <p style="margin:0 0 16px;font-size:13px;color:#6b7280;">
        All areas with their current intensity level.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0"
             style="margin-bottom:28px;">
        ${zoneRowsHtml}
      </table>

      <!-- ── LEGEND ── -->
      <table width="100%" cellpadding="0" cellspacing="0"
             style="background:#f9fafb;border-radius:10px;margin-bottom:32px;">
        <tr>
          <td style="padding:16px 20px;">
            <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#374151;">
              How to read these scores
            </p>
            <table cellpadding="0" cellspacing="0">
              ${legendRowsHtml}
            </table>
          </td>
        </tr>
      </table>

    </td>
  </tr>

  <!-- ── CTA BAND ── -->
  <tr>
    <td style="padding:0 36px 36px;">
      <table width="100%" cellpadding="0" cellspacing="0"
             style="background:linear-gradient(135deg,#4f46e5,#0891b2);
                    border-radius:12px;overflow:hidden;">
        <tr>
          <td style="padding:24px 28px;">
            <p style="margin:0 0 4px;font-size:16px;font-weight:700;color:#ffffff;">
              Want to understand this better?
            </p>
            <p style="margin:0 0 16px;font-size:13px;color:#e0e7ff;line-height:1.6;">
              A CatalystCare expert can help you work through what these results mean for you.
            </p>
            <a href="${serverConfig.baseFrontendUrl}" target="_blank"
               style="display:inline-block;padding:11px 22px;
                      background:#ffffff;color:#4f46e5;
                      font-size:14px;font-weight:700;
                      text-decoration:none;border-radius:8px;">
              Talk to an expert &rarr;
            </a>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ── DISCLAIMER ── -->
  <tr>
    <td style="padding:0 36px 28px;">
      <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.7;
                border-top:1px solid #f3f4f6;padding-top:20px;">
        This assessment is a self-reflection tool, not a clinical diagnosis.
        If these areas feel persistently heavy, speaking with a professional can help.
      </p>
    </td>
  </tr>

  <!-- ── FOOTER ── -->
  <tr>
    <td style="background:#f9fafb;padding:16px 36px;
               border-top:1px solid #e5e7eb;text-align:center;">
      <p style="margin:0;font-size:12px;color:#9ca3af;">
        &copy; ${new Date().getFullYear()} Catalyst Care &nbsp;&middot;&nbsp;
        Warm regards, <strong style="color:#6b7280;">The Catalyst Care Team</strong>
      </p>
    </td>
  </tr>

</table>

</td></tr>
</table>
</body>
</html>
`;
};