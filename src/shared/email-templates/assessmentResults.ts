// assessmentResultTemplate.ts
// Fixes applied:
//   FIX 3 — Top 2 most affected zones shown at top of email with insight + direction
//   All zones still shown in full breakdown table below

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
    key: string;
    title: string;
    scaledScore: number;
    label: string;
  };

  zones: Array<{
    key: string;
    title: string;
    scaledScore: number;
    label: string;
  }>;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function scoreBarHtml(score: number, color = "#4f46e5"): string {
  const w = Math.min(Math.max(score, 0), 100);
  return `
<table width="100%" cellpadding="0" cellspacing="0"
       style="background:#e5e7eb;border-radius:6px;height:10px;margin-bottom:6px;">
  <tr>
    <td width="${w}%" style="background:${color};border-radius:6px;height:10px;"></td>
    <td width="${100 - w}%"></td>
  </tr>
</table>`;
}

// FIX 3 — renders a top-zone card with insight text + direction only (concise for email)
function topZoneCardHtml(
  zone: { key: string; title: string; scaledScore: number; label: string },
  rank: number,
  content: ZoneBandContent | null,
  bandLabel: string
): string {
  const rankLabel =
    rank === 0 ? "Your most affected area" : "Second most affected area";

  // Accent colour: deeper indigo for #1, softer teal for #2
  const accentColor = rank === 0 ? "#4f46e5" : "#0891b2";

  return `
<table width="100%" cellpadding="0" cellspacing="0"
       style="border-left:4px solid ${accentColor};
              background:#f9fafb;border-radius:0 8px 8px 0;
              margin-bottom:28px;">
  <tr>
    <td style="padding:18px 20px;">

      <!-- Rank label -->
      <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#6b7280;
                text-transform:uppercase;letter-spacing:0.06em;">
        ${rankLabel}
      </p>

      <!-- Zone title + score -->
      <h3 style="margin:0 0 2px;font-size:18px;color:${accentColor};">
        ${zone.title}
      </h3>
      <p style="margin:0 0 12px;font-size:13px;color:#6b7280;">
        ${zone.scaledScore}/100 &mdash; ${bandLabel}
      </p>

      <!-- Score bar -->
      ${scoreBarHtml(zone.scaledScore, accentColor)}
      <p style="margin:0 0 14px;"></p>

      ${
        content
          ? `
      <!-- Insight -->
      <p style="margin:0 0 10px;font-size:15px;line-height:1.65;color:#111827;">
        ${content.insight}
      </p>

      <!-- Direction -->
      <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#6b7280;
                text-transform:uppercase;letter-spacing:0.06em;">
        What to do
      </p>
      <p style="margin:0;font-size:15px;line-height:1.65;color:#111827;">
        ${content.direction}
      </p>`
          : `<p style="margin:0;font-size:15px;line-height:1.65;color:#374151;">
               This area is currently asking for the most attention.
             </p>`
      }

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

  // ─────────────────────────────────────────────
  // FIX 3 — derive top 2 zones by scaledScore descending
  // ─────────────────────────────────────────────
  const topTwoZones = [...zones]
    .sort((a, b) => b.scaledScore - a.scaledScore)
    .slice(0, 2);

  const topZonesHtml = topTwoZones
    .map((zone, idx) => {
      const band = getScoreBand(zone.scaledScore);
      const bandLabel =
        config?.zones[zone.key]?.bands[band]?.label ?? zone.label;
      const content = getZoneContent(assessmentSlug, zone.key, zone.scaledScore);
      return topZoneCardHtml(zone, idx, content, bandLabel);
    })
    .join("");

  // ─────────────────────────────────────────────
  // Full breakdown table (all zones)
  // ─────────────────────────────────────────────
  const zoneRowsHtml = zones
    .map((z) => {
      const band = getScoreBand(z.scaledScore);
      const labelFromConfig =
        config?.zones[z.key]?.bands[band]?.label ?? z.label;
      return `
<tr>
  <td style="padding:10px 0;font-size:14px;color:#374151;
             border-bottom:1px solid #f3f4f6;">
    ${z.title}
  </td>
  <td align="right"
      style="padding:10px 0;font-size:14px;border-bottom:1px solid #f3f4f6;
             white-space:nowrap;">
    <strong style="color:#111827;">${z.scaledScore}/100</strong>
    <span style="color:#6b7280;margin-left:6px;">(${labelFromConfig})</span>
  </td>
</tr>`;
    })
    .join("");

  // Scale legend
  const legendRowsHtml = scaleLegend
    .map(
      (row) => `
<tr>
  <td style="padding:5px 0;font-size:14px;color:#374151;">
    <strong>${row.range}:</strong> ${row.label}
  </td>
</tr>`
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Your ${assessmentTitle} Results</title>
</head>

<body style="margin:0;padding:0;background:#f4f6fb;font-family:Roboto,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 0;">
<tr>
<td align="center">

<!-- MAIN CARD -->
<table width="600" cellpadding="0" cellspacing="0"
       style="background:#ffffff;border-radius:12px;overflow:hidden;
              box-shadow:0 8px 24px rgba(0,0,0,0.06);">

<!-- HEADER -->
<tr>
<td style="padding:18px 0;text-align:center;font-size:28px;font-weight:600;">
  <span style="color:#123B66;">Catalyst</span><span style="color:#16B7C2;">Care</span>
</td>
</tr>

<!-- CONTENT -->
<tr>
<td style="padding:32px 36px;color:#111827;">

  <!-- REPORT HEADLINE -->
  <h2 style="margin:0 0 8px;font-size:22px;color:#111827;">
    ${reportHeadline}
  </h2>
  <p style="margin:0 0 28px;font-size:15px;line-height:1.6;color:#374151;">
    ${reportSubheadline}
  </p>

  <!-- ── FIX 3: TOP 2 MOST AFFECTED ZONES ── -->
  ${topZonesHtml}

  <!-- DIVIDER -->
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
    <tr>
      <td style="border-top:1px solid #e5e7eb;"></td>
    </tr>
  </table>

  <!-- FULL SCORE BREAKDOWN -->
  <h3 style="margin:0 0 4px;font-size:16px;color:#111827;">
    Your Full Score Breakdown
  </h3>
  <p style="margin:0 0 14px;font-size:14px;color:#6b7280;">
    All areas are shown below with their current intensity level.
  </p>

  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
    ${zoneRowsHtml}
  </table>

  <!-- SCALE LEGEND -->
  <h3 style="margin:0 0 12px;font-size:16px;color:#111827;">
    How to read these scores
  </h3>
  <table width="100%" cellpadding="0" cellspacing="0"
         style="font-size:14px;color:#374151;margin-bottom:32px;">
    ${legendRowsHtml}
  </table>

  <!-- CTA -->
  <a href="${serverConfig.baseFrontendUrl}" target="_blank"
     style="display:inline-block;padding:14px 22px;
            background:#4f46e5;color:#ffffff;
            font-size:15px;font-weight:500;
            text-decoration:none;border-radius:8px;">
    Talk to a CatalystCare expert
  </a>

  <p style="margin-top:28px;font-size:14px;color:#6b7280;line-height:1.6;">
    This assessment is a self-reflection tool, not a diagnosis.
    Support can help if these areas feel heavy right now.
  </p>

  <p style="margin-top:24px;font-size:14px;">
    Warm regards,<br/>
    <strong>Catalyst Care Team</strong>
  </p>

</td>
</tr>

<!-- FOOTER -->
<tr>
<td align="center"
    style="background:#f3f4f6;padding:14px;font-size:12px;color:#6b7280;">
  &copy; ${new Date().getFullYear()} Catalyst Care. All rights reserved.
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