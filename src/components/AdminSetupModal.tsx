import { useState, FormEvent } from 'react';
import { ShieldCheck, Eye, EyeOff, X } from 'lucide-react';

interface AdminSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (password: string) => void;
}

export default function AdminSetupModal({ isOpen, onClose, onSave }: AdminSetupModalProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.trim().length < 4) {
      setError('密碼長度至少需要 4 個字元');
      return;
    }

    if (password !== confirmPassword) {
      setError('密碼與確認密碼不一致');
      return;
    }

    onSave(password);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[70] flex justify-center items-center backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col transform transition-all duration-300">
        {/* Header */}
        <div className="bg-teal-700 text-white p-4 flex justify-between items-center shrink-0">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal-200" /> 初始化管理者設定
          </h3>
          <button 
            onClick={onClose} 
            className="text-white hover:bg-white/20 p-1 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-teal-50 text-teal-800 p-3 rounded-lg text-xs leading-relaxed font-medium">
            偵測到這是系統第一次進入後台管理，請設定您的【管理者密碼】。
            設定完成後，此瀏覽器將自動記錄登入憑證，未來進入均不需再次驗證。
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-xs p-3 rounded-lg font-bold">
              {error}
            </div>
          )}

          {/* Password Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700">新管理者密碼</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="請輸入 4 位數以上密碼"
                className="w-full border-2 border-gray-200 rounded-lg pl-3 pr-10 py-2 focus:border-teal-600 focus:outline-none text-sm font-medium"
                required
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700">確認管理者密碼</label>
            <input
              type={showPass ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="請再次輸入密碼以確認"
              className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-teal-600 focus:outline-none text-sm font-medium"
              required
            />
          </div>

          {/* Action buttons */}
          <div className="pt-3 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 rounded-lg text-sm transition cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 rounded-lg text-sm transition shadow cursor-pointer"
            >
              儲存並進入
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
