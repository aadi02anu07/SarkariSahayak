import { useState, useEffect } from 'react';
import { notificationApi } from '../api/notification.api';
import { useNotifStore } from '../store/notifStore';

const TYPE_ICONS = {
  DEADLINE_REMINDER: '⏰',
  NEW_SCHEME: '🆕',
  SCHEME_REOPENED: '🔄',
  WEEKLY_DIGEST: '📋',
  SYSTEM: 'ℹ️',
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { markAllRead: storeMarkAll } = useNotifStore();

  useEffect(() => {
    notificationApi.getAll({ limit: 50 })
      .then((res) => setNotifications(res.data.data.notifications || []))
      .finally(() => setIsLoading(false));
  }, []);

  const handleMarkAll = async () => {
    await notificationApi.markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    storeMarkAll();
  };

  const handleMarkOne = async (id) => {
    await notificationApi.markRead(id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
  };

  if (isLoading) return <div className="loading-page">Loading notifications...</div>;

  return (
    <div className="notifications-page">
      <div className="notif-header">
        <h1>🔔 Notifications</h1>
        {notifications.some((n) => !n.isRead) && (
          <button className="btn-outline" onClick={handleMarkAll}>Mark all as read</button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="empty-state">
          <p>No notifications yet. Save schemes to get deadline reminders!</p>
        </div>
      ) : (
        <div className="notif-list">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`notif-item ${!notif.isRead ? 'unread' : ''}`}
              onClick={() => !notif.isRead && handleMarkOne(notif.id)}
            >
              <span className="notif-icon">{TYPE_ICONS[notif.type] || 'ℹ️'}</span>
              <div className="notif-body">
                <strong>{notif.title}</strong>
                <p>{notif.message}</p>
                <span className="notif-time">
                  {new Date(notif.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
              {!notif.isRead && <span className="unread-dot" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
