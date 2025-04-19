// Polyfill for NextResponse and other Next.js utilities
global.Response = class extends Response {
  constructor(body, init) {
    super(body, init);
    this.status = init?.status || 200;
  }
};

global.Headers = Headers;

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
})); 