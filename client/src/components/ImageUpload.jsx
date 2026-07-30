import { useState, useRef, useEffect } from 'react';
import { IconUpload } from './Icons';
import { PHOTO_TIPS } from '../utils/subjects';

export default function ImageUpload({ image, onImageChange }) {
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const inputRef = useRef(null);

  function handleFile(file) {
    if (!file) return;
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      alert('فرمت تصویر پشتیبانی نمی‌شود. فقط JPG، PNG و WebP مجاز است.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('حجم فایل نباید بیشتر از ۱۰ مگابایت باشد.');
      return;
    }
    onImageChange(file);
  }

  useEffect(() => {
    if (!image) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(image);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  if (image && previewUrl) {
    return (
      <div className="relative group rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/50 shadow-inner">
        <img
          src={previewUrl}
          alt="پیش‌نمایش برگه امتحان"
          className="w-full max-h-72 object-contain"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <button
          type="button"
          onClick={() => {
            onImageChange(null);
            if (inputRef.current) inputRef.current.value = '';
          }}
          className="absolute top-3 left-3 bg-white/95 dark:bg-slate-900/95 hover:bg-white text-slate-600 hover:text-red-600 rounded-xl px-3.5 py-2 text-xs font-semibold shadow-lg transition-all backdrop-blur-sm border border-slate-200/50 dark:border-slate-700 opacity-0 group-hover:opacity-100"
        >
          حذف و انتخاب مجدد
        </button>
      </div>
    );
  }

  return (
    <div
      onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFile(e.dataTransfer.files[0]); }}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onClick={() => inputRef.current?.click()}
      className={`relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 group ${
        isDragging
          ? 'border-makan-500 bg-makan-50/60 dark:bg-makan-950/30 scale-[1.01] shadow-glow'
          : 'border-slate-200 dark:border-slate-700 hover:border-makan-400/60 hover:bg-makan-50/20 dark:hover:bg-makan-950/10 bg-slate-50/50 dark:bg-slate-800/20'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => handleFile(e.target.files[0])}
      />
      <div className={`w-16 h-16 mx-auto mb-5 rounded-2xl flex items-center justify-center transition-all duration-300 ${
        isDragging
          ? 'bg-gradient-to-br from-makan-500 to-brand-600 text-white shadow-btn scale-110'
          : 'bg-white dark:bg-slate-800 text-slate-400 shadow-sm border border-slate-100 dark:border-slate-700 group-hover:border-makan-200 group-hover:text-makan-600'
      }`}>
        <IconUpload className="w-8 h-8" />
      </div>
      <p className="text-slate-800 dark:text-slate-200 font-bold text-base">عکس برگه را اینجا رها کنید</p>
      <p className="text-slate-400 text-sm mt-1.5">یا برای انتخاب فایل کلیک کنید</p>
      <div className="flex items-center justify-center gap-2 mt-5">
        {['JPG', 'PNG', 'WebP'].map((fmt) => (
          <span key={fmt} className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 px-2.5 py-1 rounded-lg">
            {fmt}
          </span>
        ))}
        <span className="text-[10px] text-slate-400">· حداکثر ۱۰MB</span>
      </div>
      <ul className="mt-6 text-right space-y-1.5">
        {PHOTO_TIPS.map((tip) => (
          <li key={tip} className="text-xs text-slate-500 dark:text-slate-400 flex items-start gap-2 justify-center">
            <span className="text-makan-500 shrink-0">✓</span>
            {tip}
          </li>
        ))}
      </ul>
    </div>
  );
}
