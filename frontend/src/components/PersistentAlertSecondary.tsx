import { AlertCircle } from 'lucide-react';

export default function PersistentAlertSecondary() {
    return (
        <div className="fixed inset-0 bg-white flex items-center justify-center z-[9999]" style={{ backgroundColor: 'white' }}>
            <div className="text-center px-10">
                <div className="w-24 h-24 bg-red-600/10 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse text-red-600">
                    <AlertCircle className="w-16 h-16" />
                </div>
                <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-6 tracking-tighter uppercase italic">
                    Response Required
                </h1>
                <div className="h-2 w-48 bg-red-600 mx-auto mb-8 rounded-full shadow-[0_0_20px_rgba(220,38,38,0.2)]"></div>
                <p className="text-xl md:text-2xl text-slate-700 font-medium">
                    Please check your <span className="text-red-600 font-bold">Primary Monitor</span> to respond.
                </p>
                <p className="mt-12 text-sm text-slate-400 uppercase tracking-widest font-bold">
                    Sentinel Enforcement Active
                </p>
            </div>
        </div>
    );
}
