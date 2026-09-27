import React, { useRef, useState } from 'react';
import { Upload, Image as ImageIcon, X, Sparkles } from 'lucide-react';

interface ImageUploadInputProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  presets?: string[];
  helperText?: string;
}

export const ImageUploadInput: React.FC<ImageUploadInputProps> = ({
  label,
  value,
  onChange,
  placeholder = 'https://... или загрузите фото из галереи',
  presets,
  helperText
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Resize and compress uploaded image using HTML5 Canvas to keep data snappy and responsive
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();

    reader.onload = event => {
      const img = new Image();
      img.onload = () => {
        const maxWidth = 900;
        const maxHeight = 900;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
          onChange(compressedDataUrl);
        } else {
          onChange(event.target?.result as string);
        }
        setIsProcessing(false);
      };

      img.src = event.target?.result as string;
    };

    reader.onerror = () => {
      setIsProcessing(false);
      alert('Ошибка при чтении файла с устройства');
    };

    reader.readAsDataURL(file);
    // Reset file input
    e.target.value = '';
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-mono-pip text-zinc-300">
          {label}
        </label>
        {isProcessing && (
          <span className="text-[10px] font-mono-pip text-amber-400 animate-pulse">
            Обработка фото...
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-3 pr-8 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-zinc-100 placeholder-zinc-500 font-mono-pip focus:outline-none focus:border-amber-400"
          />
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="absolute right-2 top-2.5 text-zinc-500 hover:text-white"
              title="Очистить"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Upload Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 hover:border-amber-400/80 text-zinc-200 hover:text-amber-300 text-xs font-heading font-bold uppercase tracking-wider transition shrink-0 shadow active:scale-95"
          title="Загрузить фотографию с телефона или компьютера"
        >
          <Upload className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Из галереи</span>
          <span className="sm:hidden">Галерея</span>
        </button>
      </div>

      {helperText && (
        <p className="text-[10px] text-zinc-400 font-mono-pip">{helperText}</p>
      )}

      {/* Preset Quick Picks */}
      {presets && presets.length > 0 && (
        <div className="flex items-center gap-1.5 pt-1 overflow-x-auto">
          <span className="text-[9px] font-mono-pip text-zinc-500 shrink-0">
            Шаблоны:
          </span>
          {presets.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onChange(p)}
              className="w-6 h-6 rounded-md overflow-hidden border border-zinc-700 hover:border-amber-400 shrink-0 opacity-70 hover:opacity-100 transition"
            >
              <img src={p} alt="preset" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Live Preview Thumbnail */}
      {value && (
        <div className="relative mt-2 w-full h-24 sm:h-28 rounded-xl overflow-hidden border border-zinc-700 bg-black/60 flex items-center justify-center group">
          <img
            src={value}
            alt="Preview"
            className="w-full h-full object-cover"
            onError={e => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <div className="absolute bottom-1 right-2 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-mono-pip text-amber-300 flex items-center gap-1">
            <ImageIcon className="w-2.5 h-2.5" /> Превью фото
          </div>
        </div>
      )}
    </div>
  );
};
