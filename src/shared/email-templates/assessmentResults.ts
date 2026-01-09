import { serverConfig } from "../config/server.config";

export const assessmentResultTemplate = (
  name: string | undefined,
  assessmentTitle: string,
  result: {
    burnoutIndex: number;
    dominant: string;
    label: string;
    insight: string;
    dimensions?: {
      energy: number;
      mental: number;
      disengagement: number;
    };
  }
) => {
  const greeting = name ? `Hi ${name},` : `Hello,`;

  const progressWidth = Math.min(Math.max(result.burnoutIndex, 0), 100);

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
 <tr style="text-align:center;">
                    <td style="padding:14px 0 20px;font-size:28px;font-weight:600;">
                        <span style="color:#123B66;">Catalyst</span><span style="color:#16B7C2;">Care</span>
                    </td>
                </tr>

<!-- CONTENT -->
<tr>
<td style="padding:32px 36px;color:#111827;">

<p style="font-size:16px;margin:0 0 12px;">
${greeting}
</p>

<p style="font-size:15px;line-height:1.6;margin:0 0 20px;color:#374151;">
Your <strong>${assessmentTitle}</strong> assessment is complete.  
Here’s a clear breakdown of what your responses indicate.
</p>

<!-- RESULT LABEL -->
<h2 style="margin:0 0 6px;color:#4f46e5;font-size:22px;">
${result.label}
</h2>

<p style="margin:0 0 18px;font-size:14px;color:#6b7280;">
Primary driver: <strong>${result.dominant}</strong>
</p>

<!-- SCORE BAR -->
<p style="margin:0 0 6px;font-size:14px;">
<strong>Burnout Index:</strong> ${result.burnoutIndex} / 100
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
${result.insight}
</td>
</tr>
</table>

<!-- DIMENSIONS -->
${
  result.dimensions
    ? `
<h3 style="margin:0 0 12px;font-size:16px;">
Score Breakdown
</h3>

<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
<tr>
<td style="padding:8px 0;font-size:14px;">Energy Depletion</td>
<td align="right" style="font-size:14px;"><strong>${result.dimensions.energy}/100</strong></td>
</tr>
<tr>
<td style="padding:8px 0;font-size:14px;">Mental Load</td>
<td align="right" style="font-size:14px;"><strong>${result.dimensions.mental}/100</strong></td>
</tr>
<tr>
<td style="padding:8px 0;font-size:14px;">Disengagement</td>
<td align="right" style="font-size:14px;"><strong>${result.dimensions.disengagement}/100</strong></td>
</tr>
</table>
`
    : ``
}

<!-- SCORE MEANING -->
<h3 style="margin:0 0 12px;font-size:16px;">
What your score means
</h3>

<table width="100%" cellpadding="0" cellspacing="0"
       style="font-size:14px;color:#374151;margin-bottom:32px;">
<tr>
<td style="padding:6px 0;"><strong>0–24:</strong> Energy Stable</td>
</tr>
<tr>
<td style="padding:6px 0;"><strong>25–44:</strong> Running Low</td>
</tr>
<tr>
<td style="padding:6px 0;"><strong>45–64:</strong> Mental Overload</td>
</tr>
<tr>
<td style="padding:6px 0;"><strong>65–100:</strong> Burnout Mode</td>
</tr>
</table>

<!-- CTA -->
<a href="${serverConfig.baseFrontendUrl}" target="_blank"
   style="display:inline-block;padding:14px 22px;
          background:#4f46e5;color:#ffffff;
          font-size:15px;font-weight:500;
          text-decoration:none;border-radius:8px;">
Talk to an expert about my results
</a>

<p style="margin-top:28px;font-size:14px;color:#6b7280;line-height:1.6;">
This assessment is a self-reflection tool, not a diagnosis.  
If you’re feeling overwhelmed, professional support can help.
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

