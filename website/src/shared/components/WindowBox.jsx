
export function WinButtons() {
  return (
    <>
      <button className="win-btn">_</button>
      <button className="win-btn">□</button>
      <button className="win-btn close">✕</button>
    </>
  );
}

export default function WindowBox({ icon: Icon, title, color, actions, className = '', bodyStyle, children }) {
  return (
    <div className={`window-box ${className}`.trim()}>
      <div className={`window-header${color ? ' ' + color : ''}`}>
        <div className="win-title">
          {Icon && <Icon style={{ width: 14, height: 14 }} />}
          <span>{title}</span>
        </div>
        <div className="win-controls">
          {actions}
          <WinButtons />
        </div>
      </div>
      <div className="window-body" style={bodyStyle}>
        {children}
      </div>
    </div>
  );
}
