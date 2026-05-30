import React from 'react';

// Card skeleton for loading states
export const BlogCardSkeleton = () => {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflow: 'hidden' }}>
      {/* Cover Image Shimmer */}
      <div className="shimmer" style={{ height: '200px', borderRadius: 'var(--radius-sm)', width: '100%' }} />

      {/* Meta Tag Shimmer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="shimmer" style={{ height: '18px', width: '60px', borderRadius: '10px' }} />
        <div className="shimmer" style={{ height: '14px', width: '80px', borderRadius: '4px' }} />
      </div>

      {/* Title Shimmer */}
      <div className="shimmer" style={{ height: '24px', width: '90%', borderRadius: '4px' }} />
      <div className="shimmer" style={{ height: '24px', width: '50%', borderRadius: '4px' }} />

      {/* Excerpt Shimmer */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <div className="shimmer" style={{ height: '14px', width: '100%', borderRadius: '2px' }} />
        <div className="shimmer" style={{ height: '14px', width: '95%', borderRadius: '2px' }} />
      </div>

      {/* Footer / Author Shimmer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
        <div className="shimmer" style={{ height: '36px', width: '36px', borderRadius: '50%' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1 }}>
          <div className="shimmer" style={{ height: '14px', width: '100px', borderRadius: '2px' }} />
          <div className="shimmer" style={{ height: '12px', width: '60px', borderRadius: '2px' }} />
        </div>
      </div>
    </div>
  );
};

// Grid of card skeletons
export const BlogGridSkeleton = ({ count = 6 }) => {
  return (
    <div style={gridStyle}>
      {Array(count).fill(0).map((_, i) => (
        <BlogCardSkeleton key={i} />
      ))}
    </div>
  );
};

// Detail page skeleton
export const BlogDetailSkeleton = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '800px', margin: '2rem auto' }}>
      {/* Category badge */}
      <div className="shimmer" style={{ height: '20px', width: '80px', borderRadius: '10px' }} />

      {/* Title */}
      <div className="shimmer" style={{ height: '40px', width: '100%', borderRadius: '6px' }} />
      <div className="shimmer" style={{ height: '40px', width: '60%', borderRadius: '6px' }} />

      {/* Author and Date */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div className="shimmer" style={{ height: '48px', width: '48px', borderRadius: '50%' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div className="shimmer" style={{ height: '16px', width: '120px', borderRadius: '4px' }} />
          <div className="shimmer" style={{ height: '12px', width: '80px', borderRadius: '4px' }} />
        </div>
      </div>

      {/* Large Cover Image */}
      <div className="shimmer" style={{ height: '400px', borderRadius: 'var(--radius-md)', width: '100%' }} />

      {/* Body content lines */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
        <div className="shimmer" style={{ height: '16px', width: '100%', borderRadius: '4px' }} />
        <div className="shimmer" style={{ height: '16px', width: '100%', borderRadius: '4px' }} />
        <div className="shimmer" style={{ height: '16px', width: '95%', borderRadius: '4px' }} />
        <div className="shimmer" style={{ height: '16px', width: '90%', borderRadius: '4px' }} />
        <div className="shimmer" style={{ height: '16px', width: '100%', borderRadius: '4px' }} />
        <div className="shimmer" style={{ height: '16px', width: '80%', borderRadius: '4px' }} />
      </div>
    </div>
  );
};

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
  gap: '2rem',
  width: '100%'
};
