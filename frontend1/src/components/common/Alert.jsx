import React from 'react';
import { 
  CheckCircleIcon, 
  ExclamationCircleIcon, 
  InformationCircleIcon, 
  ExclamationTriangleIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline';

const Alert = ({ type = 'info', message, onClose }) => {
  const configs = {
    success: {
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-800',
      iconColor: 'text-green-600',
      Icon: CheckCircleIcon
    },
    error: {
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-800',
      iconColor: 'text-red-600',
      Icon: ExclamationCircleIcon
    },
    warning: {
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-800',
      iconColor: 'text-yellow-600',
      Icon: ExclamationTriangleIcon
    },
    info: {
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-800',
      iconColor: 'text-blue-600',
      Icon: InformationCircleIcon
    }
  };

  const config = configs[type] || configs.info;
  const Icon = config.Icon;

  return (
    <div className={`${config.bgColor} ${config.borderColor} border-l-4 rounded-lg p-4 flex items-start gap-3 shadow-sm`}>
      <Icon className={`h-5 w-5 ${config.iconColor} flex-shrink-0 mt-0.5`} />
      <span className={`flex-1 ${config.textColor} text-sm font-medium`}>{message}</span>
      {onClose && (
        <button 
          onClick={onClose}
          className={`${config.iconColor} hover:opacity-70 transition-opacity flex-shrink-0`}
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      )}
    </div>
  );
};

export default Alert;
