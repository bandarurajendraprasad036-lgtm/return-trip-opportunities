import { toast as originalToast } from 'sonner';
import { jsx } from './localized-jsx';

export * from 'sonner';
const localize = (args: unknown[]) => args.map((value, index) => index === 0 && typeof value === 'string' ? jsx('span', { children: value }) : value);
export const toast = new Proxy(originalToast, {
  apply(target, receiver, args) { return Reflect.apply(target, receiver, localize(args)); },
  get(target, property, receiver) {
    const value: unknown = Reflect.get(target, property, receiver);
    return typeof value === 'function' && ['success', 'error', 'info', 'warning', 'loading', 'message'].includes(String(property))
      ? new Proxy(value, { apply(fn, self, args) { return Reflect.apply(fn, self, localize(args)); } })
      : value;
  },
});