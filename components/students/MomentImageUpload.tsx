'use client';
import { useState, useRef } from 'react';
import { Loader2, X, ImageIcon } from 'lucide-react';
import { toast } from '@/components/ui/Toast';
import { compressImage } from '@/lib/image';

interface MomentImageUploadProps {
  onUploaded: (url: string) => void;
  onRemove: () => void;
  imageUrl?: string;
}

export function MomentImageUpload({ onUploaded, onRemove, imageUrl }: MomentImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(imageUrl || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) {
      toast('只支持 PNG、JPEG、WebP、GIF', 'error');
      return;
    }

    setUploading(true);
    try {
      const compressed = await compressImage(file);
      const formData = new FormData();
      formData.append('file', compressed);

      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success && data.data?.url) {
        setPreview(data.data.url);
        onUploaded(data.data.url);
      } else {
        toast(data.error || '上传失败', 'error');
      }
    } catch {
      toast('上传失败，请重试', 'error');
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemove = () => {
    setPreview('');
    onRemove();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div>
      <label className="text-sm font-bold text-[var(--color-text-secondary)] mb-1.5 block">
        📸 精彩瞬间照片 <span className="text-xs font-normal text-[var(--color-text-secondary)]">(可选)</span>
      </label>
      {preview ? (
        <div className="relative rounded-[var(--radius-md)] overflow-hidden border-2 border-[var(--color-border)]">
          <img src={preview} alt="预览" className="w-full h-32 object-cover" />
          <button
            onClick={handleRemove}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <div
          onClick={() => !uploading && fileInputRef.current?.click()}
          className="w-full h-20 rounded-[var(--radius-md)] border-2 border-dashed border-[var(--color-border)]
                     bg-[var(--color-bg)] flex flex-col items-center justify-center gap-1 cursor-pointer
                     hover:border-[var(--color-primary)] transition-colors"
        >
          {uploading ? (
            <>
              <Loader2 size={20} className="animate-spin text-[var(--color-primary)]" />
              <span className="text-xs text-[var(--color-text-secondary)]">上传中...</span>
            </>
          ) : (
            <>
              <ImageIcon size={20} className="text-[var(--color-text-secondary)]" />
              <span className="text-xs text-[var(--color-text-secondary)]">点击上传照片 (≤ 2MB)</span>
            </>
          )}
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={handleUpload}
        className="hidden"
      />
    </div>
  );
}
