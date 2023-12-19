const nodemailer = require('nodemailer');

// Function to send an email
module.exports = async (emailTo, subject, message) => {

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

  let mailOptions = {
    from: process.env.EMAIL_USER,
    to: emailTo, 
    subject: subject,
    html: message 
  };

  try {
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


