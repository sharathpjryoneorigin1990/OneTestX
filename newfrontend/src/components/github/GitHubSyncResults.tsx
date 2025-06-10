import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface GitHubSyncResultsProps {
  isVisible: boolean;
  syncedFiles: string[];
  onClose: () => void;
}

const GitHubSyncResults: React.FC<GitHubSyncResultsProps> = ({ 
  isVisible, 
  syncedFiles, 
  onClose 
}) => {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (!isVisible) {
      setIsClosing(false);
    }
  }, [isVisible]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: isClosing ? 0 : 1 }}
      transition={{ duration: 0.3 }}
      onClick={handleClose}
    >
      <motion.div
        className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 shadow-xl"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: isClosing ? 0.9 : 1, y: isClosing ? 20 : 0 }}
        transition={{ duration: 0.3 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-green-400">GitHub Sync Successful</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-4">
          <p className="text-gray-300 mb-2">
            The following files were successfully synced:
          </p>
          <div className="bg-gray-900 rounded-md p-3 max-h-60 overflow-y-auto">
            {syncedFiles.length > 0 ? (
              <ul className="text-sm">
                {syncedFiles.map((file, index) => (
                  <li key={index} className="mb-1 text-green-300 flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{file}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 italic">No files were synced.</p>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default GitHubSyncResults;
