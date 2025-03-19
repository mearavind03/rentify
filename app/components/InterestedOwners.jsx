'use client';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { FiPhone, FiMail, FiHome, FiClock, FiCalendar, FiCheck, FiUser, FiInfo } from 'react-icons/fi';

const InterestedOwners = () => {
  const [interestedOwners, setInterestedOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInterestedOwners = async () => {
      try {
        const response = await fetch('/api/notifications/user');
        if (response.ok) {
          const data = await response.json();
          setInterestedOwners(data);
        } else {
          const errorData = await response.json();
          setError(errorData.error || 'Failed to load data');
        }
      } catch (error) {
        console.error('Error fetching interested owners:', error);
        setError('Network error when loading data');
      } finally {
        setLoading(false);
      }
    };

    fetchInterestedOwners();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return format(date, 'MMMM do, yyyy');
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map((n) => (
          <div key={n} className="bg-gray-200 h-32 rounded-lg"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 bg-red-50 rounded-lg">
        <p className="text-red-500">{error}</p>
        <p className="text-gray-600 mt-2">Please try again later</p>
      </div>
    );
  }

  if (interestedOwners.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No property owners have shown interest in your inquiries yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-4">Interested Property Owners</h2>
      
      {interestedOwners.map((item) => {
        // Extract contact information based on item type
        const contactInfo = item.type === 'readMessage' 
          ? item.propertyOwner 
          : (item.sender || {});
        
        // Extract property information
        const propertyInfo = item.property || {};
        const location = propertyInfo.location || {};
        
        return (
          <div 
            key={item.messageId || item.notificationId} 
            className="bg-white rounded-lg shadow-md p-5 border-l-4 border-green-500"
          >
            {/* Header section with status */}
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-lg">
                  {item.type === 'readMessage' 
                    ? `${contactInfo.username || 'Property Owner'} is interested in your inquiry!`
                    : (item.content || 'New notification')}
                </h3>
                <p className="flex items-center text-sm text-gray-600 mt-1">
                  <FiClock className="mr-1" />
                  {item.readAt 
                    ? `Responded on ${formatDate(item.readAt)}` 
                    : `Received on ${formatDate(item.createdAt)}`}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium
                ${item.type === 'readMessage' ? 'bg-green-100 text-green-800' : 
                  (item.read ? 'bg-gray-100 text-gray-800' : 'bg-blue-100 text-blue-800')}`}>
                {item.type === 'readMessage' ? 'Contact Available' : 
                  (item.read ? 'Read' : 'New')}
              </span>
            </div>
            
            {/* Property information */}
            {propertyInfo && (
              <div className="mt-4 p-3 bg-gray-50 rounded-md">
                <p className="flex items-center text-gray-700">
                  <FiHome className="mr-2 text-gray-600" />
                  <span className="font-medium">Property:</span> {propertyInfo.name || propertyInfo.title || 'Property'}
                </p>
                {location && (Object.keys(location).length > 0) && (
                  <p className="flex items-start mt-1 ml-6 text-gray-600">
                    <span className="text-gray-500">
                      {location.street && `${location.street}, `}
                      {location.city && `${location.city}, `}
                      {location.state && `${location.state} `}
                      {location.zipcode && location.zipcode}
                    </span>
                  </p>
                )}
              </div>
            )}
            
            {/* Contact Information - Highlighted Section */}
            <div className="mt-4 border border-green-200 bg-green-50 rounded-md p-4">
              <h4 className="font-medium flex items-center text-green-800 mb-3">
                <FiUser className="mr-2" />
                Contact Information:
              </h4>
              
              <div className="space-y-2 ml-2">
                {/* Name */}
                {(contactInfo.name || contactInfo.username) && (
                  <p className="flex items-center">
                    <span className="font-medium w-20">Name:</span> 
                    {contactInfo.name || contactInfo.username}
                  </p>
                )}
                
                {/* Email - Always try to show this */}
                {contactInfo.email ? (
                  <p className="flex items-center">
                    <span className="font-medium w-20">Email:</span>
                    <a href={`mailto:${contactInfo.email}`} className="text-blue-600 hover:underline flex items-center">
                      {contactInfo.email} <FiMail className="ml-1" />
                    </a>
                  </p>
                ) : (
                  <p className="text-gray-500 italic">No email available</p>
                )}
                
                {/* Phone - Always try to show this */}
                {contactInfo.phone ? (
                  <p className="flex items-center">
                    <span className="font-medium w-20">Phone:</span>
                    <a href={`tel:${contactInfo.phone}`} className="text-blue-600 hover:underline flex items-center">
                      {contactInfo.phone} <FiPhone className="ml-1" />
                    </a>
                  </p>
                ) : (
                  <p className="text-gray-500 italic">No phone number available</p>
                )}
              </div>
              
              {/* Call to action */}
              <div className="mt-3 pt-2 border-t border-green-200 text-sm text-green-700 flex items-center">
                <FiInfo className="mr-1" />
                Contact this owner directly to discuss the property
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default InterestedOwners; 