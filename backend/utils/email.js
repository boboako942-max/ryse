const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendOrderConfirmation = async (userEmail, orderDetails) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: 'Order Confirmation - StyleHub',
      html: `
        <h2>Order Confirmation</h2>
        <p>Thank you for your purchase!</p>
        <p><strong>Order ID:</strong> ${orderDetails.orderId}</p>
        <p><strong>Total Amount:</strong> $${orderDetails.totalAmount}</p>
        <p><strong>Items:</strong></p>
        <ul>
          ${orderDetails.items.map(item => `<li>${item.name} x${item.quantity}</li>`).join('')}
        </ul>
        <p>Your order will be processed soon.</p>
        <p>Thanks for shopping at StyleHub!</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('Order confirmation email sent');
  } catch (error) {
    console.error('Email sending failed:', error);
  }
};

const sendAdminNotification = async (orderDetails) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL,
      subject: 'New Order Received - StyleHub',
      html: `
        <h2>New Order Received</h2>
        <p><strong>Order ID:</strong> ${orderDetails.orderId}</p>
        <p><strong>Customer:</strong> ${orderDetails.customerName}</p>
        <p><strong>Email:</strong> ${orderDetails.customerEmail}</p>
        <p><strong>Total Amount:</strong> $${orderDetails.totalAmount}</p>
        <p><strong>Items:</strong></p>
        <ul>
          ${orderDetails.items.map(item => `<li>${item.name} x${item.quantity}</li>`).join('')}
        </ul>
        <p>Please process this order.</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('Admin notification email sent');
  } catch (error) {
    console.error('Email sending failed:', error);
  }
};

module.exports = { sendOrderConfirmation, sendAdminNotification };
