import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();
const VAT_RATE = 0.12;

/**
 * Sends a payment receipt email to the customer
 * @param {Object} payment - Payment object from DB
 * @param {string} customerEmail - Customer's email
 */
export async function sendReceiptEmail(payment, customerEmail) {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    let rows = "";
    let subtotal = 0;

    if (payment.orders && payment.orders.length) {
      payment.orders.forEach((order) => {
        const items = order.items && order.items.length ? order.items : [order]; // handle flat array
        items.forEach((item) => {
          const quantity = Number(item.quantity || 0);
          const price = Number(item.unit_price || 0);
          const itemTotal = quantity * price;
          subtotal += itemTotal;

          rows += `<tr>
<td style="padding: 8px; border: 1px solid #ddd;">${item.prodname}</td>
<td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${quantity}</td>
<td style="padding: 8px; border: 1px solid #ddd; text-align: right;">₱${price.toFixed(2)}</td>
<td style="padding: 8px; border: 1px solid #ddd; text-align: right;">₱${itemTotal.toFixed(2)}</td>
</tr>`;
        });
      });
    }

    const deliveryFee = Number(payment.delivery_fee || 0);
    const vat = subtotal * 0.12; // 12% VAT
    const totalPaid = subtotal + deliveryFee;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: customerEmail,
      subject: "Payment Receipt",
      html: `
<h3>Hello,</h3>
<p>Your payment has been successfully received.</p>

<p><strong>Reference Code:</strong> ${payment.reference_code || payment.paymongo_id}<br>
<strong>Payment Method:</strong> ${payment.method}</p>

<table style="border-collapse: collapse; width: 100%;">
<thead>
<tr>
<th style="padding: 8px; border: 1px solid #ddd;">Product</th>
<th style="padding: 8px; border: 1px solid #ddd;">Qty</th>
<th style="padding: 8px; border: 1px solid #ddd;">Price</th>
<th style="padding: 8px; border: 1px solid #ddd;">Subtotal</th>
</tr>
</thead>
<tbody>
${rows}
</tbody>
</table>

<p><strong>Subtotal:</strong> ₱${subtotal.toFixed(2)}<br>
<strong>VAT (12%):</strong> ₱${vat.toFixed(2)}<br>
<strong>Delivery Fee:</strong> ₱${deliveryFee.toFixed(2)}<br>

<strong>Total Paid:</strong> ₱${totalPaid.toFixed(2)}</p>

<p>Thank you for your order!</p>
`,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Receipt email sent to ${customerEmail}`);
  } catch (err) {
    console.error("❌ Failed to send receipt email:", err.message);
  }
}
