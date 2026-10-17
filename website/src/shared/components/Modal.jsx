
export default function Modal({ onClose, boxStyle, children }) {
  return (
    <div
      className="modal-overlay open"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal-box" style={boxStyle}>
        {children}
      </div>
    </div>
  );
}
