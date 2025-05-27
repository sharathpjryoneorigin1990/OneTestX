import * as React from 'react';

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue: string;
  children: React.ReactNode;
  onValueChange?: (value: string) => void;
  value?: string;
}

export interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {}

export interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  children: React.ReactNode;
}
export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  children: React.ReactNode;
}

const TabsContext = React.createContext<{
  value: string;
  setValue: (value: string) => void;
}>({
  value: '',
  setValue: () => {},
});

export function Tabs({ 
  defaultValue, 
  children, 
  onValueChange, 
  value: controlledValue,
  ...props 
}: TabsProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : internalValue;

  const setValue = React.useCallback(
    (newValue: string) => {
      if (!isControlled) {
        setInternalValue(newValue);
      }
      onValueChange?.(newValue);
    },
    [isControlled, onValueChange]
  );

  return (
    <TabsContext.Provider value={{ value, setValue }}>
      <div {...props}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className = '', children, ...props }: TabsListProps) {
  return (
    <div 
      className={`flex items-center justify-start p-1 rounded-md bg-gray-100 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({ 
  value, 
  className = '', 
  children, 
  ...props 
}: TabsTriggerProps) {
  const { value: currentValue, setValue } = React.useContext(TabsContext);
  const isActive = currentValue === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
        isActive 
          ? 'bg-white shadow-sm text-gray-900' 
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
      } ${className}`}
      onClick={() => setValue(value)}
      {...props}
    >
      {children}
    </button>
  );
}

export function TabsContent({ 
  value, 
  className = '', 
  children, 
  ...props 
}: TabsContentProps) {
  const { value: currentValue } = React.useContext(TabsContext);
  
  if (currentValue !== value) return null;
  
  return (
    <div className={`mt-2 ${className}`} {...props}>
      {children}
    </div>
  );
}
