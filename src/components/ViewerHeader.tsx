import { useLayoutEffect, useRef } from 'react';
import type { HeaderContent } from '../lib/types';
import * as s from '../styles/viewer.css';

function DomHeader({ element }: { element: HTMLElement }) {
  const container = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const mount = container.current;
    mount?.append(element);
    return () => {
      if (element.parentElement === mount) element.remove();
    };
  }, [element]);
  return <div ref={container} className={s.customHeader} />;
}

/** Caller-owned header content; the viewer adds no branding or explanatory copy. */
export function ViewerHeader({ content }: { content: HeaderContent }) {
  return content instanceof HTMLElement ? (
    <DomHeader element={content} />
  ) : (
    <div className={s.customHeader}>{content}</div>
  );
}
