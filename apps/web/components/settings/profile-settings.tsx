"use client"

import { useMutation } from "@tanstack/react-query"
import { ImageUpIcon, Trash2Icon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useRef, useState } from "react"
import { toast } from "sonner"

import { errorMessage } from "@loomark/core/format"
import { Button } from "@loomark/ui/components/button"

import { UserAvatar } from "@/components/user-avatar"
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

  const { mutate: upload, isPending: uploading } = useMutation({
    mutationFn: async (file: File) =>
      api.uploadAvatar(await toSquareImage(file, AVATAR_EDGE)),
    onSuccess: ({ image: next }) => {
      setImage(next)
      toast.success("Profile picture updated")
      router.refresh()
    },
    onError: (cause) => {
      toast.error(errorMessage(cause, "Upload failed"))
    },
  })

  const { mutate: remove, isPending: removing } = useMutation({
    mutationFn: () => api.removeAvatar(),
    onSuccess: () => {
      setImage(null)
      toast.success("Profile picture removed")
      router.refresh()
    },
    onError: (cause) => {
      toast.error(errorMessage(cause, "Removal failed"))
    },
  })

  return (
    <div className="flex items-center gap-4">
      <UserAvatar
        user={{ ...profile, image }}
        className="size-16 shrink-0"
        fallbackClassName="text-lg"
      />
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
              upload(file)
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
            onClick={() => remove()}
          >
            <Trash2Icon aria-hidden="true" />
            {removing ? "Removing…" : "Remove"}
          </Button>
        ) : null}
      </div>
    </div>
  )
}
