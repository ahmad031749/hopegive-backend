import nodemailer from "nodemailer";
import { env } from "./env";

export const mailer = nodemailer.createTransport({
  host: env.smtp.host,
  port: env.smtp.port,
  secure: env.smtp.port === 465,
  auth: { user: env.smtp.user, pass: env.smtp.pass },
});

export async function sendReceiptEmail(opts: {
  to: string;
  donorName: string;
  amount: number;
  currency: string;
  cause: string;
  frequency: string;
  donationId: string;
}) {
  const { to, donorName, amount, currency, cause, frequency, donationId } = opts;
  const symbol = currency === "PKR" ? "₨" : currency === "EUR" ? "€" : "$";
  const formattedAmt = `${symbol}${amount.toFixed(2)}`;

  await mailer.sendMail({
    from: env.smtp.from,
    to,
    subject: `Thank you for your donation — HopeBridge`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;color:#141A26">
        <div style="background:#0E7C66;padding:24px 32px;border-radius:12px 12px 0 0">
          <h1 style="color:white;font-size:24px;margin:0">HopeBridge</h1>
        </div>
        <div style="padding:32px;border:1px solid #E5E7EB;border-top:none;border-radius:0 0 12px 12px">
          <h2 style="margin:0 0 16px">Thank you, ${donorName}! 🎉</h2>
          <p style="color:#4B5563;line-height:1.6">
            Your generous donation has been received. Here are the details:
          </p>
          <table style="width:100%;border-collapse:collapse;margin:20px 0">
            <tr style="border-bottom:1px solid #E5E7EB">
              <td style="padding:10px 0;color:#6B7280;font-size:14px">Donation ID</td>
              <td style="padding:10px 0;font-weight:600;font-size:14px">#${donationId}</td>
            </tr>
            <tr style="border-bottom:1px solid #E5E7EB">
              <td style="padding:10px 0;color:#6B7280;font-size:14px">Amount</td>
              <td style="padding:10px 0;font-weight:600;font-size:14px;color:#0E7C66">${formattedAmt} ${currency}</td>
            </tr>
            <tr style="border-bottom:1px solid #E5E7EB">
              <td style="padding:10px 0;color:#6B7280;font-size:14px">Cause</td>
              <td style="padding:10px 0;font-weight:600;font-size:14px">${cause}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;color:#6B7280;font-size:14px">Frequency</td>
              <td style="padding:10px 0;font-weight:600;font-size:14px;text-transform:capitalize">${frequency}</td>
            </tr>
          </table>
          <p style="color:#4B5563;font-size:14px;line-height:1.6">
            This donation is tax-deductible. HopeBridge is a registered 501(c)(3) nonprofit (EIN 12-3456789).
            Keep this email as your official tax receipt.
          </p>
          <p style="color:#4B5563;font-size:14px;margin-top:24px">
            You will receive your first impact report within 30 days. Thank you for changing lives. 💚
          </p>
          <div style="margin-top:32px;padding-top:24px;border-top:1px solid #E5E7EB;color:#9CA3AF;font-size:12px">
            HopeBridge Foundation · 501(c)(3) EIN 12-3456789<br/>
            Questions? Reply to this email or visit hopebridge.org
          </div>
        </div>
      </div>
    `,
  });
}
