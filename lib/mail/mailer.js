import nodemailer from 'nodemailer'
import { getAdminBasePath } from '@/lib/admin/config'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.hostinger.com',
  port: Number(process.env.SMTP_PORT) || 465,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

const defaultFrom = process.env.SMTP_FROM || 'Nexzen <noreply@nexzenindia.com>'
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.nexzenindia.com'
const adminBasePath = getAdminBasePath()

function buildEmailHtml({ preheader, title, description, content, buttonHref, buttonText }) {
  return `
<div style="margin:0;padding:32px;background:#eef4ff;font-family:Segoe UI,Arial,sans-serif;color:#0f172a;">
  <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:28px;overflow:hidden;box-shadow:0 24px 80px rgba(15,23,42,0.12);">
    <div style="padding:28px 32px;background:radial-gradient(circle at top,#2155ff 0%,#0f172a 62%,#020617 100%);color:#ffffff;text-align:center;">
      <div style="width:88px;height:88px;margin:0 auto 18px;border-radius:22px;background:#020617;display:flex;align-items:center;justify-content:center;overflow:hidden;box-shadow:0 12px 28px rgba(2,6,23,0.35);">
        <img
          src="https://wqnjxafgzldzqpazzxaw.supabase.co/storage/v1/object/public/brand-assets/Logo.png"
          alt="Nexzen"
          style="width:100%;height:100%;object-fit:cover;display:block;transform:scale(1.12);"
        />
      </div>

      <p style="margin:0;font-size:12px;letter-spacing:0.28em;text-transform:uppercase;color:#bfdbfe;">
        ${preheader}
      </p>
      <h1 style="margin:16px 0 0;font-size:34px;line-height:1.2;font-weight:700;color:#ffffff !important;text-shadow:0 2px 10px rgba(15,23,42,0.35);">
        ${title}
      </h1>
      <p style="margin:14px auto 0;max-width:460px;font-size:16px;line-height:1.7;color:#dbeafe;">
        ${description}
      </p>
    </div>

    <div style="padding:36px 32px;text-align:center;">
      ${content}

      <div style="margin-top:32px;">
        <a
          href="${buttonHref}"
          style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:999px;font-weight:600;font-size:15px;box-shadow:0 8px 24px rgba(15,23,42,0.12);"
        >
          ${buttonText}
        </a>
      </div>
    </div>
  </div>
</div>
  `.trim()
}

export async function sendOrderPendingEmail(toEmail, orderId, orderTotal) {
  const html = buildEmailHtml({
    preheader: 'Order Received',
    title: 'Order is Pending',
    description: 'We have received your order details and it is currently waiting for confirmation.',
    content: `
      <p style="margin:0 0 14px;font-size:15px;line-height:1.7;color:#475569;">
        Thank you for choosing Nexzen!
      </p>
      <div style="display:inline-block;margin:8px 0 22px;padding:18px 28px;border-radius:20px;background:#f8fafc;border:1px solid #dbeafe;">
        <span style="font-size:24px;font-weight:700;color:#0f172a;">
          Order #${orderId.slice(-6)}
        </span>
        <div style="margin-top:8px;font-size:16px;color:#475569;">Total: ₹${orderTotal}</div>
      </div>
      <p style="margin:0;font-size:15px;line-height:1.8;color:#475569;">
        You will receive another email as soon as our team confirms the order and prepares it for shipment.
      </p>
    `,
    buttonHref: `${siteUrl}/active-orders`,
    buttonText: 'View Active Orders'
  })

  await transporter.sendMail({
    from: defaultFrom,
    to: toEmail,
    subject: 'Your Nexzen Order is Pending Confirmation',
    html,
  })
}

export async function sendAdminNewOrderEmail(orderId, customerEmail, orderTotal) {
  const html = buildEmailHtml({
    preheader: 'Admin Alert',
    title: 'New Order Received',
    description: 'A customer has just placed a new order. It requires your confirmation.',
    content: `
      <p style="margin:0 0 14px;font-size:15px;line-height:1.7;color:#475569;">
        Customer: <strong>${customerEmail}</strong>
      </p>
      <div style="display:inline-block;margin:8px 0 22px;padding:18px 28px;border-radius:20px;background:#f8fafc;border:1px solid #dbeafe;">
        <span style="font-size:24px;font-weight:700;color:#0f172a;">
          Order #${orderId.slice(-6)}
        </span>
        <div style="margin-top:8px;font-size:16px;color:#475569;">Total: ₹${orderTotal}</div>
      </div>
      <p style="margin:0;font-size:15px;line-height:1.8;color:#475569;">
        Log into the admin control room to accept or reject this request.
      </p>
    `,
    buttonHref: `${siteUrl}/nexzen-control-room/orders`,
    buttonText: 'Manage Orders'
  })

  await transporter.sendMail({
    from: defaultFrom,
    to: process.env.SMTP_USER || 'noreply@nexzenindia.com',
    subject: `New Order Alert: #${orderId.slice(-6)}`,
    html,
  })
}

export async function sendOrderConfirmedEmail(toEmail, orderId, orderTotal) {
  const html = buildEmailHtml({
    preheader: 'Order Confirmed',
    title: 'Ready for Shipment',
    description: 'Great news! Your order has been confirmed and is being prepared for dispatch.',
    content: `
      <p style="margin:0 0 14px;font-size:15px;line-height:1.7;color:#475569;">
        Your products are officially secured!
      </p>
      <div style="display:inline-block;margin:8px 0 22px;padding:18px 28px;border-radius:20px;background:#f8fafc;border:1px solid #10b981;">
        <span style="font-size:24px;font-weight:700;color:#0f172a;">
          Order #${orderId.slice(-6)}
        </span>
        <div style="margin-top:8px;font-size:16px;color:#475569;">Total: ₹${orderTotal}</div>
      </div>
      <p style="margin:0;font-size:15px;line-height:1.8;color:#475569;">
        You can track your shipment details right from your account profile.
      </p>
    `,
    buttonHref: `${siteUrl}/active-orders`,
    buttonText: 'Track Order'
  })

  await transporter.sendMail({
    from: defaultFrom,
    to: toEmail,
    subject: 'Your Nexzen Order is Confirmed!',
    html,
  })
}

export async function sendAdminOtpEmail(toEmail, username, otpCode) {
  const html = buildEmailHtml({
    preheader: 'Admin OTP',
    title: 'Your Admin Login Code',
    description: 'Use this one-time code to finish your admin sign-in.',
    content: `
      <p style="margin:0 0 14px;font-size:15px;line-height:1.7;color:#475569;">
        Username: <strong>${username}</strong>
      </p>
      <div style="display:inline-block;margin:8px 0 22px;padding:18px 28px;border-radius:20px;background:#f8fafc;border:1px solid #dbeafe;">
        <span style="font-size:28px;font-weight:700;color:#0f172a;letter-spacing:0.24em;">
          ${otpCode}
        </span>
        <div style="margin-top:8px;font-size:14px;color:#475569;">This code expires in 10 minutes.</div>
      </div>
      <p style="margin:0;font-size:15px;line-height:1.8;color:#475569;">
        If you did not request this code, ignore this email and review admin access logs.
      </p>
    `,
    buttonHref: `${siteUrl}${adminBasePath}/login`,
    buttonText: 'Return to Admin Login',
  })

  await transporter.sendMail({
    from: defaultFrom,
    to: toEmail,
    subject: 'Nexzen Admin OTP Code',
    html,
  })
}

export async function sendAdminPasswordResetEmail(toEmail, username, token) {
  const resetHref = `${siteUrl}${adminBasePath}/login?mode=reset&token=${encodeURIComponent(token)}&username=${encodeURIComponent(username)}`
  const html = buildEmailHtml({
    preheader: 'Admin Password Reset',
    title: 'Reset Your Admin Password',
    description: 'A password reset was requested for your admin account.',
    content: `
      <p style="margin:0 0 14px;font-size:15px;line-height:1.7;color:#475569;">
        Username: <strong>${username}</strong>
      </p>
      <p style="margin:0;font-size:15px;line-height:1.8;color:#475569;">
        This link expires in 30 minutes and can only be used once.
      </p>
    `,
    buttonHref: resetHref,
    buttonText: 'Reset Admin Password',
  })

  await transporter.sendMail({
    from: defaultFrom,
    to: toEmail,
    subject: 'Reset Your Nexzen Admin Password',
    html,
  })
}

export async function sendBackInStockEmail(toEmail, product) {
  const productHref = `${siteUrl}/p/${encodeURIComponent(product.slug || product.id)}`
  const html = buildEmailHtml({
    preheader: 'Back In Stock',
    title: `${product.name} is back`,
    description: 'A product you asked us to watch is available again.',
    content: `
      <p style="margin:0 0 14px;font-size:15px;line-height:1.7;color:#475569;">
        Good news. <strong>${product.name}</strong> is back in stock and ready to order.
      </p>
      <div style="display:inline-block;margin:8px 0 22px;padding:18px 28px;border-radius:20px;background:#f8fafc;border:1px solid #dbeafe;">
        <span style="font-size:24px;font-weight:700;color:#0f172a;">
          ${product.name}
        </span>
        <div style="margin-top:8px;font-size:16px;color:#475569;">Current price: Rs. ${Number(product.price || 0).toLocaleString('en-IN')}</div>
      </div>
      <p style="margin:0;font-size:15px;line-height:1.8;color:#475569;">
        Inventory can move quickly on popular boards and kits, so this is the best time to grab it.
      </p>
    `,
    buttonHref: productHref,
    buttonText: 'View Product',
  })

  await transporter.sendMail({
    from: defaultFrom,
    to: toEmail,
    subject: `${product.name} is back in stock at Nexzen`,
    html,
  })
}
