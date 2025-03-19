import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const notifications = await prisma.notification.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        sender: {
          select: {
            name: true,
            email: true,
            phone: true
          }
        },
        property: {
          select: {
            title: true,
            location: true,
            owner: {
              select: {
                name: true,
                phone: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const { notificationId } = await request.json();

    // Get notification details before updating
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
      include: {
        sender: {
          select: {
            name: true,
            email: true,
            phone: true
          }
        },
        property: {
          select: {
            title: true,
            location: true,
            owner: {
              select: {
                name: true,
                phone: true
              }
            }
          }
        }
      }
    });

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    // Update notification status
    const updatedNotification = await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true }
    });

    // Send email to the sender
    const emailContent = `
Dear ${notification.sender.name},

The property owner (${notification.property.owner.name}) is interested in your inquiry about the property at ${notification.property.location.street}, ${notification.property.location.city}.

Property Details:
- Title: ${notification.property.title}
- Address: ${notification.property.location.street}, ${notification.property.location.city}, ${notification.property.location.state} ${notification.property.location.zipcode}

Contact Information:
- Owner's Name: ${notification.property.owner.name}
- Owner's Phone: ${notification.property.owner.phone}

The owner will contact you shortly to discuss further details.

Best regards,
Rentify Team
    `;

    // Send email using your email API
    await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: notification.sender.email,
        subject: 'Property Owner Interested in Your Inquiry',
        text: emailContent,
        html: emailContent.replace(/\n/g, '<br>')
      }),
    });

    return NextResponse.json(updatedNotification);
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    );
  }
} 