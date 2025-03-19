'use client';
import { useState } from 'react';
import { FiMail, FiCheck, FiX } from 'react-icons/fi';

const PropertyMessage = ({ property, userEmail }) => {
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState('');
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [customMessage, setCustomMessage] = useState('');

  const sendEmail = async (isApproved) => {
    if (!customMessage.trim() && !isApproved) {
      setStatus('Please provide a reason for declining.');
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: userEmail,
          subject: isApproved ? 'Property Application Approved' : 'Property Application Declined',
          propertyAddress: `${property.location.street}, ${property.location.city}, ${property.location.state} ${property.location.zipcode}`,
          isApproved,
          customMessage
        }),
      });

      if (response.ok) {
        setStatus(isApproved ? 'Approval sent successfully!' : 'Rejection sent successfully!');
        setShowMessageForm(false);
        setCustomMessage('');
      } else {
        setStatus('Failed to send email. Please try again.');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      setStatus('Failed to send email. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="mt-6 bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center mb-4">
        <FiMail className="text-gray-600 text-xl mr-2" />
        <h3 className="text-lg font-semibold">Property Application Response</h3>
      </div>

      {!showMessageForm ? (
        <div className="space-y-4">
          <p className="text-gray-600">Choose how you would like to respond to this application:</p>
          <div className="flex space-x-4">
            <button
              onClick={() => {
                setShowMessageForm(true);
                setCustomMessage("We are pleased to inform you that your application has been approved. Welcome to our property!");
              }}
              className="flex items-center justify-center space-x-2 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
            >
              <FiCheck className="text-lg" />
              <span>Accept Application</span>
            </button>
            <button
              onClick={() => {
                setShowMessageForm(true);
                setCustomMessage("");
              }}
              className="flex items-center justify-center space-x-2 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
            >
              <FiX className="text-lg" />
              <span>Decline Application</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <textarea
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            placeholder="Enter your message here..."
            className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            disabled={isSending}
          />
          <div className="flex space-x-4">
            <button
              onClick={() => sendEmail(customMessage.includes("approved"))}
              disabled={isSending}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg disabled:opacity-50 transition duration-200"
            >
              {isSending ? 'Sending...' : 'Send Message'}
            </button>
            <button
              onClick={() => {
                setShowMessageForm(false);
                setCustomMessage('');
                setStatus('');
              }}
              disabled={isSending}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-2 px-4 rounded-lg disabled:opacity-50 transition duration-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {status && (
        <div className={`mt-4 p-3 rounded-lg ${status.includes('Failed') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {status}
        </div>
      )}
    </div>
  );
};

export default PropertyMessage; 