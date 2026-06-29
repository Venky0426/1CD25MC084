import { useState, useEffect } from "react";
import { fetchNotifications } from "../api/notifications";
import { logger } from "../api/logger";

export function useNotifications({ page = 1, limit = 10, filter = 'All' } = {}) {
  const [notifications, setNotifications] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchNotifications({ page, limit, notificationType: filter });
        if (active) {
          setNotifications(data.notifications || []);
          setTotal(data.total || 0);
          setTotalPages(data.totalPages || 0);
        }
      } catch (err) {
        logger.error('Hook', 'Error in useNotifications hook', { error: err.message });
        if (active) {
          setError(err.message || 'Failed to load notifications');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [page, limit, filter]);

  return { notifications, total, totalPages, loading, error };
}
