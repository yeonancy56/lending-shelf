// Adds page-friendly checks like expect(...).toBeInTheDocument() to every test,
// and clears the pretend page after each test so the next one starts fresh.
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(cleanup);
