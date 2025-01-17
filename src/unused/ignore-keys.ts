export async function readIgnoreList(path: string): Promise<string[]> {
  const content = await Bun.file(path).text();
  return content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "");
}
