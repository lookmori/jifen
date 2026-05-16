// 前端图片压缩 —— 用 Canvas 缩小尺寸 + 转 WebP，控制输出大小
const MAX_WIDTH = 1024;
const MAX_HEIGHT = 1024;
const QUALITY = 0.75;
const MAX_OUTPUT_SIZE = 2 * 1024 * 1024; // 2MB 兜底

export async function compressImage(file: File): Promise<File> {
  // GIF 动图跳过压缩，保留动画
  if (file.type === 'image/gif') return file;
  // 小于 500KB 的图片直接通过
  if (file.size < 500 * 1024) return file;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;
      if (width > MAX_WIDTH || height > MAX_HEIGHT) {
        if (width > height) {
          height = Math.round((height / width) * MAX_WIDTH);
          width = MAX_WIDTH;
        } else {
          width = Math.round((width / height) * MAX_HEIGHT);
          height = MAX_HEIGHT;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);

      const tryConvert = (q: number) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) { reject(new Error('压缩失败')); return; }

            if (blob.size > MAX_OUTPUT_SIZE && q > 0.3) {
              tryConvert(q - 0.15);
            } else {
              resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), {
                type: 'image/webp',
              }));
            }
          },
          'image/webp',
          q,
        );
      };

      tryConvert(QUALITY);
    };

    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('图片加载失败')); };
    img.src = url;
  });
}
