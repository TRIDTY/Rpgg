import { isImageIcon } from '../domain/icon'
import './IconView.css'

interface Props {
  icon: string
  className?: string
  alt?: string
}

/** Renderiza um ícone que pode ser um emoji ou uma imagem personalizada (data URL). */
export function IconView({ icon, className = '', alt = '' }: Props) {
  if (isImageIcon(icon)) {
    return <img className={`icon-view icon-view--image ${className}`} src={icon} alt={alt} draggable={false} />
  }
  return <span className={className}>{icon}</span>
}
