type AudioContextConstructor = typeof AudioContext

const buffers = new Map<string, Promise<AudioBuffer>>()

let sharedContext: AudioContext | null = null

const getContext = () => {
  if (typeof window === "undefined") {
    return null
  }

  const Constructor: AudioContextConstructor | undefined =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: AudioContextConstructor })
      .webkitAudioContext

  if (!Constructor) {
    return null
  }

  sharedContext ??= new Constructor()

  return sharedContext
}

const loadBuffer = (context: AudioContext, src: string) => {
  const cached = buffers.get(src)

  if (cached) {
    return cached
  }

  const buffer = fetch(src)
    .then((response) => response.arrayBuffer())
    .then((data) => context.decodeAudioData(data))
    .catch((error: unknown) => {
      buffers.delete(src)
      throw error
    })

  buffers.set(src, buffer)

  return buffer
}

export const playSound = async (src: string, volume = 1) => {
  const context = getContext()

  if (!context) {
    return
  }

  try {
    if (context.state === "suspended") {
      await context.resume()
    }

    const source = context.createBufferSource()
    const gain = context.createGain()

    source.buffer = await loadBuffer(context, src)
    gain.gain.value = volume
    source.connect(gain).connect(context.destination)
    source.start()
  } catch {
    return
  }
}
