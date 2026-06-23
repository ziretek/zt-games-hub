interface MobileControlAction {
  label: string;
  ariaLabel: string;
  className?: string;
  onPress?: () => void;
  onRelease?: () => void;
  onTap?: () => void;
}

export interface MobileControlsHandle {
  destroy(): void;
}

export function ensureCanvasControlStage(canvas: HTMLCanvasElement, className?: string): HTMLElement {
  const parent = canvas.parentElement;
  if (parent?.classList.contains('mobile-canvas-stage')) return parent;

  const stage = document.createElement('div');
  stage.className = `mobile-canvas-stage ${className || ''}`.trim();
  parent?.insertBefore(stage, canvas);
  stage.appendChild(canvas);
  return stage;
}

export function createMobileControls(
  container: HTMLElement,
  variant: string,
  actions: MobileControlAction[],
  hint?: string,
): MobileControlsHandle {
  container.classList.add('mobile-control-stage');

  const overlay = document.createElement('div');
  overlay.className = `mobile-game-controls mobile-game-controls--${variant}`;
  overlay.setAttribute('aria-hidden', 'false');

  if (hint) {
    const hintEl = document.createElement('span');
    hintEl.className = 'mobile-game-control-hint';
    hintEl.textContent = hint;
    overlay.appendChild(hintEl);
  }

  const cleanups: Array<() => void> = [];
  for (const action of actions) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `mobile-game-control ${action.className || ''}`.trim();
    button.textContent = action.label;
    button.setAttribute('aria-label', action.ariaLabel);

    const press = (event: Event) => {
      event.preventDefault();
      action.onPress?.();
    };
    const release = (event: Event) => {
      event.preventDefault();
      action.onRelease?.();
    };
    const tap = (event: Event) => {
      event.preventDefault();
      action.onTap?.();
    };

    button.addEventListener('pointerdown', press);
    button.addEventListener('pointerup', release);
    button.addEventListener('pointercancel', release);
    button.addEventListener('pointerleave', release);
    button.addEventListener('click', tap);
    cleanups.push(() => {
      button.removeEventListener('pointerdown', press);
      button.removeEventListener('pointerup', release);
      button.removeEventListener('pointercancel', release);
      button.removeEventListener('pointerleave', release);
      button.removeEventListener('click', tap);
    });

    overlay.appendChild(button);
  }

  container.appendChild(overlay);

  return {
    destroy() {
      cleanups.forEach(cleanup => cleanup());
      overlay.remove();
      if (!container.querySelector('.mobile-game-controls')) {
        container.classList.remove('mobile-control-stage');
      }
    },
  };
}
