import {
  useEffect,
  useRef,
  useState,
} from "react";

import NotificationPanel from "./NotificationPanel";

import {
  getNotifications,
} from "../services/notificationService";

function NotificationBell() {
  const [open, setOpen] =
    useState(false);

  const [unreadCount, setUnreadCount] =
    useState(0);

  const wrapperRef = useRef(null);

  useEffect(() => {
    loadUnreadCount();

    /*
      Refresh every 30 seconds.
    */
    const intervalId = setInterval(
      loadUnreadCount,
      30000
    );

    return () =>
      clearInterval(intervalId);
  }, []);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(
          event.target
        )
      ) {
        setOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  async function loadUnreadCount() {
    try {
      const result =
        await getNotifications({
          read: false,
        });

      setUnreadCount(
        result.unreadCount ??
          result.count ??
          0
      );
    } catch (error) {
      console.error(
        "Unread notification error:",
        error
      );
    }
  }

  function handlePanelChange(
    count
  ) {
    setUnreadCount(count);
  }

  return (
    <div
      className="notification-wrapper"
      ref={wrapperRef}
    >
      <button
        type="button"
        className={
          open
            ? "notification-bell-button active"
            : "notification-bell-button"
        }
        aria-label="Notifications"
        onClick={() =>
          setOpen(
            (previous) => !previous
          )
        }
      >
        <span className="notification-bell-icon">
          🔔
        </span>

        {unreadCount > 0 && (
          <span className="notification-count-badge">
            {unreadCount > 99
              ? "99+"
              : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <NotificationPanel
          onClose={() =>
            setOpen(false)
          }
          onCountChange={
            handlePanelChange
          }
        />
      )}
    </div>
  );
}

export default NotificationBell;