import { useSyncExternalStore } from 'react';

type Listener = () => void;

let version = 0;
const listeners = new Set<Listener>();

export const subscribeEvaluationsChanges = (listener: Listener): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const getEvaluationsVersion = (): number => version;

export const notifyEvaluationsChanged = (): void => {
  version += 1;
  listeners.forEach((listener) => listener());
};

export const useEvaluationsVersion = (): number =>
  useSyncExternalStore(subscribeEvaluationsChanges, getEvaluationsVersion);
