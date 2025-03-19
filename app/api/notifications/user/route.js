import { NextResponse } from 'next/server';
import connectDB from '../../../../config/database';
import Message from '../../../../models/Message';
import { getSessionUser } from '../../../../utils/getSessionUser';

// Attempt to import the Prisma client, but handle potential errors
let prisma = null;
try {
  // Try to import dynamically
  const { PrismaClient } = require('@prisma/client');
  prisma = new PrismaClient();
} catch (error) {
  console.warn('Prisma client initialization failed:', error.message);
  console.warn('Will proceed with MongoDB only');
}

export async function GET() {
  try {
    await connectDB();

    const sessionUser = await getSessionUser();

    if (!sessionUser || !sessionUser.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { userId } = sessionUser;

    // Initialize arrays to hold our data
    let formattedNotifications = [];

    // Only try to use Prisma if it's available and properly initialized
    if (prisma) {
      try {
        // Get notifications for the user using Prisma
        const notifications = await prisma.notification.findMany({
          where: {
            recipientId: userId,
          },
          orderBy: {
            createdAt: 'desc'
          },
          include: {
            sender: {
              select: {
                name: true,
                username: true,
                email: true,
                phone: true
              }
            },
            property: {
              select: {
                name: true,
                title: true,
                location: true,
              }
            }
          }
        });

        formattedNotifications = notifications.map(notification => ({
          notificationId: notification.id,
          content: notification.content,
          read: notification.read,
          createdAt: notification.createdAt,
          sender: notification.sender,
          property: notification.property,
          type: 'notification'
        }));
        
        console.log('Successfully retrieved Prisma notifications:', notifications.length);
      } catch (error) {
        console.error('Error fetching prisma notifications:', error);
        // Continue with just MongoDB data
      }
    } else {
      console.log('Prisma client not available, using only MongoDB');
    }

    // Get read messages sent by this user (MongoDB)
    const readMessages = await Message.find({ 
      sender: userId,
      read: true
    })
      .sort({ updatedAt: -1 })
      .populate('recipient', 'username email phone')
      .populate('property', 'name location');

    console.log('Found read messages from MongoDB:', readMessages.length);

    // Format the read messages
    const formattedReadMessages = readMessages.map(message => ({
      messageId: message._id.toString(),
      property: {
        id: message.property._id.toString(),
        name: message.property.name,
        location: message.property.location
      },
      propertyOwner: {
        id: message.recipient._id.toString(),
        username: message.recipient.username,
        email: message.recipient.email,
        phone: message.recipient.phone
      },
      readAt: message.updatedAt,
      hasSharedContact: true,
      type: 'readMessage'
    }));

    // Combine both types of notifications (interested property owners)
    const interestedOwners = [...formattedReadMessages, ...formattedNotifications]
      .sort((a, b) => new Date(b.readAt || b.createdAt) - new Date(a.readAt || a.createdAt));

    return NextResponse.json(interestedOwners);
  } catch (error) {
    console.error('Error fetching interested property owners:', error);
    return NextResponse.json(
      { error: 'Failed to fetch interested property owners', details: error.message },
      { status: 500 }
    );
  }
} 