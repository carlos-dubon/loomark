import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@loomark/ui/components/avatar"

export const UserAvatar = ({
  user,
  className,
  fallbackClassName,
}: {
  user: { name: string | null; email: string; image: string | null }
  className?: string
  fallbackClassName?: string
}) => {
  const label = user.name ?? user.email

  return (
    <Avatar className={className}>
      {user.image ? <AvatarImage src={user.image} alt={label} /> : null}
      <AvatarFallback className={fallbackClassName}>
        {label.slice(0, 2).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  )
}
