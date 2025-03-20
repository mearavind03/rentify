import { NextResponse } from 'next/server';
import connectDB from '@/config/database';
import Message from '@/models/Message';
import { getSessionUser } from '@/utils/getSessionUser';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// PATCH /api/messages/[id]
export async function PATCH(request, { params }) {
  try {
    await connectDB();

    const { id } = params;
    const body = await request.json();
    
    const sessionUser = await getSessionUser();
    if (!sessionUser || !sessionUser.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Find the message
    const message = await Message.findById(id)
      .populate('sender', 'username email')
      .populate('recipient', 'username email phone')
      .populate('property', 'name location');

    if (!message) {
      return NextResponse.json(
        { message: 'Message not found' },
        { status: 404 }
      );
    }

    // Check if user is the recipient
    if (message.recipient._id.toString() !== sessionUser.userId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Update message based on the request body
    if (body.status) {
      message.status = body.status;
    }
    if (body.read !== undefined) {
      message.read = body.read;
    }

    await message.save();
    console.log(message);

    // If marking as read, create notification and send email
    if (body.read) {
      // Create notification for the sender with contact information
      const notificationMessage = `${message.recipient.username} is interested in your inquiry about the property "${message.property.name}". Contact details: Email: ${message.recipient.email}, Phone: ${message.recipient.phone}`;
      
      // Send email to the sender
      const propertyAddress = `${message.property.location.street}, ${message.property.location.city}, ${message.property.location.state} ${message.property.location.zipcode}`;
      
      const emailContent = `
Dear ${message.sender.username},

Good news! ${message.recipient.username} has read your inquiry about the property at ${propertyAddress} and is interested in your message.

Contact Details:
- Name: ${message.recipient.username}
- Email: ${message.recipient.email}
- Phone: ${message.recipient.phone}

They will be in touch with you shortly to discuss further details about the property. Feel free to contact them directly using the information above.

Best regards,
Rentify Team
      `;

      // Send email using the email API
      await fetch(`${process.env.NEXTAUTH_URL || ''}/api/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: message.sender.email,
          subject: 'Property Owner Interested in Your Inquiry',
          text: emailContent,
          html: emailContent.replace(/\n/g, '<br>')
        }),
      });
    }

    return NextResponse.json({ 
      message: 'Message updated successfully',
      success: true 
    });
  } catch (error) {
    console.error('Error updating message:', error);
    return NextResponse.json(
      { message: 'Error updating message', error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/messages/[id]
export async function DELETE(request, { params }) {
  try {
    await connectDB();

    const { id } = params;

    const sessionUser = await getSessionUser();

    if (!sessionUser || !sessionUser.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { userId } = sessionUser;

    const message = await Message.findById(id);

    if (!message) {
      return NextResponse.json(
        { message: 'Message not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (message.recipient.toString() !== userId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await message.deleteOne();

    return NextResponse.json(
      { message: 'Message deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting message:', error);
    return NextResponse.json(
      { message: 'Error deleting message', error: error.message },
      { status: 500 }
    );
  }
}
