import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { Route } from '@/routes/_authenticated/chat.$userId';

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (options: Record<string, unknown>) => ({
    options, useParams: () => ({ userId: 'recipient' }), useSearch: () => ({}),
  }),
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}));
vi.mock('@tanstack/react-query', () => ({ useQuery: () => ({ data: undefined }), useQueryClient: () => ({ invalidateQueries: vi.fn() }) }));
vi.mock('@tanstack/react-start', () => ({ useServerFn: () => vi.fn() }));
vi.mock('@/lib/session', () => ({ useMe: () => ({ data: null }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {} }));
vi.mock('@/lib/support.functions', () => ({ sendSupportMessage: vi.fn() }));
vi.mock('@/lib/chat-upload.functions', () => ({ sendChatEntry: vi.fn(), viewChatImage: vi.fn(), deleteChatEntry: vi.fn() }));
vi.mock('@/components/PostEvidence', () => ({ PostEvidence: () => null }));
vi.mock('@/components/ProgramEvidence', () => ({ ProgramEvidence: () => null }));

afterEach(() => { cleanup(); vi.restoreAllMocks(); });
describe('chat lifecycle', () => {
  it('does not treat a scrolling adapter return value as an effect cleanup', () => {
    // Embedded previews can supply a scrolling adapter with a non-void result.
    const scroll = vi.fn(() => ({ scrolled: true }));
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { configurable: true, value: scroll });
    const Chat = Route.options.component;
    if (!Chat) throw new Error('Chat component missing');
    const view = render(<Chat />);
    expect(scroll).toHaveBeenCalledOnce();
    expect(() => view.unmount()).not.toThrow();
  });
});