import { vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import '../i18n';

vi.mock('canvas-confetti', () => ({ default: () => Promise.resolve() }));
