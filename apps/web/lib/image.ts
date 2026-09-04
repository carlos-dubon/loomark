const loadImage = (file: File) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()

    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("That file is not an image we can read"))
    }
    image.src = url
  })

const toBlob = (canvas: HTMLCanvasElement, type: string) =>
  new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("Could not read that image")),
      type,
      0.9
    )
  })

export const toSquareImage = async (file: File, size: number) => {
  const image = await loadImage(file)
  const side = Math.min(image.naturalWidth, image.naturalHeight)

  if (side === 0) {
    throw new Error("That file is not an image we can read")
  }

  const edge = Math.min(side, size)
  const canvas = document.createElement("canvas")

  canvas.width = edge
  canvas.height = edge

  const context = canvas.getContext("2d")

  if (!context) {
    throw new Error("Could not read that image")
  }

  context.imageSmoothingQuality = "high"
  context.drawImage(
    image,
    (image.naturalWidth - side) / 2,
    (image.naturalHeight - side) / 2,
    side,
    side,
    0,
    0,
    edge,
    edge
  )

  const blob = await toBlob(canvas, "image/webp")

  return new File([blob], "avatar.webp", { type: blob.type })
}
