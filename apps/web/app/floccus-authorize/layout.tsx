import { LoomarkMark } from "@/components/loomark-mark"

const FloccusAuthorizeLayout = ({
  children,
}: {
  children: React.ReactNode
}) => (
  <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted/40 p-6">
    <div className="flex flex-col items-center gap-1">
      <LoomarkMark className="size-12" />
      <span className="text-sm text-muted-foreground">
        Loomark — your bookmark library
      </span>
    </div>
    {children}
  </div>
)

export default FloccusAuthorizeLayout
