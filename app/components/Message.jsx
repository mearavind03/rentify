'use client';
import { useState } from 'react';
import { FiCheck, FiMail, FiInfo } from 'react-icons/fi';
import { format } from 'date-fns';

const Message = ({ message }) => {
  const [isRead, setIsRead] = useState(message.read);
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState('');
  const [showInfo, setShowInfo] = useState(false);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return format(date, 'MMMM do, yyyy');
  };

  const handleMarkAsRead = async () => {
    if (isRead) return;
    
    setIsSending(true);
    try {
      const res = await fetch(`/api/messages/${message._id}`, {
        method: 'PATCH',
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setIsRead(true);
        setStatus('Message marked as read. A notification with your contact details has been sent to the sender.');
      } else {
        setStatus('Failed to mark message as read. Please try again.');
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
      setStatus('Failed to mark message as read. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className={`bg-white p-4 rounded-md shadow-md my-4 ${isRead ? 'border-l-4 border-gray-300' : 'border-l-4 border-blue-500'}`}>
      <div className="flex justify-between">
        <div>
          <p className="text-lg">
            <span className="font-bold">From:</span> {message.sender.username}
          </p>
          <p>
            <span className="font-bold">Property:</span> {message.property.name}
          </p>
          <p>
            <span className="font-bold">Received:</span> {formatDate(message.createdAt)}
          </p>
        </div>
        {!isRead ? (
          <button
            onClick={handleMarkAsRead}
            disabled={isSending}
            className="flex items-center gap-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
          >
            <FiCheck className="text-lg" />
            {isSending ? 'Processing...' : 'Accept Inquiry'}
          </button>
        ) : (
          <div className="flex items-center text-gray-500">
            <FiCheck className="text-green-500 mr-1" /> Read
          </div>
        )}
      </div>
      
      {!isRead && (
        <div className="mt-2 text-sm text-gray-600 flex items-center">
          <button 
            onClick={() => setShowInfo(!showInfo)}
            className="text-blue-500 hover:text-blue-700 flex items-center"
          >
            <FiInfo className="mr-1" /> 
            What happens when I mark as read?
          </button>
        </div>
      )}
      
      {showInfo && (
        <div className="mt-2 p-3 bg-blue-50 text-blue-700 rounded-md text-sm">
          When you mark a message as read, the system will:
          <ul className="list-disc ml-5 mt-1">
            <li>Notify the sender that you're interested in their inquiry</li>
            <li>Share your contact information (email and phone) with them</li>
            <li>Send them an email with your details so they can contact you</li>
          </ul>
        </div>
      )}
      
      <div className="mt-2 p-4 bg-gray-50 rounded-md">
        <p>{message.body}</p>
      </div>
      
      <div className="mt-2">
        <p>
          <span className="font-bold">Their Email:</span> {message.email}
        </p>
        <p>
          <span className="font-bold">Their Phone:</span> {message.phone}
        </p>
      </div>
      
      {status && (
        <div className={`mt-4 p-3 rounded-lg ${status.includes('Failed') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {status}
        </div>
      )}
    </div>
  );
};

export default Message; 