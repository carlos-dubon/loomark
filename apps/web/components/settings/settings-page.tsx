import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@loomark/ui/components/card"

import { PageHeader } from "@/components/page-header"

export const SettingsPage = ({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) => (
  <>
    <PageHeader title={title} description={description} />
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 md:p-6">
      {children}
    </div>
  </>
)

export const SettingsCard = ({
  title,
  description,
  children,
}: {
  title: string
  description?: React.ReactNode
  children?: React.ReactNode
}) => (
  <Card className="w-full max-w-2xl shrink-0">
    <CardHeader>
      <CardTitle>{title}</CardTitle>
      {description ? <CardDescription>{description}</CardDescription> : null}
    </CardHeader>
    {children ? <CardContent>{children}</CardContent> : null}
  </Card>
)
