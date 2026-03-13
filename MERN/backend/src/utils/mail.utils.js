// const { text } = require('express');
const mailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const templatePath = fs.readFileSync(path.join(__dirname, '../templates/emailTemplate.html'), 'utf-8');
const sendMail = async (to, subject, name, message, link = []) => {

    const transporter = mailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        }
    })

    let htmlContent = templatePath.replace('{{name}}', name).replace('{{message}}', message).replace('{{link}}', link);
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: to,
        subject: subject,
        html: htmlContent,
        // attachments: attachments
    }

    const mailResponse = await transporter.sendMail(mailOptions)
    return mailResponse

}
module.exports = sendMail



// const mailer = require("nodemailer")
// require("dotenv").config()

// const sendMail = async (to, subject, text) => {

//     try {
//         const transporter = mailer.createTransport({
//             service: "gmail",
//             auth: {
//                 user: process.env.EMAIL_USER,
//                 pass: process.env.EMAIL_PASS

//             }
//         })
//         const mailOptions = {
//             from: process.env.EMAIL_USER,
//             to: to,
//             subject: subject,
//             text: text
//             //html:text
//         }
//         const mailResponse = await transporter.sendMail(mailOptions)
//         console.log(mailResponse.response)
//         return mailResponse


    
//     }catch (err) {
//         console.error("Error sending email:", err);
//         throw err;
//     }
// }
// module.exports = sendMail