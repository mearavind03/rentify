'use client';
import { useState, useEffect } from 'react';
import { FiBell, FiCheck } from 'react-icons/fi';

const NotificationList = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationId }),
      });

      if (response.ok) {
        // Update local state
        setNotifications(notifications.map(notification =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        ));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  if (loading) {
    return <div>Loading notifications...</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <FiBell className="text-blue-500" />
        Notifications
      </h2>
      
      {notifications.length === 0 ? (
        <p className="text-gray-500">No notifications</p>
      ) : (
        notifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-4 rounded-lg border ${
              notification.read ? 'bg-gray-50' : 'bg-white'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">{notification.content}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Property: {notification.property.title}
                </p>
                <p className="text-sm text-gray-500">
                  From: {notification.sender.name}
                </p>
              </div>
              {!notification.read && (
                <button
                  onClick={() => markAsRead(notification.id)}
                  className="flex items-center gap-1 text-sm text-blue-500 hover:text-blue-600"
                >
                  <FiCheck />
                  Accept Inquiry
                </button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default NotificationList; 