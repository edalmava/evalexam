import { describe, it, expect } from 'vitest';
import {
  subscribeEvaluationsChanges,
  getEvaluationsVersion,
  notifyEvaluationsChanged,
} from './evaluationsEvents';

describe('evaluationsEvents - refresco global de evaluaciones', () => {
  it('notifyEvaluationsChanged incrementa la versión', () => {
    const before = getEvaluationsVersion();
    notifyEvaluationsChanged();
    expect(getEvaluationsVersion()).toBe(before + 1);
  });

  it('notifica a los suscriptores y deja de hacerlo al desuscribirse', () => {
    let calls = 0;
    const unsubscribe = subscribeEvaluationsChanges(() => {
      calls += 1;
    });
    notifyEvaluationsChanged();
    notifyEvaluationsChanged();
    expect(calls).toBe(2);
    unsubscribe();
    notifyEvaluationsChanged();
    expect(calls).toBe(2);
  });

  it('mantiene versiones independientes por evento y no resetea', () => {
    const baseline = getEvaluationsVersion();
    notifyEvaluationsChanged();
    notifyEvaluationsChanged();
    notifyEvaluationsChanged();
    expect(getEvaluationsVersion()).toBe(baseline + 3);
  });
});
