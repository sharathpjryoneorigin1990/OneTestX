'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { FiMessageCircle } from 'react-icons/fi'; // FiX is not used here
import NaturalLanguageQuery from './NaturalLanguageQuery';

const FloatingChatLauncher = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  const buttonContainerVariants = {
    initial: { scale: 0, opacity: 0, y: 20 },
    animate: {
      scale: 1,
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 260, damping: 20, delay: 0.5 },
    },
    exit: { scale: 0, opacity: 0, y: 20, transition: { duration: 0.2 } },
  };

  return (
    <>
      <AnimatePresence>
        {!isChatOpen && (
          <motion.div
            variants={buttonContainerVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="fixed bottom-5 right-5 md:bottom-10 md:right-10 z-40"
          >
            <Button
              variant="primary"
              className="rounded-full w-14 h-14 shadow-lg flex items-center justify-center"
              onClick={toggleChat}
              aria-label="Open AI Query Chat"
            >
              <FiMessageCircle className="w-7 h-7" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
      {/* NaturalLanguageQuery will be animated within its own component */}
      <NaturalLanguageQuery isOpen={isChatOpen} onClose={toggleChat} />
    </>
  );
};

export default FloatingChatLauncher;
