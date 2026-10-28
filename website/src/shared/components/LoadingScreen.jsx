import { Loader } from 'lucide-react';
import { WinButtons } from './WindowBox';

export default function LoadingScreen({ message = 'Memuat data...', error, onRetry }) {
  return (
    <div className="min-h-screen bg-[#F8F7F2] text-[#11221B] flex items-center justify-center p-4">
      <div className="w-full max-w-[400px] bg-white border-2 border-[#11221B] rounded-2xl shadow-[4px_4px_0px_0px_#11221B] overflow-hidden animate-fade">
        <div className="bg-[#BAE6FD] border-b-2 border-[#11221B] px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono text-xs font-extrabold uppercase text-[#11221B]">
            <Loader className="w-4 h-4 animate-spin" />
            <span>MEMUAT SISTEM</span>
          </div>
          <WinButtons />
        </div>
        <div className="p-6 text-center">
          {error ? (
            <>
              <div className="form-error visible" style={{ display: 'block', marginTop: 0 }}>{error}</div>
              {onRetry && (
                <button
                  type="button"
                  className="mt-4 px-6 py-2.5 rounded-full bg-[#CCF32F] border-2 border-[#11221B] shadow-[3px_3px_0px_0px_#11221B] font-extrabold text-xs text-[#11221B] cursor-pointer"
                  onClick={onRetry}
                >
                  COBA LAGI
                </button>
              )}
            </>
          ) : (
            <p className="font-mono text-xs font-bold text-[#11221B]/80">{message}</p>
          )}
        </div>
      </div>
    </div>
  );
}

