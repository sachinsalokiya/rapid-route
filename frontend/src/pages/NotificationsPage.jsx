import { useEffect, useState } from 'react';
import api from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { formatDate, getErrorMessage } from '../utils/helpers';
import { useToast } from '../context/ToastContext';

export default function NotificationsPage() {
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get('/notifications', { params: { limit: 50 } });
      setItems(data.data.items);
      setUnreadCount(data.data.unreadCount || 0);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function markRead(id) {
    try {
      await api.patch(`/notifications/${id}/read`);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function markAll() {
    try {
      await api.patch('/notifications/read-all');
      toast.success('All notifications marked read');
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  const severityTone = {
    info: 'info',
    warning: 'warning',
    critical: 'danger',
    success: 'success',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold">Notifications</h2>
          <p className="text-sm text-steel-500">{unreadCount} unread</p>
        </div>
        <Button variant="outline" onClick={markAll}>
          Mark all read
        </Button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : items.length === 0 ? (
        <EmptyState title="No notifications yet" />
      ) : (
        <div className="space-y-3">
          {items.map((n) => (
            <Card key={n._id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-ink-900">{n.title}</h3>
                    <Badge tone={severityTone[n.severity] || 'neutral'}>{n.severity}</Badge>
                    {!n.isRead ? <Badge tone="teal">Unread</Badge> : null}
                  </div>
                  <p className="mt-1 text-sm text-steel-500">{n.message}</p>
                  <p className="mt-2 text-xs text-steel-400">{formatDate(n.createdAt)}</p>
                </div>
                {!n.isRead ? (
                  <Button size="sm" variant="outline" onClick={() => markRead(n._id)}>
                    Mark read
                  </Button>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
