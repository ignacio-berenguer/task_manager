import { useNavigate } from 'react-router-dom'
import { Eye, ListTodo } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip'

export function RowActions({ portfolioId, onOpenLtpModal, nombre }) {
  const navigate = useNavigate()

  const handleView = () => {
    navigate(`/detail/${portfolioId}`, { state: { from: { route: '/search', label: 'Busqueda' } } })
  }

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleView}>
              <Eye className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Ver detalle</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation()
                onOpenLtpModal?.(portfolioId, nombre)
              }}
            >
              <ListTodo className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>LTPs</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}
