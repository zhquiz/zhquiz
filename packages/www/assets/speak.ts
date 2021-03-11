export async function speak(s: string) {
  const audio = new Audio(`/api/chinese/speak?q=${encodeURIComponent(s)}`)
  await audio.play()
}
