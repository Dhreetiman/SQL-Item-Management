const nodemailer = require('nodemailer');

// Function to send an email
module.exports = async (emailTo, subject, message) => {

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    // secure: true,
    auth: {
        user: 'knight2stark@gmail.com',
        pass: 'ocjz eioq nvxs dwwa'
    }
});

  // Email content
  let mailOptions = {
    from: 'lucifer@yopmail.com',
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
