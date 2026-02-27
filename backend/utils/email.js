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

const sendLoginOTP = async (userEmail, otp) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: 'Login OTP - StyleHub',
      html: `
        <h2>StyleHub Login Verification</h2>
        <p>Your one-time password (OTP) for login is:</p>
        <h3 style="color: #007bff; font-size: 24px; letter-spacing: 2px;">${otp}</h3>
        <p><strong>This OTP will expire in 10 minutes.</strong></p>
        <p>If you did not attempt to login, please ignore this email.</p>
        <p>Thanks,<br>StyleHub Team</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('Login OTP email sent to:', userEmail);
  } catch (error) {
    console.error('OTP email sending failed:', error);
    throw error;
  }
};

const sendRegistrationOTP = async (userEmail, otp) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: 'Verify Your Email - StyleHub Registration',
      html: `
        <h2>Welcome to StyleHub!</h2>
        <p>Thank you for signing up. Please verify your email address using the code below:</p>
        <h3 style="color: #007bff; font-size: 24px; letter-spacing: 2px;">${otp}</h3>
        <p><strong>This verification code will expire in 10 minutes.</strong></p>
        <p>If you did not create this account, please ignore this email.</p>
        <p>Thanks,<br>StyleHub Team</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('Registration OTP email sent to:', userEmail);
  } catch (error) {
    console.error('Registration OTP email sending failed:', error);
    throw error;
  }
};

module.exports = { sendOrderConfirmation, sendAdminNotification, sendLoginOTP, sendRegistrationOTP };
