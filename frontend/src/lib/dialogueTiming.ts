/** Pause so the player can read preamble dialogue before creation starts. */
export function pauseForDialogue(text: string): Promise<void> {
  const ms = Math.min(4500, Math.max(1800, 1200 + text.length * 45));
  return new Promise((resolve) => setTimeout(resolve, ms));
}
