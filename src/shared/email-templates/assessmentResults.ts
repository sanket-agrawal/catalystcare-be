// assessmentResultTemplate.ts
// Updated to show per-zone Insight, What this means, and Direction
// based on the score band. Pulls content from assessmentInsights config.

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
  assessmentSlug: string; // NEW — needed to look up insights config

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
// Small helpers
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

function insightBlockHtml(content: ZoneBandContent): string {
  return `
<table width="100%" cellpadding="0" cellspacing="0"
       style="background:#f9fafb;border-radius:8px;margin-bottom:28px;">
  <tr>
    <td style="padding:18px 20px;">

      <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#6b7280;
                text-transform:uppercase;letter-spacing:0.06em;">Insight</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#111827;">
        ${content.insight}
      </p>

      <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#6b7280;
                text-transform:uppercase;letter-spacing:0.06em;">What this means</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#111827;">
        ${content.meaning}
      </p>

      <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#6b7280;
                text-transform:uppercase;letter-spacing:0.06em;">Direction</p>
      <p style="margin:0;font-size:15px;line-height:1.65;color:#111827;">
        ${content.direction}
      </p>

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
  const { assessmentTitle, assessmentSlug, primaryZone, zones } = payload;

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

  // Primary zone content (Insight / What this means / Direction)
  const primaryContent = getZoneContent(
    assessmentSlug,
    primaryZone.key,
    primaryZone.scaledScore
  );

  // Zone breakdown rows
  const zoneRowsHtml = zones
    .map((z) => {
      const band = getScoreBand(z.scaledScore);
      const labelFromConfig =
        config?.zones[z.key]?.bands[band]?.label ?? z.label;
      return `
<tr>
  <td style="padding:10px 0;font-size:14px;color:#374151;border-bottom:1px solid #f3f4f6;">
    ${z.title}
  </td>
  <td align="right"
      style="padding:10px 0;font-size:14px;border-bottom:1px solid #f3f4f6;white-space:nowrap;">
    <strong style="color:#111827;">${z.scaledScore}/100</strong>
    <span style="color:#6b7280;margin-left:6px;">(${labelFromConfig})</span>
  </td>
</tr>`;
    })
    .join("");

  // Scale legend rows
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

  <!-- PRIMARY ZONE HEADER -->
  <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#6b7280;
            text-transform:uppercase;letter-spacing:0.06em;">Primary focus area</p>
  <h3 style="margin:0 0 4px;font-size:20px;color:#4f46e5;">
    ${primaryZone.title}
  </h3>
  <p style="margin:0 0 14px;font-size:14px;color:#6b7280;">
    ${primaryZone.scaledScore}/100 — ${
    config?.zones[primaryZone.key]?.bands[getScoreBand(primaryZone.scaledScore)]
      ?.label ?? primaryZone.label
  }
  </p>

  <!-- PRIMARY SCORE BAR -->
  ${scoreBarHtml(primaryZone.scaledScore)}
  <p style="margin:0 0 20px;"></p>

  <!-- PRIMARY ZONE INSIGHT BLOCK -->
  ${
    primaryContent
      ? insightBlockHtml(primaryContent)
      : `<p style="margin:0 0 28px;font-size:15px;line-height:1.6;color:#374151;">
           This area is currently asking for the most care and attention.
         </p>`
  }

  <!-- ZONE BREAKDOWN -->
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
<td align="center" style="background:#f3f4f6;padding:14px;font-size:12px;color:#6b7280;">
  © ${new Date().getFullYear()} Catalyst Care. All rights reserved.
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