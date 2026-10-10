import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const Pagination = ({
  currentPage = 0,
  totalPages = 1,
  totalElements = 0,
  pageSize = 10,
  onPageChange
}) => {
  if (totalPages <= 1) return null;

  const startIdx = currentPage * pageSize + 1;
  const endIdx = Math.min((currentPage + 1) * pageSize, totalElements);

  return (
    <div className="pagination">
      <div>
        Showing <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{startIdx}</span> to{' '}
        <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{endIdx}</span> of{' '}
        <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{totalElements}</span> entries
      </div>
      <div className="pagination-controls">
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 0}
        >
          <ChevronLeft size={16} /> Previous
        </button>
        <span style={{ padding: '0 8px', fontSize: '0.85rem' }}>
          Page <strong>{currentPage + 1}</strong> of <strong>{totalPages}</strong>
        </span>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages - 1}
        >
          Next <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
