import { SetupForm } from "@/components/setup-form"
import { writeConnection } from "@/lib/storage"

export const App = ({ onOpen }: { onOpen: (serverUrl: string) => void }) => (
  <div className="flex min-h-dvh flex-col items-center justify-center gap-6 p-6">
    <div className="flex flex-col items-center gap-3 text-center">
      <img src="/icon/128.png" alt="" className="size-14" />
      <div className="flex flex-col gap-1">
        <h1 className="text-base font-medium">Loomark opens here</h1>
        <p className="text-sm text-muted-foreground">
          Connect your server once and every new tab lands on your library.
        </p>
      </div>
    </div>
    <div className="w-[380px] max-w-full rounded-xl border">
      <SetupForm
        onConnected={(connection) => {
          void writeConnection(connection).then(() =>
            onOpen(connection.serverUrl)
          )
        }}
      />
    </div>
  </div>
)
