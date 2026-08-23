import '@testing-library/jest-dom/vitest';
import React from 'react';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

if (!window.HTMLElement.prototype.scrollIntoView) {
  window.HTMLElement.prototype.scrollIntoView = () => {};
}

vi.mock('framer-motion', () => {
  const createMotionComponent = (tag) =>
    React.forwardRef(({ children, ...props }, ref) => {
      const cleanProps = { ...props };
      delete cleanProps.initial;
      delete cleanProps.animate;
      delete cleanProps.exit;
      delete cleanProps.transition;
      delete cleanProps.whileHover;
      delete cleanProps.whileTap;
      delete cleanProps.variants;
      delete cleanProps.layout;
      return React.createElement(tag, { ...cleanProps, ref }, children);
    });

  const motion = new Proxy(
    {},
    {
      get: (_, property) => createMotionComponent(property),
    },
  );

  return {
    motion,
    AnimatePresence: ({ children }) => React.createElement(React.Fragment, null, children),
  };
});
