"use client"

import { ImageUpIcon, Trash2Icon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useRef, useState } from "react"
import { toast } from "sonner"

import { errorMessage } from "@loomark/core/format"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@loomark/ui/components/avatar"
import { Button } from "@loomark/ui/components/button"

import { api } from "@/lib/client/api"
import { toSquareImage } from "@/lib/client/image"

const AVATAR_EDGE = 512

export type Profile = {
  name: string | null
  email: string
  image: string | null
}

export const ProfileSettings = ({ profile }: { profile: Profile }) => {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const [image, setImage] = useState(profile.image)
  const [uploading, setUploading] = useState(false)
  const [removing, setRemoving] = useState(false)

  const label = profile.name ?? profile.email
  const initials = label.slice(0, 2).toUpperCase()

  const onPick = async (file: File) => {
    setUploading(true)

    try {
      const square = await toSquareImage(file, AVATAR_EDGE)
      const { image: next } = await api.uploadAvatar(square)

      setImage(next)
      toast.success("Profile picture updated")
      router.refresh()
    } catch (cause) {
      toast.error(errorMessage(cause, "Upload failed"))
    } finally {
      setUploading(false)
    }
  }

  const onRemove = async () => {
    setRemoving(true)

    try {
      await api.removeAvatar()

      setImage(null)
      toast.success("Profile picture removed")
      router.refresh()
    } catch (cause) {
      toast.error(errorMessage(cause, "Removal failed"))
    } finally {
      setRemoving(false)
    }
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar className="size-16 shrink-0">
        {image ? <AvatarImage src={image} alt={label} /> : null}
        <AvatarFallback className="text-lg">{initials}</AvatarFallback>
      </Avatar>
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0]

            event.target.value = ""

            if (file) {
              void onPick(file)
            }
          }}
        />
        <Button
          variant="outline"
          disabled={removing}
          loading={uploading}
          onClick={() => inputRef.current?.click()}
        >
          <ImageUpIcon aria-hidden="true" />
          {uploading
            ? "Uploading…"
            : image
              ? "Change picture"
              : "Upload picture"}
        </Button>
        {image ? (
          <Button
            variant="destructive-outline"
            disabled={uploading}
            loading={removing}
            onClick={() => void onRemove()}
          >
            <Trash2Icon aria-hidden="true" />
            {removing ? "Removing…" : "Remove"}
          </Button>
        ) : null}
      </div>
    </div>
  )
}
