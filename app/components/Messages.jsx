'use client';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import Spinner from '@/components/Spinner';
import { FiCheck, FiX, FiMail, FiSearch, FiMessageSquare } from 'react-icons/fi';

const Messages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [customMessage, setCustomMessage] = useState('');
  const [status, setStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'unread', 'approved', 'declined'

  useEffect(() => {
    const getMessages = async () => {
      try {
        const res = await fetch('/api/messages');

        if (res.status === 200) {
          const data = await res.json();
          setMessages(data);
        }
      } catch (error) {
        console.log('Error fetching messages: ', error);
      } finally {
        setLoading(false);
      }
    };

    getMessages();
  }, []);

  const handleAccept = (message) => {
    setSelectedMessage(message);
    setCustomMessage("We are pleased to inform you that your application has been approved. Welcome to our property!");
    setShowMessageForm(true);
  };

  const handleDecline = (message) => {
    setSelectedMessage(message);
    setCustomMessage("");
    setShowMessageForm(true);
  };

  const sendEmail = async (isApproved) => {
    if (!customMessage.trim() && !isApproved) {
      setStatus('Please provide a reason for declining.');
      return;
    }

    setStatus('Sending...');

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: selectedMessage.email,
          subject: isApproved ? 'Property Application Approved' : 'Property Application Declined',
          propertyAddress: selectedMessage.propertyAddress,
          isApproved,
          customMessage
        }),
      });

      if (response.ok) {
        // Update message status
        const updateResponse = await fetch(`/api/messages/${selectedMessage._id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            status: isApproved ? 'approved' : 'declined',
            read: true 
          }),
        });

        if (updateResponse.ok) {
          setStatus(isApproved ? 'Approval sent successfully!' : 'Rejection sent successfully!');
          setShowMessageForm(false);
          setCustomMessage('');
          // Update local state
          setMessages(messages.map(msg => 
            msg._id === selectedMessage._id 
              ? { ...msg, status: isApproved ? 'approved' : 'declined', read: true } 
              : msg
          ));
          
          // Close dialog after a short delay
          setTimeout(() => {
            setStatus('');
            setSelectedMessage(null);
          }, 2000);
        }
      } else {
        setStatus('Failed to send email. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      setStatus('Failed to send email. Please try again.');
    }
  };

  const markAsRead = async (id) => {
    try {
      const response = await fetch(`/api/messages/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ read: true }),
      });

      if (response.ok) {
        setMessages(messages.map(msg => 
          msg._id === id ? { ...msg, read: true } : msg
        ));
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const filteredMessages = messages
    .filter(message => {
      if (activeTab === 'unread') return !message.read;
      if (activeTab === 'approved') return message.status === 'approved';
      if (activeTab === 'declined') return message.status === 'declined';
      return true; // 'all' tab
    })
    .filter(message => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return (
        (message.sender?.username?.toLowerCase().includes(searchLower)) ||
        (message.property?.name?.toLowerCase().includes(searchLower)) ||
        (message.body?.toLowerCase().includes(searchLower))
      );
    });

  const formatMessageDate = (dateString) => {
    const messageDate = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (messageDate.toDateString() === today.toDateString()) {
      return `Today at ${format(messageDate, 'h:mm a')}`;
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${format(messageDate, 'h:mm a')}`;
    } else {
      return format(messageDate, 'MMM d, yyyy');
    }
  };

  return loading ? (
    <Spinner loading={loading} />
  ) : (
    <div className="bg-gray-50 min-h-screen py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <FiMessageSquare className="mr-2 text-blue-500" />
            Messages
          </h1>
          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1 rounded-full">
            {messages.length} {messages.length === 1 ? 'message' : 'messages'}
          </span>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <FiSearch className="w-4 h-4 text-gray-500" />
          </div>
          <input
            type="text"
            className="bg-white border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5"
            placeholder="Search messages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <ul className="flex flex-wrap -mb-px text-sm font-medium text-center">
            <li className="mr-2">
              <button
                className={`inline-flex items-center p-4 rounded-t-lg ${
                  activeTab === 'all'
                    ? 'text-blue-600 border-b-2 border-blue-600 active'
                    : 'text-gray-500 border-b-2 border-transparent hover:text-gray-600 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('all')}
              >
                All Messages
              </button>
            </li>
            <li className="mr-2">
              <button
                className={`inline-flex items-center p-4 rounded-t-lg ${
                  activeTab === 'unread'
                    ? 'text-blue-600 border-b-2 border-blue-600 active'
                    : 'text-gray-500 border-b-2 border-transparent hover:text-gray-600 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('unread')}
              >
                Unread
                {messages.filter(m => !m.read).length > 0 && (
                  <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {messages.filter(m => !m.read).length}
                  </span>
                )}
              </button>
            </li>
            <li className="mr-2">
              <button
                className={`inline-flex items-center p-4 rounded-t-lg ${
                  activeTab === 'approved'
                    ? 'text-green-600 border-b-2 border-green-600 active'
                    : 'text-gray-500 border-b-2 border-transparent hover:text-gray-600 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('approved')}
              >
                Approved
              </button>
            </li>
            <li>
              <button
                className={`inline-flex items-center p-4 rounded-t-lg ${
                  activeTab === 'declined'
                    ? 'text-red-600 border-b-2 border-red-600 active'
                    : 'text-gray-500 border-b-2 border-transparent hover:text-gray-600 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('declined')}
              >
                Declined
              </button>
            </li>
          </ul>
        </div>

        {/* Messages List */}
        <div className="space-y-4">
          {filteredMessages.length === 0 ? (
            <div className="text-center bg-white rounded-lg shadow p-8">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-50 mb-4">
                <FiMail className="h-8 w-8 text-blue-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">No messages</h3>
              <p className="mt-2 text-sm text-gray-500">
                {searchTerm 
                  ? "No messages match your search criteria" 
                  : activeTab !== 'all' 
                    ? `No ${activeTab} messages found` 
                    : "When users contact you about your properties, you'll see their messages here"}
              </p>
              {(searchTerm || activeTab !== 'all') && (
                <button
                  onClick={() => {setSearchTerm(''); setActiveTab('all');}}
                  className="mt-4 text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            filteredMessages.map((message) => (
              <div 
                key={message._id} 
                className={`bg-white rounded-lg shadow border-l-4 ${
                  message.status === 'approved' 
                    ? 'border-green-500' 
                    : message.status === 'declined' 
                      ? 'border-red-500' 
                      : !message.read 
                        ? 'border-blue-500'
                        : 'border-gray-200'
                }`}
                onClick={() => !message.read && markAsRead(message._id)}
              >
                <div className="p-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 group-hover:text-gray-900">
                        {message.sender.username}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Property: {message.property.name}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatMessageDate(message.createdAt)}
                      </p>
                    </div>
                    <div>
                      {message.status === 'approved' && (
                        <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center">
                          <FiCheck className="w-3 h-3 mr-1" />
                          Approved
                        </span>
                      )}
                      {message.status === 'declined' && (
                        <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center">
                          <FiX className="w-3 h-3 mr-1" />
                          Declined
                        </span>
                      )}
                      {message.status === 'pending' && !message.read && (
                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                          New
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <p className="text-gray-700">{message.body}</p>
                  </div>
                  
                  <div className="mt-5 grid grid-cols-2 gap-2 text-sm text-gray-500">
                    <div>
                      <p><span className="font-medium">Email:</span> {message.email}</p>
                      <p><span className="font-medium">Phone:</span> {message.phone}</p>
                    </div>
                    
                    {message.status === 'pending' && (
                      <div className="flex justify-end">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAccept(message);
                          }}
                          className="inline-flex items-center px-3 py-1.5 mr-2 bg-green-100 hover:bg-green-200 text-green-800 text-xs font-medium rounded-full transition-colors"
                        >
                          <FiCheck className="w-3.5 h-3.5 mr-1" />
                          Approve
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDecline(message);
                          }}
                          className="inline-flex items-center px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 text-xs font-medium rounded-full transition-colors"
                        >
                          <FiX className="w-3.5 h-3.5 mr-1" />
                          Decline
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Message Response Modal */}
      {showMessageForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full relative">
            <button
              onClick={() => {
                setShowMessageForm(false);
                setCustomMessage('');
                setStatus('');
              }}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-500"
              disabled={status === 'Sending...'}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                {customMessage.includes("approved") ? "Approve Application" : "Decline Application"}
              </h2>
              
              {selectedMessage && (
                <div className="text-sm text-gray-600 mb-4">
                  <p><span className="font-medium">User:</span> {selectedMessage.sender.username}</p>
                  <p><span className="font-medium">Property:</span> {selectedMessage.property.name}</p>
                </div>
              )}
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your message:
                </label>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Enter your response..."
                  className="w-full h-32 p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  disabled={status === 'Sending...'}
                />
              </div>
              
              <div className="flex">
                <button
                  onClick={() => sendEmail(customMessage.includes("approved"))}
                  disabled={status === 'Sending...'}
                  className={`flex-1 flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                    customMessage.includes("approved")
                      ? "bg-green-600 hover:bg-green-700 focus:ring-green-500"
                      : "bg-red-600 hover:bg-red-700 focus:ring-red-500"
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50`}
                >
                  {status === 'Sending...' ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </>
                  ) : customMessage.includes("approved") ? "Send Approval" : "Send Rejection"}
                </button>
              </div>
              
              {status && status !== 'Sending...' && (
                <div className={`mt-4 p-3 rounded-md text-sm ${
                  status.includes('Failed') ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'
                }`}>
                  {status}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messages; 