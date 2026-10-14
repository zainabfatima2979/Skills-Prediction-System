import "./ConfirmDialog.css";

// Reusable confirmation modal. Pass `danger` for destructive actions (delete)
// to style the confirm button red instead of the default accent color.
function ConfirmDialog({ open, title, message, confirmLabel = "Confirm", cancelLabel = "Cancel", danger = false, onConfirm, onCancel }) {
  if (!open) return null;

  return (
    <div className="cd-overlay" onClick={onCancel}>
      <div className="cd-card" onClick={(e) => e.stopPropagation()}>
        <div className={`cd-icon ${danger ? "cd-icon-danger" : "cd-icon-default"}`}>
          {danger ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m2 0-1 13a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 7" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M10 11v6M14 11v6" strokeLinecap="round" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v4.5M12 16h.01" strokeLinecap="round" />
            </svg>
          )}
        </div>

        <h3 className="cd-title">{title}</h3>
        <p className="cd-message">{message}</p>

        <div className="cd-actions">
          <button className="cd-btn cd-btn-cancel" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            className={`cd-btn ${danger ? "cd-btn-danger" : "cd-btn-confirm"}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;