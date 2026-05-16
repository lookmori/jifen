'use client';
import { useState, useRef } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';
import { parseExcelFile } from '@/lib/excel';

interface ImportModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (names: string[]) => Promise<void>;
  type: 'class' | 'student';
}

export function ImportModal({ open, onClose, onImport, type }: ImportModalProps) {
  const [importText, setImportText] = useState('');
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const label = type === 'class' ? '班级' : '学生';

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const names = await parseExcelFile(file);
      setImportText(names.join('\n'));
      toast(`已解析 ${names.length} 个名称`, 'success');
    } catch {
      toast('文件解析失败', 'error');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImport = async () => {
    const names = importText.split(/[\n,，]/).map(s => s.trim()).filter(Boolean);
    if (names.length === 0) { toast('请先输入或上传数据', 'error'); return; }
    setImporting(true);
    try {
      await onImport(names);
      setImportText('');
      onClose();
    } catch {
      toast('导入失败', 'error');
    }
    setImporting(false);
  };

  return (
    <Modal open={open} onClose={onClose} title={`📥 批量导入${label}`}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-[var(--color-text)] mb-2">
            上传 Excel 文件
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            className="block w-full text-sm text-[var(--color-text-secondary)] file:mr-4 file:py-2 file:px-4
                       file:rounded-[var(--radius-md)] file:border-0 file:text-sm file:font-bold
                       file:bg-[var(--color-primary)] file:text-white hover:file:brightness-110 cursor-pointer"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-[var(--color-text)] mb-2">
            或粘贴文本（每行一个名称，逗号分隔也可）
          </label>
          <textarea
            value={importText}
            onChange={e => setImportText(e.target.value)}
            placeholder={`示例：\n三（1）班\n三（2）班\n四（1）班`}
            rows={6}
            className="w-full rounded-[var(--radius-md)] border-2 border-[var(--color-border)] p-3 text-sm
                       bg-[var(--color-bg)] text-[var(--color-text)] font-body resize-none
                       focus:outline-none focus:border-[var(--color-primary)]"
          />
        </div>
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={onClose}>取消</Button>
          <Button onClick={handleImport} disabled={importing || !importText.trim()}>
            {importing ? '导入中...' : `导入 ${importText.split(/[\n,，]/).filter(s => s.trim()).length} 条`}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
