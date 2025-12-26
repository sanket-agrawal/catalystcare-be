import { serverConfig } from "../config/server.config";

export const assessmentResultTemplate = (
  name: string | undefined,
  assessmentTitle: string,
  result: {
    burnoutIndex: number;
    dominant: string;
    label: string;
    insight: string;
  }
) => {
  const greeting = name ? `Hi ${name},` : `Hello,`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Your ${assessmentTitle} Results</title>
</head>
<body style="margin:0;padding:0;font-family:Roboto,Arial,sans-serif;background:#f7f7f7;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:30px 0;">
<tr>
<td align="center">
<table width="600" style="background:#ffffff;border-radius:10px;overflow:hidden;">
<tr>
<td align="center" style="padding:20px;">
<img src="${serverConfig.baseFrontendUrl}/assets/favicon.ico" width="120" />
</td>
</tr>

<tr>
<td style="padding:30px;">
<p style="font-size:16px;">${greeting}</p>

<p style="font-size:15px;">
Your <strong>${assessmentTitle}</strong> results are ready.
</p>

<h2 style="color:#4f46e5;margin-top:10px;">
${result.label}
</h2>

<p style="font-size:15px;margin-top:6px;">
<strong>Burnout Index:</strong> ${result.burnoutIndex}/100
</p>

<p style="font-size:15px;">
<strong>Main driver:</strong> ${result.dominant}
</p>

<div style="background:#f9fafb;padding:16px;border-radius:6px;margin-top:20px;">
<p style="margin:0;font-size:15px;color:#111827;">
${result.insight}
</p>
</div>

<a href="${serverConfig.baseFrontendUrl}" target="_blank"
   style="display:inline-block;margin-top:24px;padding:12px 20px;
   background:#4f46e5;color:#ffffff;text-decoration:none;border-radius:6px;">
Talk to an expert about my results
</a>

<p style="margin-top:20px;">
Warm regards,<br/>
<strong>Catalyst Care Team</strong>
</p>
</td>
</tr>

<tr>
<td align="center" style="background:#f3f4f6;padding:12px;font-size:13px;">
© Catalyst Care
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
