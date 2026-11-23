type LockableOrientation = ScreenOrientation & { lock?: (o: string) => Promise<void> };

const orientation = screen.orientation as LockableOrientation | undefined;

/**
 * Browsers that can turn the screen for us: they need both the Fullscreen API and
 * screen.orientation.lock (Android Chrome, Samsung Internet, Firefox Android).
 * iPhone Safari has neither, so it falls back to asking the player to turn the phone.
 */
export const canAutoRotate =
  typeof document.documentElement.requestFullscreen === "function" && typeof orientation?.lock === "function";

/** Go fullscreen and lock to landscape. Must be called from a tap. Resolves false if the browser refuses. */
export async function enterLandscape(): Promise<boolean> {
  if (!canAutoRotate) return false;
  try {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen({ navigationUI: "hide" });
    await orientation!.lock!("landscape");
    return true;
  } catch {
    return false;
  }
}

/** Wire the portrait overlay: offer a one-tap rotate where supported, otherwise ask the player to turn. */
export function setupRotatePrompt() {
  const msg = document.getElementById("rotate-msg");
  const btn = document.getElementById("rotate-btn") as HTMLButtonElement | null;
  if (!msg || !btn) return;

  const showManual = () => {
    btn.hidden = true;
    msg.innerHTML = "Turn your phone sideways<br />to play";
  };

  if (!canAutoRotate) return showManual();

  msg.textContent = "Samurai plays in landscape";
  btn.hidden = false;
  btn.addEventListener("click", async () => {
    btn.disabled = true;
    const ok = await enterLandscape();
    btn.disabled = false;
    if (!ok) {
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      showManual();
    }
  });
}
