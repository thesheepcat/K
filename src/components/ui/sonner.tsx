import { Toaster as Sonner, type ToasterProps } from "sonner"
import { useUserSettings } from "@/contexts/UserSettingsContext"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useUserSettings()
  
  return (
    <>
      {/* Desktop and large screens - top right */}
      <div className="hidden lg:block">
        <Sonner
          theme={theme}
          className="toaster group"
          toastOptions={{
            classNames: {
              success: 'bg-card text-card-foreground border-border [&_[data-icon]]:!text-success [&_svg]:!text-success [&_*]:!text-success',
              error: 'bg-card text-card-foreground border-border [&_[data-icon]]:!text-destructive [&_svg]:!text-destructive [&_*]:!text-destructive',
            },
            style: {
              borderRadius: '6px',
            }
          }}
          position="top-right"
          {...props}
        />
      </div>
      
      {/* Medium and small screens, mobile - top center */}
      <div className="lg:hidden">
        <Sonner
          theme={theme}
          className="toaster group"
          toastOptions={{
            classNames: {
              success: 'bg-card text-card-foreground border-border [&_[data-icon]]:!text-success [&_svg]:!text-success [&_*]:!text-success',
              error: 'bg-card text-card-foreground border-border [&_[data-icon]]:!text-destructive [&_svg]:!text-destructive [&_*]:!text-destructive',
            },
            style: {
              borderRadius: '6px',
            }
          }}
          position="top-center"
          {...props}
        />
      </div>
    </>
  )
}

export { Toaster }