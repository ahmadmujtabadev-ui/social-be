export function baseEmailTemplate(innerHtml) {
    return `
  <!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <title>Canvastry</title>
      <style>
        body { background:#f6f8fb; margin:0; padding:24px; font-family:Arial,Helvetica,sans-serif; }
        .card { max-width:560px; margin:0 auto; background:#ffffff; border-radius:12px; padding:24px; }
        h1,h2,h3 { margin:0 0 12px; }
        p { margin:0 0 12px; color:#333; line-height:1.5; }
        .btn { display:inline-block; padding:10px 16px; border-radius:8px; background:#ef3d2a; color:#fff !important; text-decoration:none; }
        .footer { color:#888; font-size:12px; margin-top:16px; text-align:center; }
        .otp { font-size:28px; font-weight:700; letter-spacing:2px; padding:12px 16px; background:#f2f4f7; border-radius:8px; display:inline-block; }
      </style>
    </head>
    <body>
      <div class="card">
        ${innerHtml}
        <div class="footer">
          If you didn’t request this, you can ignore this email.
        </div>
      </div>
    </body>
  </html>`;
}

export function otpBlock(otp, purposeLabel = 'verification code') {
    return `
    <h2>Your ${purposeLabel}</h2>
    <p>Use the code below within the next 10 minutes:</p>
    <div class="otp">${otp}</div>
  `;
}