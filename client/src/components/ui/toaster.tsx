import { useToast } from "@/hooks/use-toast"
import { createPortal } from "react-dom"
import { useEffect, useState } from "react"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()
  const [container, setContainer] = useState<HTMLElement | null>(null)

  useEffect(() => {
    // Create a container at the very end of body
    const toastContainer = document.createElement('div')
    toastContainer.id = 'toast-container'
    toastContainer.style.position = 'fixed'
    toastContainer.style.top = '1rem'
    toastContainer.style.right = '1rem'
    toastContainer.style.zIndex = '2147483647'
    toastContainer.style.pointerEvents = 'none'
    toastContainer.style.isolation = 'isolate'
    toastContainer.style.maxWidth = '420px'
    toastContainer.style.width = 'auto'
    
    document.body.appendChild(toastContainer)
    setContainer(toastContainer)

    return () => {
      if (document.body.contains(toastContainer)) {
        document.body.removeChild(toastContainer)
      }
    }
  }, [])

  if (!container) return null

  return createPortal(
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>,
    container
  )
}
