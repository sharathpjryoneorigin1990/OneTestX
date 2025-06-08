import React from 'react';
import { FiPlay, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

interface TestStep {
  id: string;
  action: string;
  selector?: string;
  value?: string;
  timestamp?: number;
}

interface TestStepsProps {
  steps: TestStep[];
  activeStep: number | null;
  isRecording: boolean;
  onStepClick: (index: number) => void;
}

export const TestSteps: React.FC<TestStepsProps> = ({
  steps,
  activeStep,
  isRecording,
  onStepClick
}) => {
  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      <div className="px-4 py-3 bg-gray-700 border-b border-gray-600">
        <h3 className="text-lg font-medium text-white">
          Test Steps {steps?.length ? `(${steps.length})` : ''}
        </h3>
      </div>
      
      {steps?.length ? (
        <div className="divide-y divide-gray-700">
          <AnimatePresence>
            {steps.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 hover:bg-gray-750">
                  <div 
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => onStepClick(index)}
                  >
                    <div className="flex items-center">
                      <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-600 text-white text-xs font-medium mr-3">
                        {index + 1}
                      </span>
                      <span className="font-medium text-white">
                        {step.action} {step.selector ? `on ${step.selector}` : ''}
                      </span>
                    </div>
                    {activeStep === index ? (
                      <FiChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <FiChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  
                  {activeStep === index && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-3 pl-9 text-sm text-gray-300 space-y-2"
                    >
                      <div>
                        <span className="font-medium">Action:</span> {step.action}
                      </div>
                      {step.selector && (
                        <div>
                          <span className="font-medium">Selector:</span> {step.selector}
                        </div>
                      )}
                      {step.value && (
                        <div>
                          <span className="font-medium">Value:</span> {step.value}
                        </div>
                      )}
                      {step.timestamp && (
                        <div className="text-xs text-gray-500">
                          {new Date(step.timestamp).toLocaleString()}
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
          <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mb-4">
            <FiPlay className="w-8 h-8 text-gray-600" />
          </div>
          <h4 className="text-lg font-medium text-gray-300 mb-1">No steps recorded yet</h4>
          <p className="max-w-xs text-sm">
            {isRecording 
              ? 'Interact with the page to record actions'
              : 'Click "Start Recording" to start recording actions'}
          </p>
        </div>
      )}
    </div>
  );
};
