import { Fragment, jsx as originalJsx, jsxs as originalJsxs } from 'react/jsx-runtime';
import { jsxDEV as originalDev } from 'react/jsx-dev-runtime';
import { createContext, useContext, type ElementType, type ReactNode } from 'react';
import { translateText, useLanguage } from './language';

const PreserveText = createContext(false);
type Props = Record<string, unknown> & { children?: ReactNode; translate?: string };
const wrappers = new Map<ElementType, ElementType>();
function LocalizedText({ value }: { value: string }) {
  const language = useLanguage();
  const preserve = useContext(PreserveText);
  return preserve ? value : translateText(value, language);
}
function componentProps(props: Props): Props {
  const child = (value: ReactNode, key?: number): ReactNode => typeof value === 'string' ? originalJsx(LocalizedText, { value }, key) : Array.isArray(value) ? value.map(child) : value;
  return props.translate === 'no' ? props : { ...props, children: child(props.children) };
}
function localized(type: ElementType): ElementType {
  // Preserve component identity for Radix portals, slots, providers and routers.
  if (typeof type !== 'string') return type;
  const existing = wrappers.get(type);
  if (existing) return existing;
  function LocalizedElement(props: Props) {
    const language = useLanguage();
    const inherited = useContext(PreserveText);
    const preserve = inherited || props.translate === 'no';
    const next = { ...props };
    if (!preserve) {
      const text = (value: ReactNode): ReactNode => typeof value === 'string' ? translateText(value, language) : Array.isArray(value) ? value.map(text) : value;
      next.children = text(props.children);
      for (const name of ['placeholder', 'title', 'aria-label', 'alt']) {
        if (typeof props[name] === 'string') next[name] = translateText(props[name], language);
      }
    }
    const element = originalJsx(type, next);
    return preserve && !inherited ? originalJsx(PreserveText.Provider, { value: true, children: element }) : element;
  }
  wrappers.set(type, LocalizedElement);
  return LocalizedElement;
}
export { Fragment };
export function jsx(type: ElementType, props: Props, key?: string) { return originalJsx(localized(type), typeof type === 'string' ? props : componentProps(props), key); }
export function jsxs(type: ElementType, props: Props, key?: string) { return originalJsxs(localized(type), typeof type === 'string' ? props : componentProps(props), key); }
export function jsxDEV(type: ElementType, props: Props, key: string | undefined, staticChildren: boolean, source: unknown, self: unknown) {
  return originalDev(localized(type), typeof type === 'string' ? props : componentProps(props), key, staticChildren, source as Parameters<typeof originalDev>[4], self);
}