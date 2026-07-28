import { useEffect, useRef } from "preact/hooks";
import type { ComponentChildren } from "preact";

interface DialogProperties {
  title: string;
  description?: string;
  onClose: () => void;
  children: ComponentChildren;
  initialFocus?: "confirm" | "cancel";
}

export function Dialog({
  title,
  description,
  onClose,
  children,
  initialFocus = "cancel",
}: DialogProperties) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previous = document.activeElement as HTMLElement | null;
    const selector =
      initialFocus === "confirm"
        ? "[data-dialog-confirm]"
        : "[data-dialog-cancel]";
    (
      dialog.querySelector<HTMLElement>(selector) ??
      dialog.querySelector<HTMLElement>("button, input, select")
    )?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = [
        ...dialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
        ),
      ];
      if (focusable.length === 0) return;
      const first = focusable[0]!;
      const last = focusable.at(-1)!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    dialog.addEventListener("keydown", onKeyDown);
    return () => {
      dialog.removeEventListener("keydown", onKeyDown);
      previous?.focus();
    };
  }, [initialFocus]);

  return (
    <div class="dialog-backdrop" role="presentation">
      <div
        ref={dialogRef}
        class="dialog-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby={description ? "dialog-description" : undefined}
      >
        <p class="kicker">Confirm a lasting action</p>
        <h2 id="dialog-title">{title}</h2>
        {description ? <p id="dialog-description">{description}</p> : null}
        {children}
      </div>
    </div>
  );
}
