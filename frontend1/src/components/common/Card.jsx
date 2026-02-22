import React from 'react';

const Card = ({
  children,
  title,
  actions,
  className = '',
  headerClassName = '',
  titleClassName = '',
  contentClassName = '',
  hover = true
}) => {
  const hoverClass = hover ? 'hover:shadow-lg transition-shadow duration-200' : '';
  
  return (
    <div className={`bg-black/40 text-white rounded-xl shadow-soft border border-[#D4AF37]/20 overflow-hidden ${hoverClass} ${className}`}>
      {title && (
        <div className={`px-6 py-4 border-b border-[#D4AF37]/20 flex items-center justify-between bg-black/50 ${headerClassName}`}>
          <h3 className={`text-lg font-semibold text-[#D4AF37] ${titleClassName}`}>{title}</h3>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={`p-6 ${contentClassName}`}>
        {children}
      </div>
    </div>
  );
};

export default Card;
