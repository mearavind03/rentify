import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Create a transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function POST(request) {
  try {
    const { to, subject, propertyAddress, isApproved, customMessage } = await request.json();

    const emailContent = `Dear Applicant,

${customMessage || (isApproved
  ? `We are pleased to inform you that your application for the property at ${propertyAddress} has been approved.

We look forward to working with you on the next steps of the process.`
  : `We regret to inform you that your application for the property at ${propertyAddress} has been declined.

We appreciate your interest and wish you the best in your property search.`)}

Best regards,
The Property Management Team`;

    // Send email
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to,
      subject,
      text: emailContent,
      html: emailContent.replace(/\n/g, '<br>')
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
} 