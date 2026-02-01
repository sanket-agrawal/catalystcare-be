

import { serverConfig } from "../config/server.config";

export interface AssessmentResultEmailPayload {
  name?: string;
  assessmentTitle: string;

  primaryZone: {
    key: string;
    title: string;
    scaledScore: number;
    label: string;
    insight: string;
  };

  zones: Array<{
    key: string;
    title: string;
    scaledScore: number;
    label: string;
  }>;
}


export const assessmentResultTemplate = (
  payload: AssessmentResultEmailPayload
) => {
  const {
    assessmentTitle,
    primaryZone,
    zones
  } = payload;

  const progressWidth = Math.min(
    Math.max(primaryZone.scaledScore, 0),
    100
  );

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

<p style="font-size:15px;line-height:1.6;margin:0 0 22px;color:#374151;">
Your <strong>${assessmentTitle}</strong> assessment is complete.  
Below is a clear snapshot of how things are showing up for you right now.
</p>

<!-- PRIMARY RESULT -->
<h2 style="margin:0 0 6px;color:#4f46e5;font-size:22px;">
${primaryZone.label}
</h2>

<p style="margin:0 0 18px;font-size:14px;color:#6b7280;">
Primary focus area: <strong>${primaryZone.title}</strong>
</p>

<!-- PRIMARY SCORE BAR -->
<p style="margin:0 0 6px;font-size:14px;">
<strong>${primaryZone.title}:</strong> ${primaryZone.scaledScore} / 100
</p>

<table width="100%" cellpadding="0" cellspacing="0"
       style="background:#e5e7eb;border-radius:6px;height:10px;margin-bottom:20px;">
<tr>
<td width="${progressWidth}%" style="background:#4f46e5;border-radius:6px;"></td>
<td width="${100 - progressWidth}%"></td>
</tr>
</table>

<!-- INSIGHT -->
<table width="100%" cellpadding="0" cellspacing="0"
       style="background:#f9fafb;border-radius:8px;margin-bottom:28px;">
<tr>
<td style="padding:16px 18px;font-size:15px;line-height:1.6;color:#111827;">
${primaryZone.insight}
</td>
</tr>
</table>

<!-- ZONE BREAKDOWN -->
<h3 style="margin:0 0 12px;font-size:16px;">
Your Full Score Breakdown
</h3>

<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
${zones
  .map(
    z => `
<tr>
<td style="padding:8px 0;font-size:14px;">
${z.title}
</td>
<td align="right" style="font-size:14px;">
<strong>${z.scaledScore}/100</strong>
<span style="color:#6b7280;">(${z.label})</span>
</td>
</tr>
`
  )
  .join("")}
</table>

<!-- SCORE LEGEND -->
<h3 style="margin:0 0 12px;font-size:16px;">
How to read these scores
</h3>

<table width="100%" cellpadding="0" cellspacing="0"
       style="font-size:14px;color:#374151;margin-bottom:32px;">
<tr><td style="padding:6px 0;"><strong>0–29:</strong> Not a significant concern</td></tr>
<tr><td style="padding:6px 0;"><strong>30–49:</strong> Mild strain</td></tr>
<tr><td style="padding:6px 0;"><strong>50–69:</strong> Active strain</td></tr>
<tr><td style="padding:6px 0;"><strong>70–100:</strong> Strong strain</td></tr>
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


