/**
 * Vibration and haptics.
 *
 * - Android (Chrome, Samsung Internet, Firefox): the Vibration API, with a full pattern per event.
 * - iPhone (iOS 18+ Safari): no Vibration API. Toggling a native `<input switch>` makes the
 *   Taptic Engine tick, so we fire one short tick. iOS only allows it during a tap, so in practice
 *   iPhones feel the button presses, not hits that land a moment later.
 * - Desktop: nothing happens.
 */

const STORE_KEY = "samurai.vibration";

// Desktop Chrome also has navigator.vibrate (it does nothing), so require a touch screen too.
const canVibrate = typeof navigator.vibrate === "function" && window.matchMedia("(pointer: coarse)").matches;
const isIOS =
  /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

/** True on devices where vibration may do something. */
export const hapticsSupported = canVibrate || isIOS;

let enabled = readSetting();

function readSetting() {
  try {
    return localStorage.getItem(STORE_KEY) !== "off";
  } catch {
    return true;
  }
}

export function vibrationEnabled() {
  return enabled;
}

export function setVibrationEnabled(on: boolean) {
  enabled = on;
  try {
    localStorage.setItem(STORE_KEY, on ? "on" : "off");
  } catch {
    /* private mode: keep the setting for this visit only */
  }
}

let iosSwitch: HTMLLabelElement | undefined;

function iosTick() {
  if (!iosSwitch) {
    iosSwitch = document.createElement("label");
    iosSwitch.style.display = "none";
    iosSwitch.ariaHidden = "true";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.setAttribute("switch", "");
    iosSwitch.appendChild(input);
    document.body.appendChild(iosSwitch);
  }
  iosSwitch.click();
}

/** Pattern in ms: vibrate, pause, vibrate, ... */
function buzz(pattern: number | number[]) {
  if (!enabled) return;
  if (canVibrate) {
    try {
      navigator.vibrate(pattern);
    } catch {
      /* blocked before the first tap; ignore */
    }
  } else if (isIOS) {
    iosTick();
  }
}

export const haptics = {
  /** Tap on an on-screen button. */
  tap: () => buzz(8),
  swing: () => buzz(12),
  hit: () => buzz(30),
  kill: () => buzz([40, 30, 60]),
  hurt: () => buzz([70, 40, 70]),
  land: () => buzz(10),
  star: () => buzz(6),
  heal: () => buzz([15, 40, 15, 40, 15]),
  pit: () => buzz(120),
  win: () => buzz([30, 60, 30, 60, 120]),
  lose: () => buzz([200, 80, 300]),
};
