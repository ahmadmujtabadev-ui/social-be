// src/utils/vendorNotificationEmails.js
import { env } from "../config/env.js";
import { sendEmail } from "./sendEmail.js";

const ADMIN_EMAIL = "ahmadmujtabadev@gmail.com";

/**
 * Theme tokens (BLACK theme)
 * Update these anytime to rebrand quickly.
 */
const THEME = {
  headerGradient: "linear-gradient(135deg, #111827 0%, #000000 100%)",
  headerTitle: "#ffffff",
  headerSub: "#e5e7eb",

  pageBg: "#f3f4f6",
  cardBg: "#ffffff",
  border: "#e5e7eb",

  text: "#111827",
  muted: "#6b7280",
  muted2: "#9ca3af",

  link: "#2563eb",

  // Primary (black) CTA button
  ctaBg: "#111827",
  ctaShadow: "0 4px 6px rgba(17, 24, 39, 0.25)",

  // Pricing box (neutral, no gold)
  priceBg: "#f3f4f6",
  priceBorder: "#111827",
  priceText: "#111827",

  // Success
  successBg: "#978a42ff",
  successBorder: "#10b981",
  successText: "#065f46",
  successSubText: "#047857",
};

/**
 * Base email template for vendor-related emails
 */
function vendorEmailTemplate({
  title,
  messageLines = [],
  buttonLabel,
  buttonHref,
  highlightColor = THEME.ctaBg,
}) {
  const messageHtml = messageLines
    .map(
      (line) =>
        `<p style="margin:0 0 8px 0; font-size:14px; line-height:1.5; color:${THEME.text};">${line}</p>`
    )
    .join("");

  const safeHref = buttonHref || env.BASE_URL || "#";

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
  </head>
  <body style="margin:0; padding:0; background-color:${THEME.pageBg}; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:600px; background:${THEME.cardBg}; border-radius:12px; box-shadow:0 4px 6px rgba(0,0,0,0.1); overflow:hidden;">
            <tr>
              <td style="padding:24px 32px; border-bottom:1px solid ${THEME.border}; background:${THEME.headerGradient};">
                <h1 style="margin:0; font-size:22px; font-weight:700; color:${THEME.headerTitle};">Vendor Registration System</h1>
                <p style="margin:6px 0 0 0; font-size:13px; color:${THEME.headerSub};">Event Booth Management Platform</p>
              </td>
            </tr>

            <tr>
              <td style="padding:32px;">
                <h2 style="margin:0 0 16px 0; font-size:18px; font-weight:600; color:${THEME.text};">${title}</h2>
                ${messageHtml}
                ${
                  buttonLabel && safeHref
                    ? `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:24px;">
                        <tr>
                          <td align="center">
                            <a href="${safeHref}" style="display:inline-block; padding:12px 28px; background-color:${highlightColor}; color:#ffffff; text-decoration:none; border-radius:8px; font-size:14px; font-weight:600; box-shadow:0 2px 4px rgba(0,0,0,0.1);">
                              ${buttonLabel}
                            </a>
                          </td>
                        </tr>
                      </table>`
                    : ""
                }
              </td>
            </tr>

            <tr>
              <td style="padding:20px 32px; border-top:1px solid ${THEME.border}; background-color:#f9fafb;">
                <p style="margin:0 0 6px 0; font-size:12px; color:${THEME.muted}; line-height:1.5;">
                  This is an automated notification from your vendor registration system.
                </p>
                <p style="margin:0; font-size:12px; color:${THEME.muted2};">
                  © ${new Date().getFullYear()} Event Management Platform. All rights reserved.
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/**
 * Send vendor submission notification to admin
 */
export async function sendVendorSubmissionToAdmin(vendorData) {
  const {
    vendorId,
    vendorName,
    personName,
    email,
    phone,
    category,
    boothNumber,
    isOakville,
    selectedEvent,
    pricing,
    foodItems,
    clothingType,
    jewelryType,
    craftDetails,
    needPower,
    watts,
    instagram,
    facebook,
    notes,
    submittedAt,
  } = vendorData;

  const subject = `New Vendor Application: ${vendorName} (Booth #${boothNumber})`;

  // Category-specific details (removed gold from Food Vendor box)
  let categoryDetails = "";
  switch (category) {
    case "Food Vendor":
      categoryDetails = `
        <div style="background:${THEME.priceBg}; border-left:4px solid ${THEME.priceBorder}; padding:12px 16px; margin:12px 0; border-radius:6px;">
          <strong style="color:${THEME.text};">Food Items:</strong> ${foodItems || "N/A"}<br/>
          ${
            needPower
              ? `<strong style="color:${THEME.text};">Power Required:</strong> Yes (${watts || "N/A"}W)`
              : `<strong style="color:${THEME.text};">Power Required:</strong> No`
          }
        </div>`;
      break;

    case "Clothing Vendor":
      categoryDetails = `
        <div style="background:#dbeafe; border-left:4px solid #3b82f6; padding:12px 16px; margin:12px 0; border-radius:6px;">
          <strong style="color:#1e40af;">Clothing Type:</strong> ${clothingType || "N/A"}
        </div>`;
      break;

    case "Jewelry Vendor":
      categoryDetails = `
        <div style="background:#fae8ff; border-left:4px solid #a855f7; padding:12px 16px; margin:12px 0; border-radius:6px;">
          <strong style="color:#6b21a8;">Jewelry Type:</strong> ${jewelryType || "N/A"}
        </div>`;
      break;

    case "Craft Booth":
      categoryDetails = `
        <div style="background:#dcfce7; border-left:4px solid #10b981; padding:12px 16px; margin:12px 0; border-radius:6px;">
          <strong style="color:#065f46;">Craft Details:</strong> ${craftDetails || "N/A"}<br/>
          ${
            needPower
              ? `<strong style="color:#065f46;">Power Required:</strong> Yes (${watts || "N/A"}W)`
              : `<strong style="color:#065f46;">Power Required:</strong> No`
          }
        </div>`;
      break;
  }

  const socialLinks = [];
  if (instagram) socialLinks.push(`Instagram: @${instagram}`);
  if (facebook) socialLinks.push(`Facebook: ${facebook}`);

  const socialsHtml =
    socialLinks.length > 0
      ? `<p style="margin:8px 0;"><strong>Social Media:</strong> ${socialLinks.join(
          " | "
        )}</p>`
      : "";

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>New Vendor Application</title>
  </head>
  <body style="margin:0; padding:0; background-color:${THEME.pageBg}; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:650px; background:${THEME.cardBg}; border-radius:12px; box-shadow:0 4px 6px rgba(0,0,0,0.1); overflow:hidden;">

            <tr>
              <td style="padding:28px 32px; background:${THEME.headerGradient};">
                <h1 style="margin:0; font-size:24px; font-weight:700; color:${THEME.headerTitle};">New Vendor Application</h1>
                <p style="margin:8px 0 0 0; font-size:14px; color:${THEME.headerSub};">A new vendor has submitted an application for booth registration</p>
              </td>
            </tr>

            <tr>
              <td style="padding:20px 32px 0 32px;">
                <div padding:16px; border-radius:8px;">
                  <p font-weight:600; font-size:15px;">Application Submitted Successfully</p>
                  <p style="margin:6px 0 0 0; color:${THEME.successSubText}; font-size:13px;">Submitted on: ${submittedAt || new Date().toLocaleString()}</p>
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding:24px 32px;">
                <h2 style="margin:0 0 16px 0; font-size:18px; font-weight:600; color:${THEME.text}; border-bottom:2px solid ${THEME.border}; padding-bottom:8px;">
                  Vendor Information
                </h2>

                <table style="width:100%; border-collapse:collapse;">
                  <tr>
                    <td style="padding:10px 0; border-bottom:1px solid #f3f4f6;">
                      <strong style="color:${THEME.muted}; font-size:13px;">Business Name:</strong>
                    </td>
                    <td style="padding:10px 0; border-bottom:1px solid #f3f4f6; text-align:right;">
                      <span style="color:${THEME.text}; font-weight:600; font-size:14px;">${vendorName}</span>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:10px 0; border-bottom:1px solid #f3f4f6;">
                      <strong style="color:${THEME.muted}; font-size:13px;">Contact Person:</strong>
                    </td>
                    <td style="padding:10px 0; border-bottom:1px solid #f3f4f6; text-align:right;">
                      <span style="color:${THEME.text}; font-size:14px;">${personName}</span>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:10px 0; border-bottom:1px solid #f3f4f6;">
                      <strong style="color:${THEME.muted}; font-size:13px;">Email:</strong>
                    </td>
                    <td style="padding:10px 0; border-bottom:1px solid #f3f4f6; text-align:right;">
                      <a href="mailto:${email}" style="color:${THEME.link}; text-decoration:none; font-size:14px;">${email}</a>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:10px 0; border-bottom:1px solid #f3f4f6;">
                      <strong style="color:${THEME.muted}; font-size:13px;">Phone:</strong>
                    </td>
                    <td style="padding:10px 0; border-bottom:1px solid #f3f4f6; text-align:right;">
                      <a href="tel:${phone}" style="color:${THEME.link}; text-decoration:none; font-size:14px;">${phone}</a>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:10px 0; border-bottom:1px solid #f3f4f6;">
                      <strong style="color:${THEME.muted}; font-size:13px;">Oakville-based:</strong>
                    </td>
                    <td style="padding:10px 0; border-bottom:1px solid #f3f4f6; text-align:right;">
                      <span style="color:${THEME.text}; font-size:14px;">${isOakville ? "Yes" : "No"}</span>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:10px 0;">
                      <strong style="color:${THEME.muted}; font-size:13px;">Event Type:</strong>
                    </td>
                    <td style="padding:10px 0; text-align:right;">
                      <span style="display:inline-block; background:#e5e7eb; color:${THEME.text}; padding:4px 12px; border-radius:12px; font-size:12px; font-weight:600;">
                        ${selectedEvent || "N/A"}
                      </span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:0 32px 24px 32px;">
                <h2 style="margin:0 0 16px 0; font-size:18px; font-weight:600; color:${THEME.text}; border-bottom:2px solid ${THEME.border}; padding-bottom:8px;">
                  Booth & Category
                </h2>

                <div style="background:#f9fafb; border:2px solid ${THEME.border}; padding:16px; border-radius:8px; margin-bottom:16px;">
                  <table style="width:100%;">
                    <tr>
                      <td style="width:50%; padding:8px;">
                        <span style="font-size:24px; font-weight:800; color:${THEME.text};">#${boothNumber}</span>
                      </td>
                      <td style="width:50%; padding:8px; text-align:right;">
                        <strong style="color:${THEME.muted}; font-size:13px;">Category:</strong><br/>
                        <span style="font-size:18px; font-weight:700; color:${THEME.text};">${category}</span>
                      </td>
                    </tr>
                  </table>
                </div>

                ${categoryDetails}
                ${socialsHtml}
              </td>
            </tr>

            ${
              notes
                ? `
                <tr>
                  <td style="padding:0 32px 24px 32px;">
                    <h2 style="margin:0 0 12px 0; font-size:18px; font-weight:600; color:${THEME.text};">
                      Additional Notes
                    </h2>
                    <div style="background:#f9fafb; border:1px solid ${THEME.border}; padding:16px; border-radius:8px;">
                      <p style="margin:0; color:#374151; font-size:14px; line-height:1.6; font-style:italic;">${notes}</p>
                    </div>
                  </td>
                </tr>
              `
                : ""
            }

            <tr>
              <td style="padding:20px 32px; border-top:1px solid ${THEME.border}; background-color:#f9fafb; text-align:center;">
                <p style="margin:0 0 6px 0; font-size:12px; color:${THEME.muted};">
                  This is an automated notification from your vendor management system.
                </p>
                <p style="margin:0; font-size:11px; color:${THEME.muted2};">
                  Vendor ID: ${vendorId}
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  try {
    await sendEmail({ to: ADMIN_EMAIL, subject, html: htmlContent });
    console.log(`Admin notification sent for vendor: ${vendorName} (Booth #${boothNumber})`);
  } catch (error) {
    console.error("Failed to send admin notification:", error);
  }
}

/**
 * Send confirmation email to vendor after successful submission
 */
export async function sendVendorConfirmationEmail(vendorData) {
  const { vendorName, personName, email, category, boothNumber, pricing } = vendorData;

  const subject = `Vendor Application Received - Booth #${boothNumber}`;

  const messageLines = [
    `Dear <strong>${personName}</strong>,`,
    `Thank you for submitting your vendor application for <strong>${vendorName}</strong>!`,
    `Your application has been successfully received and is currently under review.`,
    `<br/><strong>Application Details:</strong>`,
    `• Category: <strong>${category}</strong>`,
    `• Amount: <strong>$${(pricing?.final || 0).toFixed(2)}</strong>`,
    pricing?.promoCode ? `• Promo Code Applied: <strong>${pricing.promoCode}</strong>` : "",
    `<br/>Your booth is reserved for the next <strong>48 hours</strong>. We'll send you payment instructions and next steps via email shortly.`,
    `If you have any questions, please don't hesitate to contact us.`,
  ].filter(Boolean);

  const html = vendorEmailTemplate({
    title: "Application Received Successfully!",
    messageLines,
    buttonLabel: "View Your Application",
    // FIX: use env (not ENV)
    buttonHref: `${env.BASE_URL || "#"}\/vendor\/status`,
    // Black CTA for vendor email too (or keep green if you want)
    highlightColor: THEME.ctaBg,
  });

  try {
    await sendEmail({ to: email, subject, html });
    console.log(`Confirmation email sent to vendor: ${email}`);
  } catch (error) {
    console.error(`Failed to send confirmation email to ${email}:`, error);
  }
}

/**
 * Send both admin and vendor emails for a new vendor submission
 */
export async function sendVendorSubmissionEmails(vendorData) {
  await Promise.all([
    sendVendorSubmissionToAdmin(vendorData),
    sendVendorConfirmationEmail(vendorData),
  ]);
}
