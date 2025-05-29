import { Button } from '@/components/ui/Button';
import { Zap, GitBranch, Plus, Rocket, Bug, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

const actions = [
  {
    id: 'run-tests',
    icon: <Zap className="h-5 w-5" />,
    label: 'Run All Tests',
    description: 'Execute all test suites',
    color: 'from-blue-500 to-cyan-500',
    hover: 'hover:from-blue-600 hover:to-cyan-600',
    delay: 0.1
  },
  {
    id: 'new-branch',
    icon: <GitBranch className="h-5 w-5" />,
    label: 'New Branch',
    description: 'Create feature branch',
    color: 'from-purple-500 to-pink-500',
    hover: 'hover:from-purple-600 hover:to-pink-600',
    delay: 0.2
  },
  {
    id: 'new-test',
    icon: <Plus className="h-5 w-5" />,
    label: 'New Test',
    description: 'Create new test file',
    color: 'from-emerald-500 to-teal-500',
    hover: 'hover:from-emerald-600 hover:to-teal-600',
    delay: 0.3
  },
  {
    id: 'debug',
    icon: <Bug className="h-5 w-5" />,
    label: 'Debug',
    description: 'Start debug session',
    color: 'from-amber-500 to-orange-500',
    hover: 'hover:from-amber-600 hover:to-orange-600',
    delay: 0.4
  }
];

export function QuickActions() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Quick Actions</h3>
        <Button variant="ghost" size="sm" className="text-xs text-blue-400 hover:text-blue-300">
          <Settings className="h-3.5 w-3.5 mr-1" />
          Customize
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {actions.map((action, index) => (
          <motion.div
            key={action.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              delay: action.delay,
              type: 'spring',
              stiffness: 100,
              damping: 10
            }}
            whileHover={{ 
              y: -2,
              transition: { duration: 0.2 }
            }}
          >
            <Button
              variant="outline"
              className={`h-24 w-full flex-col gap-2 bg-gradient-to-br ${action.color} ${action.hover} border-0 text-white hover:text-white/90 transition-all duration-200`}
            >
              <div className="p-2 rounded-full bg-white/10 backdrop-blur-sm">
                {action.icon}
              </div>
              <span className="font-medium text-sm">{action.label}</span>
              <span className="text-xs font-normal opacity-80">{action.description}</span>
            </Button>
          </motion.div>
        ))}
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="pt-2"
      >
        <Button 
          variant="outline" 
          className="w-full bg-dark-800/50 hover:bg-dark-700/50 border-dark-700 text-amber-400 hover:text-amber-300 group"
        >
          <Rocket className="h-4 w-4 mr-2 text-amber-400 group-hover:animate-pulse" />
          Run Performance Test Suite
        </Button>
      </motion.div>
    </div>
  );
}
