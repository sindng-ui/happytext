import React, { useState } from 'react';
import { Book } from '../../types/book';
import { BookOpen, MoreVertical, Edit2, Trash2 } from 'lucide-react';

interface BookCardProps {
  book: Book;
  onSelect: (book: Book) => void;
  onEdit: (book: Book) => void;
  onDelete: (book: Book) => void;
}

export const BookCard: React.FC<BookCardProps> = ({ book, onSelect, onEdit, onDelete }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      style={{
        position: 'relative',
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: '130px',
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
      }}
      onClick={() => onSelect(book)}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--accent-soft)',
                color: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <BookOpen size={18} />
            </div>
            <h3
              style={{
                fontSize: '16px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                lineHeight: 1.3,
                wordBreak: 'keep-all'
              }}
            >
              {book.title}
            </h3>
          </div>

          <button
            style={{
              padding: '6px',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)'
            }}
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
          >
            <MoreVertical size={18} />
          </button>
        </div>

        <div style={{ marginTop: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}>
          총 {book.totalVolumes}권
        </div>
      </div>

      <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {book.lastReadProgress !== undefined && book.lastReadProgress > 0 ? (
          <div style={{ width: '100%' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '12px',
                color: 'var(--text-muted)',
                marginBottom: '4px'
              }}
            >
              <span>{book.lastReadVolumeTitle || '최근 열람'}</span>
              <span>{Math.round(book.lastReadProgress)}%</span>
            </div>
            <div
              style={{
                width: '100%',
                height: '4px',
                backgroundColor: 'var(--border-color)',
                borderRadius: '2px',
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  width: `${book.lastReadProgress}%`,
                  height: '100%',
                  backgroundColor: 'var(--accent)',
                  borderRadius: '2px'
                }}
              />
            </div>
          </div>
        ) : (
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>아직 안 읽음</span>
        )}
      </div>

      {/* 팝업 컨텍스트 메뉴 */}
      {menuOpen && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 100 }}
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(false);
            }}
          />
          <div
            className="animate-fade-in"
            style={{
              position: 'absolute',
              top: '44px',
              right: '12px',
              backgroundColor: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              boxShadow: '0 6px 16px rgba(0,0,0,0.4)',
              zIndex: 101,
              overflow: 'hidden',
              minWidth: '120px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              style={{
                width: '100%',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                color: 'var(--text-primary)',
                textAlign: 'left'
              }}
              onClick={() => {
                setMenuOpen(false);
                onEdit(book);
              }}
            >
              <Edit2 size={14} /> 이름 수정
            </button>
            <button
              style={{
                width: '100%',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                color: 'var(--danger)',
                textAlign: 'left'
              }}
              onClick={() => {
                setMenuOpen(false);
                onDelete(book);
              }}
            >
              <Trash2 size={14} /> 삭제하기
            </button>
          </div>
        </>
      )}
    </div>
  );
};
