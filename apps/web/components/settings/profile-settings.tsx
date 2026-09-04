"use client"

import { ImageUpIcon, Loader2Icon, Trash2Icon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useRef, useState } from "react"
import { toast } from "sonner"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@loomark/ui/components/avatar"
import { Button } from "@loomark/ui/components/button"

import { api } from "@/lib/client-api"
import { toSquareImage } from "@/lib/image"

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
  const [busy, setBusy] = useState(false)

  const label = profile.name ?? profile.email
  const initials = label.slice(0, 2).toUpperCase()

  const onPick = async (file: File) => {
    setBusy(true)

    try {
      const square = await toSquareImage(file, AVATAR_EDGE)
      const { image: next } = await api.uploadAvatar(square)

      setImage(next)
      toast.success("Profile picture updated")
      router.refresh()
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Upload failed")
    } finally {
      setBusy(false)
    }
  }

  const onRemove = async () => {
    setBusy(true)

    try {
      await api.removeAvatar()

      setImage(null)
      toast.success("Profile picture removed")
      router.refresh()
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Removal failed")
    } finally {
      setBusy(false)
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
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? <Loader2Icon className="animate-spin" /> : <ImageUpIcon />}
          {image ? "Change picture" : "Upload picture"}
        </Button>
        {image ? (
          <Button
            variant="destructive-outline"
            disabled={busy}
            onClick={() => void onRemove()}
          >
            <Trash2Icon />
            Remove
          </Button>
        ) : null}
      </div>
    </div>
  )
}
