import { getDisplayOrderId } from '@/lib/commerce/orders'

export function buildInvoiceHtml(order) {
  const displayId = order.displayId || getDisplayOrderId(order)
  const itemsHtml = (order.items || [])
    .map(
      (item) => `
        <tr>
          <td style="padding:12px;border-bottom:1px solid #e2e8f0;">${item.product?.name || 'Product'}</td>
          <td style="padding:12px;border-bottom:1px solid #e2e8f0;text-align:center;">${item.quantity}</td>
          <td style="padding:12px;border-bottom:1px solid #e2e8f0;text-align:right;">Rs. ${Number(item.price || 0).toLocaleString('en-IN')}</td>
          <td style="padding:12px;border-bottom:1px solid #e2e8f0;text-align:right;">Rs. ${(Number(item.price || 0) * Number(item.quantity || 0)).toLocaleString('en-IN')}</td>
        </tr>
      `
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Invoice ${displayId}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:32px;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a;">
  <div style="max-width:860px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:24px;overflow:hidden;">
    <div style="padding:28px 32px;background:#020617;color:#ffffff;">
      <div style="font-size:12px;letter-spacing:0.3em;text-transform:uppercase;color:#93c5fd;">Nexzen Invoice</div>
      <h1 style="margin:12px 0 0;font-size:34px;">${displayId}</h1>
      <p style="margin:10px 0 0;color:#cbd5e1;">Issued on ${new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
    </div>
    <div style="padding:32px;">
      <div style="display:flex;gap:24px;flex-wrap:wrap;margin-bottom:24px;">
        <div style="flex:1;min-width:240px;">
          <h2 style="font-size:13px;letter-spacing:0.18em;text-transform:uppercase;color:#64748b;">Billed To</h2>
          <p style="margin:10px 0 0;font-size:15px;line-height:1.7;">
            <strong>${order.customerName || 'Customer'}</strong><br/>
            ${order.customerEmail || ''}<br/>
            ${order.phone || ''}<br/>
            ${[order.addressLine1, order.addressLine2, order.city, order.state, order.pincode].filter(Boolean).join(', ')}
          </p>
        </div>
        <div style="flex:1;min-width:240px;">
          <h2 style="font-size:13px;letter-spacing:0.18em;text-transform:uppercase;color:#64748b;">Payment</h2>
          <p style="margin:10px 0 0;font-size:15px;line-height:1.7;">
            Method: <strong>${order.paymentMethod || 'N/A'}</strong><br/>
            Status: <strong>${order.paymentStatus || 'N/A'}</strong><br/>
            Tracking: ${order.trackingNumber || 'Pending'}
          </p>
        </div>
      </div>

      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead>
          <tr style="background:#f8fafc;text-align:left;">
            <th style="padding:12px;">Item</th>
            <th style="padding:12px;text-align:center;">Qty</th>
            <th style="padding:12px;text-align:right;">Unit Price</th>
            <th style="padding:12px;text-align:right;">Line Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div style="margin-top:28px;margin-left:auto;max-width:320px;">
        <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #e2e8f0;">
          <span>Subtotal</span>
          <strong>Rs. ${Number(order.total || 0).toLocaleString('en-IN')}</strong>
        </div>
        <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #e2e8f0;">
          <span>Discount</span>
          <strong>${order.discountAmount ? `- Rs. ${Number(order.discountAmount).toLocaleString('en-IN')}` : 'Rs. 0'}</strong>
        </div>
        <div style="display:flex;justify-content:space-between;padding:14px 0;font-size:18px;">
          <span>Total</span>
          <strong>Rs. ${Number(order.total || 0).toLocaleString('en-IN')}</strong>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`
}

function escapePdfText(value) {
  return `${value || ''}`
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
}

function wrapPdfLine(value, maxLength = 88) {
  const words = `${value || ''}`.split(/\s+/).filter(Boolean)
  const lines = []
  let current = ''

  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (next.length > maxLength && current) {
      lines.push(current)
      current = word
    } else {
      current = next
    }
  }

  if (current) {
    lines.push(current)
  }

  return lines.length > 0 ? lines : ['']
}

function pushTextLine(lines, value, options = {}) {
  const {
    font = 'F1',
    size = 12,
    x = 56,
    y,
  } = options

  lines.push(`BT /${font} ${size} Tf 1 0 0 1 ${x} ${y} Tm (${escapePdfText(value)}) Tj ET`)
}

export function buildInvoicePdf(order) {
  const displayId = order.displayId || getDisplayOrderId(order)
  const customerLines = [
    order.customerName || 'Customer',
    order.customerEmail || '',
    order.phone || '',
    [order.addressLine1, order.addressLine2, order.city, order.state, order.pincode].filter(Boolean).join(', '),
  ].filter(Boolean)

  const contentLines = []
  pushTextLine(contentLines, 'NEXZEN INVOICE', { font: 'F2', size: 24, x: 56, y: 785 })
  pushTextLine(contentLines, displayId, { font: 'F2', size: 18, x: 56, y: 760 })
  pushTextLine(contentLines, `Issued on ${new Date(order.createdAt).toLocaleDateString('en-IN')}`, { size: 11, x: 56, y: 742 })

  pushTextLine(contentLines, 'Billed To', { font: 'F2', size: 13, x: 56, y: 705 })
  let cursorY = 687
  for (const line of customerLines) {
    for (const wrapped of wrapPdfLine(line, 48)) {
      pushTextLine(contentLines, wrapped, { size: 11, x: 56, y: cursorY })
      cursorY -= 16
    }
  }

  pushTextLine(contentLines, 'Payment', { font: 'F2', size: 13, x: 330, y: 705 })
  cursorY = 687
  for (const line of [
    `Method: ${order.paymentMethod || 'N/A'}`,
    `Status: ${order.paymentStatus || 'N/A'}`,
    `Tracking: ${order.trackingNumber || 'Pending'}`,
  ]) {
    pushTextLine(contentLines, line, { size: 11, x: 330, y: cursorY })
    cursorY -= 16
  }

  pushTextLine(contentLines, 'Item', { font: 'F2', size: 12, x: 56, y: 615 })
  pushTextLine(contentLines, 'Qty', { font: 'F2', size: 12, x: 320, y: 615 })
  pushTextLine(contentLines, 'Unit Price', { font: 'F2', size: 12, x: 380, y: 615 })
  pushTextLine(contentLines, 'Line Total', { font: 'F2', size: 12, x: 472, y: 615 })

  cursorY = 592
  for (const item of order.items || []) {
    const itemName = item.product?.name || 'Product'
    const unitPrice = Number(item.price || 0)
    const lineTotal = unitPrice * Number(item.quantity || 0)
    const wrappedName = wrapPdfLine(itemName, 34)

    pushTextLine(contentLines, wrappedName[0], { size: 11, x: 56, y: cursorY })
    pushTextLine(contentLines, `${item.quantity}`, { size: 11, x: 324, y: cursorY })
    pushTextLine(contentLines, `Rs. ${unitPrice.toLocaleString('en-IN')}`, { size: 11, x: 380, y: cursorY })
    pushTextLine(contentLines, `Rs. ${lineTotal.toLocaleString('en-IN')}`, { size: 11, x: 472, y: cursorY })
    cursorY -= 16

    for (const extra of wrappedName.slice(1)) {
      pushTextLine(contentLines, extra, { size: 11, x: 56, y: cursorY })
      cursorY -= 14
    }

    cursorY -= 4
  }

  const subtotal = Number(order.total || 0)
  const discount = Number(order.discountAmount || 0)
  const grandTotal = subtotal
  const totalsY = Math.max(cursorY - 20, 160)

  pushTextLine(contentLines, `Subtotal: Rs. ${subtotal.toLocaleString('en-IN')}`, { font: 'F2', size: 12, x: 360, y: totalsY })
  pushTextLine(contentLines, `Discount: Rs. ${discount.toLocaleString('en-IN')}`, { font: 'F2', size: 12, x: 360, y: totalsY - 18 })
  pushTextLine(contentLines, `Total: Rs. ${grandTotal.toLocaleString('en-IN')}`, { font: 'F2', size: 14, x: 360, y: totalsY - 42 })

  const stream = contentLines.join('\n')
  const objects = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >> endobj',
    '4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
    '5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> endobj',
    `6 0 obj << /Length ${Buffer.byteLength(stream, 'utf8')} >> stream\n${stream}\nendstream endobj`,
  ]

  let pdf = '%PDF-1.4\n'
  const offsets = [0]
  for (const object of objects) {
    offsets.push(Buffer.byteLength(pdf, 'utf8'))
    pdf += `${object}\n`
  }

  const xrefOffset = Buffer.byteLength(pdf, 'utf8')
  pdf += `xref\n0 ${objects.length + 1}\n`
  pdf += '0000000000 65535 f \n'
  for (let index = 1; index < offsets.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`
  }
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`

  return Buffer.from(pdf, 'utf8')
}
