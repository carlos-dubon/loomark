"use client"

import { EyeIcon, EyeOffIcon } from "lucide-react"
import { useState, type ComponentProps } from "react"

import { cn } from "@loomark/core/utils"

import { Button } from "./button"
import { Input } from "./input"

export const PasswordInput = ({
  className,
  disabled,
  ...props
}: Omit<ComponentProps<typeof Input>, "type">) => {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative w-full">
      <Input
        type={visible ? "text" : "password"}
        disabled={disabled}
        className={cn("[&>input]:pe-9", className)}
        {...props}
      />
      <Button
        type="button"
        variant="ghost-muted"
        size="icon-xs"
        aria-label={visible ? "Hide password" : "Show password"}
        disabled={disabled}
        className="absolute end-1 top-1/2 -translate-y-1/2"
        onClick={() => setVisible((current) => !current)}
      >
        {visible ? <EyeOffIcon /> : <EyeIcon />}
      </Button>
    </div>
  )
}
