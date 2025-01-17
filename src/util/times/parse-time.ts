// nano second (from performance.now)
export function displayExTime(start: number, end: number): void {
  const duration = end - start;
  const mills = Math.floor(duration % 1000);
  const secs = Math.floor(Math.floor(duration / 1_000) % 60);

  console.log(`🍾 Done! ${secs}.${mills}s`);
}
