import { Poll } from '../App';
import { X } from 'lucide-react';

interface NotificationDemoProps {
  poll: Poll;
  onClose: () => void;
  onFill: () => void;
}

export default function NotificationDemo({ poll, onClose, onFill }: NotificationDemoProps) {
  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div className="bg-white border-2 border-blue-500 rounded-xl shadow-2xl p-4 max-w-sm w-96">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white">S</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-1">
              <p className="text-slate-900">New Signal from {poll.publisherName}</p>
              <button
                onClick={onClose}
                className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-slate-600 line-clamp-2">{poll.question}</p>
          </div>
        </div>
        <button
          onClick={onFill}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Fill
        </button>
        <p className="text-xs text-slate-500 text-center mt-2">
          Desktop notification • Click to open app
        </p>
      </div>
    </div>
  );
}
