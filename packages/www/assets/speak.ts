export async function speak(s: string) {
  const audio = new Audio(`/api/util/speak?q=${encodeURIComponent(s)}`)
  await audio.play()
}
