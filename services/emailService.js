import logger from "../utils/logger.js"
import nodemailer from 'nodemailer'
async function sendVerificationEmail(email, otp) {
  try {

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASSWORD
      }
    });


    logger.info(`email ${process.env.NODEMAILER_PASSWORD}`)

    logger.info(`email ${email}`)
    logger.info(`otp ${otp}`)



    const info = await transporter.sendMail({
      from: process.env.NODEMAILER_EMAIL,
      to: email,
      subject: 'OldRich — Verify Your Account',
      html: `
  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; padding: 30px;">
    <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
      <div style="background-color: #1a1a1a; color: #f5d384; text-align: center; padding: 20px;">
        <h1 style="margin: 0; font-size: 26px; letter-spacing: 1px;">Old<span style="color:#ffffff;">Rich</span></h1>
        <p style="margin: 5px 0 0; font-size: 14px;">Where timeless style meets modern luxury</p>
      </div>

      <div style="padding: 30px;">
        <h2 style="color: #1a1a1a; text-align: center;">Verify Your Account</h2>
        <p style="color: #444; font-size: 15px; line-height: 1.6;">
          Dear Gentleman,<br><br>
          Welcome to <strong>OldRich</strong> — we’re delighted to have you with us.
          To ensure your account’s security, please use the OTP below to verify your email address.
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <span style="display: inline-block; background-color: #1a1a1a; color: #f5d384; font-size: 24px; letter-spacing: 4px; padding: 15px 25px; border-radius: 8px; font-weight: bold;">
            ${otp}
          </span>
        </div>

        <p style="color: #555; font-size: 14px; line-height: 1.5;">
          This code is valid for <strong>1 minutes</strong>. If you didn’t request this, kindly ignore this email.
        </p>

        <p style="margin-top: 25px; color: #888; font-size: 13px; text-align: center; border-top: 1px solid #eee; padding-top: 15px;">
          Thank you for choosing <strong>OldRich</strong>.<br>
          We value tradition, craftsmanship, and your trust.
        </p>
      </div>
    </div>
  </div>
  `,
    })

    logger.info(2)

    return info.accepted.length > 0
  } catch (error) {
    console.log('error', error)
    logger.error(`Error sending email: ${error}`)
    return false
  }
}

export default sendVerificationEmail