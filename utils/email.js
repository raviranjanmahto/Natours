const nodemailer = require("nodemailer");
const pug = require("pug");

module.exports = class Email {
  constructor(email, user) {
    this.to = user.email;
    this.firstName = user.name.split(" ")[0];
    this.url = url;
    this.from = `Raviranjan Mahto <${process.env.EMAIL_FROM}>`;
  }
  createTransport() {
    if (process.env.NODE_ENV === "production") {
      return 1;
    }
    return (transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    }));
  }
  // SEND THE ACTUAL MAIL
  send(template, subject) {
    // 1) RENDER HTML BASED ON PUG TEMPLATE
    // 2) DEFINE EMAIL OPTION
    const mailOption = {
      from: this.from,
      to: this.to,
      subject,
      html,
    };
    // 3) CREATE A TRANSPORT AND SEND EMAIL
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`);
  }

  sendWelcome() {
    this.send("Welcome", "Welcome to the Natours Family!");
  }
};

const sendEmail = async option => {
  await transporter.sendMail(mailOption);
};
