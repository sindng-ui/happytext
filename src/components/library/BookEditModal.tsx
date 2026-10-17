import React, { useState, useRef } from 'react';
import { Book } from '../../types/book';
import { X, Upload, FolderPlus } from 'lucide-react';

interface BookEditModalProps {
  isOpen: boolean;
  bookToEdit?: Book | null;
  onClose: () => void;
  onSaveNew: (title: string, files: File[]) => Promise<void>;
  onSaveEdit: (bookId: string, newTitle: string) => Promise<void>;
}

export const BookEditModal: React.FC<BookEditModalProps> = ({
  isOpen,
  bookToEdit,
  onClose,
  onSaveNew,
  onSaveEdit
}) => {
  const [title, setTitle] = useState(bookToEdit ? bookToEdit.title : '');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (bookToEdit) {
      setTitle(bookToEdit.title);
      setSelectedFiles([]);
    } else {
      setTitle('');
      setSelectedFiles([]);
    }
  }, [bookToEdit, isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files).filter((f) => f.name.endsWith('.txt'));
      setSelectedFiles(filesArray);

      // 파일 선택 시 작품 제목이 비어있으면 파일명 또는 폴더명에서 추정
      if (!title && filesArray.length > 0) {
        const first = filesArray[0].name.replace(/\.txt$/i, '');
        const match = first.match(/^(.*?)(?:\s*\d+권|\s*\d+|\s*_vol)/i);
        setTitle(match ? match[1].trim() : first);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (bookToEdit) {
      if (!title.trim()) return;
      setSubmitting(true);
      await onSaveEdit(bookToEdit.id, title);
      setSubmitting(false);
      onClose();
    } else {
      if (selectedFiles.length === 0) {
        alert('최소 1개 이상의 .txt 파일을 선택해주세요.');
        return;
      }
      setSubmitting(true);
      await onSaveNew(title, selectedFiles);
      setSubmitting(false);
      onClose();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'var(--bg-overlay)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        className="animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '380px',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px 20px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>
            {bookToEdit ? '작품 이름 수정' : '새 작품 추가'}
          </h3>
          <button onClick={onClose} style={{ color: 'var(--text-secondary)', padding: '4px' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              작품 제목
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 묵향, 비뢰도, 나혼자만 레벨업"
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                fontSize: '15px'
              }}
              required
            />
          </div>

          {!bookToEdit && (
            <div>
              <label
                style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}
              >
                텍스트 파일 선택 (.txt)
              </label>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".txt"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />

              <div
                style={{
                  border: '1.5px dashed var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '18px',
                  textAlign: 'center',
                  backgroundColor: 'var(--bg-surface-elevated)',
                  cursor: 'pointer'
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', color: 'var(--accent)', marginBottom: '6px' }}>
                  <Upload size={22} />
                  <FolderPlus size={22} />
                </div>
                <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500 }}>
                  {selectedFiles.length > 0
                    ? `${selectedFiles.length}개의 파일 선택됨`
                    : '파일 선택 (여러 권 다중 선택 가능)'}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  모바일 폰의 txt 파일들을 선택해주세요
                </div>
              </div>

              {selectedFiles.length > 0 && (
                <div
                  style={{
                    maxHeight: '100px',
                    overflowY: 'auto',
                    marginTop: '8px',
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    backgroundColor: 'var(--bg-surface-elevated)',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)'
                  }}
                >
                  {selectedFiles.slice(0, 5).map((f, i) => (
                    <div key={i} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      • {f.name}
                    </div>
                  ))}
                  {selectedFiles.length > 5 && (
                    <div style={{ color: 'var(--accent)', marginTop: '2px' }}>
                      외 {selectedFiles.length - 5}개 더 있음...
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 16px',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-secondary)',
                fontSize: '14px'
              }}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '10px 20px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--accent)',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 600,
                opacity: submitting ? 0.7 : 1
              }}
            >
              {submitting ? '저장 중...' : bookToEdit ? '수정 완료' : '추가하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
