const nodemailer = require('nodemailer');

// Function to send an email
module.exports = async (emailTo, subject, message) => {

  const transporter = nodemailer.createTransport({
    host: 'sandbox.smtp.mailtrap.io',
    port: 587,
    auth: {
        user: '41e799c6567240',
        pass: 'ae2dea25569724'
    }
});

  // Email content
  let mailOptions = {
    from: 'dhreetiman02@gmail.com',
    to: emailTo, 
    subject: subject,
    html: message 
  };

  try {
    // Send email
    let info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.response);
    return 'Email sent successfully';
  } catch (error) {
    console.error('Error occurred while sending email:', error);
    throw new Error('Failed to send email');
  }
}

// // Call the function to send the email
// sendEmail()
//   .then(result => console.log(result))
//   .catch(error => console.error(error));
