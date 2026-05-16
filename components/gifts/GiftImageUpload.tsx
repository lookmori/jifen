'use client';
import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/Toast';
import { compressImage } from '@/lib/image';

interface GiftImageUploadProps {
  onUploaded: (url: string) => void;
  currentUrl?: string;
}

export function GiftImageUpload({ onUploaded, currentUrl }: GiftImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentUrl || '');
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
        toast('上传成功！', 'success');
      } else {
        toast(data.error || '上传失败', 'error');
      }
    } catch {
      toast('上传失败，请重试', 'error');
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div>
      <div
        onClick={() => fileInputRef.current?.click()}
        className="w-full aspect-[4/3] rounded-[var(--radius-md)] border-2 border-dashed border-[var(--color-border)]
                   bg-[var(--color-bg)] flex flex-col items-center justify-center gap-2 cursor-pointer
                   hover:border-[var(--color-primary)] transition-colors overflow-hidden relative"
      >
        {preview ? (
          <img src={preview} alt="预览" className="w-full h-full object-cover" />
        ) : (
          <>
            {uploading ? (
              <Loader2 size={32} className="animate-spin text-[var(--color-primary)]" />
            ) : (
              <Upload size={32} className="text-[var(--color-text-secondary)]" />
            )}
            <span className="text-xs text-[var(--color-text-secondary)]">
              {uploading ? '上传中...' : '点击上传图片 (≤ 2MB)'}
            </span>
          </>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1 }}
            >
              <Loader2 size={36} className="text-white" />
            </motion.div>
          </div>
        )}
      </div>
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
