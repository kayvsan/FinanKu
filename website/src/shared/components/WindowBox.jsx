
export function WinButtons() {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-3 h-3 rounded-full border-2 border-[#11221B] bg-[#FEF08A] inline-block"></span>
      <span className="w-3 h-3 rounded-full border-2 border-[#11221B] bg-[#BBF7D0] inline-block"></span>
      <span className="w-3 h-3 rounded-full border-2 border-[#11221B] bg-[#FBCFE8] inline-block"></span>
    </div>
  );
}

const HEADER_BG = {
  sky: 'bg-[#BAE6FD]',
  mint: 'bg-[#BBF7D0]',
  pink: 'bg-[#FBCFE8]',
  peach: 'bg-[#FED7AA]',
  lavender: 'bg-[#D8B4FE]'
};

export default function WindowBox({ icon: Icon, title, color, actions, className = '', bodyStyle, children }) {
  const headerColor = HEADER_BG[color] || 'bg-[#F8F7F2]';
  return (
    <div className={`bg-white border-2 border-[#11221B] rounded-2xl shadow-[4px_4px_0px_0px_#11221B] overflow-hidden mb-5 ${className}`.trim()}>
      <div className={`${headerColor} border-b-2 border-[#11221B] px-5 py-3 flex items-center justify-between gap-3 flex-wrap`}>
        <div className="flex items-center gap-2.5 font-mono text-xs font-bold tracking-wider uppercase text-[#11221B]">
          {Icon && (
            <span className="w-7 h-7 rounded-lg border-2 border-[#11221B] bg-white flex items-center justify-center shadow-[1.5px_1.5px_0px_0px_#11221B]">
              <Icon className="w-4 h-4 text-[#11221B]" />
            </span>
          )}
          <span>{title}</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {actions}
        </div>
      </div>
      <div className="p-5" style={bodyStyle}>
        {children}
      </div>
    </div>
  );
}

