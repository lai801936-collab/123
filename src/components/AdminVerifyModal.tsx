import { useState, FormEvent } from 'react';
import { ShieldAlert, Eye, EyeOff, X } from 'lucide-react';

interface AdminVerifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (password: string) => boolean | Promise<boolean>;
}

export default function AdminVerifyModal({ isOpen, onClose, onVerify }: AdminVerifyModalProps) {
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const isCorrect = await onVerify(password);
      if (!isCorrect) {
        setError('密碼錯誤，請重新輸入！');
      }
    } catch (err) {
      setError('密碼驗證失敗，請稍後再試。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[70] flex justify-center items-center backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col transform transition-all duration-300">
        {/* Header */}
        <div className="bg-teal-700 text-white p-4 flex justify-between items-center shrink-0">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-teal-200" /> 管理者權限驗證
          </h3>
          <button 
            onClick={onClose} 
            className="text-white hover:bg-white/20 p-1 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="text-gray-600 text-xs font-medium">
            您已進入管理區，由於當前瀏覽器登入憑證已失效或您正在使用新裝置，請輸入【管理者密碼】以取得訪問授權。
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-xs p-3 rounded-lg font-bold">
              {error}
            </div>
          )}

          {/* Password Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700">請輸入管理者密碼</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="請輸入密碼"
                className="w-full border-2 border-gray-200 rounded-lg pl-3 pr-10 py-2 focus:border-teal-600 focus:outline-none text-sm font-medium"
                required
                disabled={loading}
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

          {/* Buttons */}
          <div className="pt-3 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 rounded-lg text-sm transition cursor-pointer disabled:opacity-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 rounded-lg text-sm transition shadow cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1"
            >
              {loading ? '驗證中...' : '確認驗證'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
