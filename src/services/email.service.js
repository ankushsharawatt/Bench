require("dotenv").config();
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    type: "OAuth2",
    user: process.env.EMAIL_USER,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN,
  },
});

// Verify connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.error("Error connecting to email server:", error);
  } else {
    console.log("Email server is ready to send messages");
  }
});

// Generic sender function
const sendEmail = async (to, subject, text, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"BENCH" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });

    console.log("Message sent: %s", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

// 1. Registration email
async function sendRegisteredEmail(userEmail, name) {
  const subject = "Welcome to BENCH!";
  const text = `Hello ${name},\n\nThank you for registering with BENCH. We are excited to have you on board!`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <h2>Welcome to BENCH, ${name}!</h2>
      <p>Thank you for registering. Your account is now active.</p>
      <p>If you have any questions, feel free to reach out to our support team.</p>
    </div>
  `;

  return await sendEmail(userEmail, subject, text, html);
}

// 2. Transaction notification email
async function sendTransactionEmail(userEmail, name, amount, toAccount) {
  const subject = "Transaction Confirmation - BENCH";
  const formattedDate = new Date().toLocaleString();

  const text = `Hello ${name},\n\nYour transaction of $${amount} to account ending in ${toAccount.slice(-4)} was successful on ${formattedDate}.\n\nThank you for using BENCH.`;

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px;">
      <h2 style="color: #2c3e50;">Transaction Successful</h2>
      <p>Hello <strong>${name}</strong>,</p>
      <p>Your transfer has been processed successfully. Here are the details:</p>
      
      <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
        <tr style="border-bottom: 1px solid #ddd;">
          <td style="padding: 8px 0; font-weight: bold;">Amount:</td>
          <td style="padding: 8px 0;">₹${amount}</td>
        </tr>
        <tr style="border-bottom: 1px solid #ddd;">
          <td style="padding: 8px 0; font-weight: bold;">Recipient Account:</td>
          <td style="padding: 8px 0;">****${String(toAccount).slice(-4)}</td>
        </tr>
        <tr style="border-bottom: 1px solid #ddd;">
          <td style="padding: 8px 0; font-weight: bold;">Date & Time:</td>
          <td style="padding: 8px 0;">${formattedDate}</td>
        </tr>
      </table>

      <p style="margin-top: 20px; font-size: 0.9em; color: #777;">
        If you did not authorize this transaction, please contact support immediately.
      </p>
    </div>
  `;

  return await sendEmail(userEmail, subject, text, html);
}
// 3. Failed transaction notification email
async function sendTransactionFailedEmail(userEmail, name, amount, toAccount, reason = "Payment processing error") {
  const subject = "Transaction Failed - BENCH";
  const formattedDate = new Date().toLocaleString();
  const maskedAccount = String(toAccount).length > 4 
    ? `****${String(toAccount).slice(-4)}` 
    : toAccount;

  const text = `Hello ${name},\n\nYour transaction of $${amount} to account ${maskedAccount} could not be completed on ${formattedDate}.\nReason: ${reason}\n\nNo funds were deducted. If you need assistance, please contact support.`;

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px;">
      <h2 style="color: #c0392b;">Transaction Failed</h2>
      <p>Hello <strong>${name}</strong>,</p>
      <p>We were unable to process your transaction. Here are the details:</p>
      
      <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
        <tr style="border-bottom: 1px solid #ddd;">
          <td style="padding: 8px 0; font-weight: bold;">Attempted Amount:</td>
          <td style="padding: 8px 0;">$${amount}</td>
        </tr>
        <tr style="border-bottom: 1px solid #ddd;">
          <td style="padding: 8px 0; font-weight: bold;">Recipient Account:</td>
          <td style="padding: 8px 0;">${maskedAccount}</td>
        </tr>
        <tr style="border-bottom: 1px solid #ddd;">
          <td style="padding: 8px 0; font-weight: bold;">Reason:</td>
          <td style="padding: 8px 0; color: #c0392b;">${reason}</td>
        </tr>
        <tr style="border-bottom: 1px solid #ddd;">
          <td style="padding: 8px 0; font-weight: bold;">Date & Time:</td>
          <td style="padding: 8px 0;">${formattedDate}</td>
        </tr>
      </table>

      <p style="margin-top: 15px; padding: 10px; background-color: #fdf2f2; border-left: 4px solid #c0392b; color: #7f1d1d; font-size: 0.95em;">
        <strong>Note:</strong> If money was debited from your account, it will be refunded automatically within 3–5 business days.
      </p>

      <p style="margin-top: 20px; font-size: 0.9em; color: #777;">
        Need help? Reply directly to this email or visit our help center.
      </p>
    </div>
  `;

  return await sendEmail(userEmail, subject, text, html);
}

module.exports = {
  sendEmail,
  sendRegisteredEmail,
  sendTransactionEmail,
  sendTransactionFailedEmail,
};
