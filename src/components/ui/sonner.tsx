import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <>
      {/* Desktop and large screens - top right */}
      <div className="hidden lg:block">
        <Sonner
          theme="light"
          className="toaster group"
          toastOptions={{
            classNames: {
              success: 'bg-card text-card-foreground border-border [&>[data-icon]]:text-success',
              error: 'bg-card text-card-foreground border-border [&>[data-icon]]:text-destructive',
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
          theme="light"
          className="toaster group"
          toastOptions={{
            classNames: {
              success: 'bg-card text-card-foreground border-border [&>[data-icon]]:text-success',
              error: 'bg-card text-card-foreground border-border [&>[data-icon]]:text-destructive',
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