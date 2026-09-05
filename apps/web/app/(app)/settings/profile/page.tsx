import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { ProfileView } from "@/components/settings/profile-view"
import { auth } from "@/lib/auth"
import { getProfile } from "@/lib/queries"

export const metadata: Metadata = { title: "Your profile" }

const ProfilePage = async () => {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const profile = await getProfile(session.user.id)

  if (!profile) {
    redirect("/login")
  }

  return (
    <ProfileView
      profile={{
        name: profile.name,
        email: profile.email,
        image: profile.image,
      }}
    />
  )
}

export default ProfilePage
