import React, { useRef, useState } from 'react';
import { Upload, Image as ImageIcon, X, Sparkles, Maximize2 } from 'lucide-react';

interface ImageUploadInputProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  presets?: string[];
  presetList?: string[];
  helperText?: string;
}

export const ImageUploadInput: React.FC<ImageUploadInputProps> = ({
  label,
  value,
  onChange,
  placeholder = 'https://... или загрузите фото из галереи',
  presets,
  presetList,
  helperText
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageMeta, setImageMeta] = useState<{ width: number; height: number; format: string } | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const activePresets = presets || presetList;

  // Preserve full image fidelity, format, and aspect ratio without artificial cropping
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();

    reader.onload = event => {
      const dataUrl = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const width = img.width;
        const height = img.height;
        const mimeType = file.type || 'image/jpeg';
        const isPng = mimeType.includes('png');
        const isWebp = mimeType.includes('webp');
        const formatName = isPng ? 'PNG' : isWebp ? 'WEBP' : 'JPEG';

        setImageMeta({ width, height, format: `${width}×${height} (${formatName})` });

        // If file is already reasonable in size (<= 4MB) and not ultra-huge (> 3200px),
        // keep pristine original data URL to avoid ANY loss of quality or transparency!
        const maxDimension = 3200;
        if (file.size <= 4 * 1024 * 1024 && width <= maxDimension && height <= maxDimension) {
          onChange(dataUrl);
          setIsProcessing(false);
          return;
        }

        // Only scale down if extremely massive to avoid breaking memory/network
        let targetWidth = width;
        let targetHeight = height;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            targetHeight = Math.round((height * maxDimension) / width);
            targetWidth = maxDimension;
          } else {
            targetWidth = Math.round((width * maxDimension) / height);
            targetHeight = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
          // Preserve PNG transparency or use high quality 0.95
          const outputType = isPng ? 'image/png' : 'image/jpeg';
          const compressedDataUrl = canvas.toDataURL(outputType, isPng ? undefined : 0.95);
          onChange(compressedDataUrl);
        } else {
          onChange(dataUrl);
        }
        setIsProcessing(false);
      };

      img.onerror = () => {
        setIsProcessing(false);
        alert('Не удалось распознать формат изображения.');
      };

      img.src = dataUrl;
    };

    reader.onerror = () => {
      setIsProcessing(false);
      alert('Ошибка при чтении файла с устройства');
    };

    reader.readAsDataURL(file);
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
            Обработка фото в полном разрешении...
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={value}
            onChange={e => {
              onChange(e.target.value);
              setImageMeta(null);
            }}
            placeholder={placeholder}
            className="w-full pl-3 pr-8 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-zinc-100 placeholder-zinc-500 font-mono-pip focus:outline-none focus:border-amber-400"
          />
          {value && (
            <button
              type="button"
              onClick={() => {
                onChange('');
                setImageMeta(null);
              }}
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
          title="Загрузить фотографию с телефона или компьютера в полном размере"
        >
          <Upload className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Из галереи (полный размер)</span>
          <span className="sm:hidden">Галерея</span>
        </button>
      </div>

      {helperText && (
        <p className="text-[10px] text-zinc-400 font-mono-pip">{helperText}</p>
      )}

      {/* Preset Quick Picks */}
      {activePresets && activePresets.length > 0 && (
        <div className="flex items-center gap-1.5 pt-1 overflow-x-auto">
          <span className="text-[9px] font-mono-pip text-zinc-500 shrink-0">
            Шаблоны:
          </span>
          {activePresets.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                onChange(p);
                setImageMeta(null);
              }}
              className="w-6 h-6 rounded-md overflow-hidden border border-zinc-700 hover:border-amber-400 shrink-0 opacity-70 hover:opacity-100 transition"
            >
              <img src={p} alt="preset" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Live Preview Thumbnail - Full uncropped preview with ambient background */}
      {value && (
        <div className="relative mt-2">
          <div
            onClick={() => setIsPreviewModalOpen(true)}
            className="relative w-full h-28 sm:h-36 rounded-xl overflow-hidden border border-zinc-700 hover:border-amber-400/80 bg-zinc-950 flex items-center justify-center group cursor-pointer shadow-md transition"
            title="Нажмите для просмотра в полный размер"
          >
            {/* Ambient blurred backdrop so any aspect ratio looks beautiful without cropping */}
            <div
              className="absolute inset-0 bg-cover bg-center filter blur-md opacity-30 scale-110 pointer-events-none"
              style={{ backgroundImage: `url(${value})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

            {/* Uncropped full image */}
            <img
              src={value}
              alt="Preview"
              className="relative z-10 max-h-full max-w-full object-contain filter drop-shadow-md"
              onError={e => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />

            <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition px-2 py-0.5 rounded-lg bg-black/80 border border-zinc-700 text-[10px] text-zinc-200 flex items-center gap-1">
              <Maximize2 className="w-3 h-3 text-amber-400" />
              <span>На весь экран</span>
            </div>

            <div className="absolute bottom-1.5 right-2 z-20 px-2 py-0.5 rounded-full bg-black/80 border border-zinc-700 text-[9px] font-mono-pip text-amber-300 flex items-center gap-1 shadow">
              <ImageIcon className="w-2.5 h-2.5 text-amber-400" />
              <span>В полном размере {imageMeta?.format ? `• ${imageMeta.format}` : ''}</span>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Modal Preview */}
      {isPreviewModalOpen && value && (
        <div
          onClick={() => setIsPreviewModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md cursor-zoom-out animate-fade-in"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="relative max-w-4xl max-h-[90vh] bg-zinc-950 rounded-3xl border border-zinc-700 overflow-hidden flex flex-col shadow-2xl"
          >
            <div className="p-3 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
              <span className="text-xs font-mono-pip text-amber-400 font-bold flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Оригинальное изображение (100% без обрезки)</span>
              </span>
              <button
                type="button"
                onClick={() => setIsPreviewModalOpen(false)}
                className="p-1 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center overflow-auto max-h-[80vh] bg-black">
              <img
                src={value}
                alt="Full preview"
                className="max-h-[76vh] max-w-full object-contain rounded-xl shadow-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
