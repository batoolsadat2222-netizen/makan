import { useState, useRef, useEffect } from 'react';
import { IconUpload, IconCamera } from './Icons';
import { PHOTO_TIPS } from '../utils/subjects';
import { useApp } from '../context/AppContext';

function isImageFile(file) {
  if (!file) return false;
  if (file.type?.startsWith('image/')) return true;
  return /\.(jpe?g|png|webp|gif|bmp|heic|heif|tif{1,2}|avif)$/i.test(file.name || '');
}

function fileLabel(file) {
  if (!file) return '';
  const mb = file.size ? ` · ${(file.size / (1024 * 1024)).toFixed(1)}MB` : '';
  return `${file.name || 'فایل'}${mb}`;
}

export default function ImageUpload({
  image,
  onImageChange,
  images,
  onImagesChange,
  multiple = false,
  title = 'عکس یا فایل را اینجا رها کنید',
  subtitle = 'عکس، PDF یا هر فایلی — بدون محدودیت',
  showTips = true,
  allowCamera = true,
}) {
  const { showToast } = useApp();
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewUrls, setPreviewUrls] = useState([]);
  const inputRef = useRef(null);
  const cameraRef = useRef(null);

  function validateFile(file) {
    if (!file) return false;
    if (!file.size) {
      showToast('فایل خالی است. فایل دیگری انتخاب کنید.', 'error');
      return false;
    }
    return true;
  }

  function handleFile(file) {
    if (!validateFile(file)) return;
    onImageChange?.(file);
  }

  function handleFiles(fileList) {
    const incoming = Array.from(fileList || []).filter(validateFile);
    if (!incoming.length) return;
    if (multiple) {
      const current = images || [];
      onImagesChange?.([...current, ...incoming]);
      return;
    }
    handleFile(incoming[0]);
  }

  useEffect(() => {
    if (!image || !isImageFile(image)) {
      setPreviewUrl(null);
      return undefined;
    }
    const url = URL.createObjectURL(image);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  useEffect(() => {
    if (!multiple) return undefined;
    const list = images || [];
    const urls = list.map((f) => (isImageFile(f) ? URL.createObjectURL(f) : null));
    setPreviewUrls(urls);
    return () => urls.forEach((u) => u && URL.revokeObjectURL(u));
  }, [images, multiple]);

  const fileInput = (
    <input
      ref={inputRef}
      type="file"
      accept="*/*"
      multiple={multiple}
      className="hidden"
      onChange={(e) => {
        handleFiles(e.target.files);
        e.target.value = '';
      }}
    />
  );

  const cameraInput = allowCamera ? (
    <input
      ref={cameraRef}
      type="file"
      accept="image/*"
      capture="environment"
      className="hidden"
      onChange={(e) => {
        handleFiles(e.target.files);
        e.target.value = '';
      }}
    />
  ) : null;

  if (multiple && (images?.length || 0) > 0) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {(images || []).map((file, idx) => (
            <div key={`${file.name}-${file.size}-${idx}`} className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/50">
              {previewUrls[idx] ? (
                <img src={previewUrls[idx]} alt={`فایل ${idx + 1}`} className="w-full h-32 object-cover" />
              ) : (
                <div className="w-full h-32 flex flex-col items-center justify-center gap-1 px-3 text-center">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200 break-all line-clamp-3">
                    {file.name || `فایل ${idx + 1}`}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {file.type || 'فایل'}
                  </span>
                </div>
              )}
              <button
                type="button"
                onClick={() => onImagesChange?.((images || []).filter((_, i) => i !== idx))}
                className="absolute top-2 left-2 bg-white/95 dark:bg-slate-900/95 text-slate-600 hover:text-red-600 rounded-lg px-2 py-1 text-[10px] font-semibold shadow"
              >
                حذف
              </button>
              <span className="absolute bottom-2 right-2 text-[10px] font-semibold bg-slate-900/70 text-white px-2 py-0.5 rounded-md">
                {idx + 1}
              </span>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex-1 py-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:border-makan-400 hover:text-makan-600 transition-colors"
          >
            + افزودن فایل
          </button>
          {allowCamera && (
            <button
              type="button"
              onClick={() => cameraRef.current?.click()}
              className="px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:border-makan-400 hover:text-makan-600 transition-colors flex items-center gap-1.5"
            >
              <IconCamera className="w-4 h-4" />
              دوربین
            </button>
          )}
        </div>
        {fileInput}
        {cameraInput}
      </div>
    );
  }

  if (!multiple && image) {
    return (
      <div className="relative rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/50 shadow-inner">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="پیش‌نمایش"
            className="w-full max-h-72 object-contain"
          />
        ) : (
          <div className="w-full min-h-40 flex flex-col items-center justify-center gap-2 p-8 text-center">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100 break-all">{fileLabel(image)}</p>
            <p className="text-xs text-slate-500">{image.type || 'فایل آماده ارسال'}</p>
          </div>
        )}
        <button
          type="button"
          onClick={() => {
            onImageChange(null);
            if (inputRef.current) inputRef.current.value = '';
            if (cameraRef.current) cameraRef.current.value = '';
          }}
          className="absolute top-3 left-3 bg-white/95 dark:bg-slate-900/95 hover:bg-white text-slate-600 hover:text-red-600 rounded-xl px-3.5 py-2 text-xs font-semibold shadow-lg transition-all backdrop-blur-sm border border-slate-200/50 dark:border-slate-700"
        >
          حذف و انتخاب مجدد
        </button>
        {fileInput}
        {cameraInput}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files); }}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onClick={() => inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 group ${
          isDragging
            ? 'border-makan-500 bg-makan-50/60 dark:bg-makan-950/30 scale-[1.01] shadow-glow'
            : 'border-slate-200 dark:border-slate-700 hover:border-makan-400/60 hover:bg-makan-50/20 dark:hover:bg-makan-950/10 bg-slate-50/50 dark:bg-slate-800/20'
        }`}
      >
        {fileInput}
        {cameraInput}
        <div className={`w-16 h-16 mx-auto mb-5 rounded-2xl flex items-center justify-center transition-all duration-300 ${
          isDragging
            ? 'bg-gradient-to-br from-makan-500 to-brand-600 text-white shadow-btn scale-110'
            : 'bg-white dark:bg-slate-800 text-slate-400 shadow-sm border border-slate-100 dark:border-slate-700 group-hover:border-makan-200 group-hover:text-makan-600'
        }`}>
          <IconUpload className="w-8 h-8" />
        </div>
        <p className="text-slate-800 dark:text-slate-200 font-bold text-base">{title}</p>
        <p className="text-slate-400 text-sm mt-1.5">{subtitle}</p>
        {showTips && (
          <ul className="mt-6 text-right space-y-1.5">
            {PHOTO_TIPS.map((tip) => (
              <li key={tip} className="text-xs text-slate-500 dark:text-slate-400 flex items-start gap-2 justify-center">
                <span className="text-makan-500 shrink-0">✓</span>
                {tip}
              </li>
            ))}
          </ul>
        )}
      </div>
      {allowCamera && (
        <button
          type="button"
          onClick={() => cameraRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:border-makan-400 hover:text-makan-600 dark:hover:text-makan-400 transition-colors"
        >
          <IconCamera className="w-5 h-5" />
          گرفتن عکس با دوربین
        </button>
      )}
    </div>
  );
}
