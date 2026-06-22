export function enableTouchOnCanvas(canvas: HTMLCanvasElement | null): void {
  if (!canvas || (canvas as HTMLCanvasElement & { _touchEnabled?: boolean })._touchEnabled) return;
  (canvas as HTMLCanvasElement & { _touchEnabled: boolean })._touchEnabled = true;
  canvas.style.touchAction = 'none';
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const t = e.changedTouches[0];
    canvas.dispatchEvent(new MouseEvent('mousedown', { clientX: t.clientX, clientY: t.clientY }));
  });
  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const t = e.changedTouches[0];
    canvas.dispatchEvent(new MouseEvent('mousemove', { clientX: t.clientX, clientY: t.clientY }));
  });
  canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    canvas.dispatchEvent(new MouseEvent('mouseup', {}));
    canvas.dispatchEvent(new MouseEvent('click', {}));
  });
}
