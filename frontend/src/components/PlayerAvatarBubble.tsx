import { memo } from 'react'
import type { Actor } from '../types'
import { useDropTarget } from '../dnd/hooks'
import './PlayerAvatarBubble.css'

interface Props {
  actor: Actor
  onTap: (actor: Actor) => void
}

const ROLE_LABEL: Record<Actor['role'], string> = {
  player: 'Jogador',
  master: 'Mestre',
  merchant: 'Mercador',
}

export const PlayerAvatarBubble = memo(function PlayerAvatarBubble({ actor, onTap }: Props) {
  const { isOver, isDragActive, attributes } = useDropTarget({
    id: `actor-${actor.id}`,
    kind: 'actor',
    actorId: actor.id,
  })

  const className = [
    'avatar-bubble',
    `avatar-bubble--${actor.role}`,
    actor.online ? 'avatar-bubble--online' : 'avatar-bubble--offline',
    isDragActive && 'avatar-bubble--droppable',
    isOver && 'avatar-bubble--over',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      type="button"
      className={className}
      onClick={() => onTap(actor)}
      aria-label={`${actor.name}, ${ROLE_LABEL[actor.role]}, ${actor.online ? 'online' : 'offline'}`}
      {...attributes}
    >
      <span className="avatar-bubble__ring">
        <span className="avatar-bubble__face">{actor.avatar}</span>
        <span className="avatar-bubble__status" aria-hidden />
      </span>
      <span className="avatar-bubble__name">{actor.name}</span>
    </button>
  )
})
