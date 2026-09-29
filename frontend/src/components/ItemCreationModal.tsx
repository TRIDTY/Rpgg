import { useState, type FormEvent } from 'react'
import type { ItemRarity, NewItemInput } from '../types'
import { ITEM_SPRITES, RARITIES, RARITY_LABEL, isValidItemInput } from '../domain/itemForge'
import { Modal } from './Modal'
import './ItemCreationModal.css'

interface Props {
  /** Nome de quem receberá o item (o próprio Mestre ou um jogador). */
  ownerName: string
  slotIndex: number
  onForge: (input: NewItemInput) => void
  onClose: () => void
}

export function ItemCreationModal({ ownerName, slotIndex, onForge, onClose }: Props) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState(ITEM_SPRITES[0].icon)
  const [rarity, setRarity] = useState<ItemRarity>('common')
  const [quantity, setQuantity] = useState(1)

  const input: NewItemInput = {
    name,
    description,
    icon,
    rarity,
    quantity,
    maxStack: Math.max(quantity, 99),
  }
  const valid = isValidItemInput(input)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!valid) return
    onForge(input)
  }

  return (
    <Modal title="⚒️ Forjar item" onClose={onClose}>
      <form className="forge" onSubmit={submit}>
        <p className="forge__target">
          Mochila de <strong>{ownerName}</strong> · slot {slotIndex + 1}
        </p>

        <div className={`forge__preview item-tile item-tile--${rarity}`} aria-hidden>
          <span className="item-tile__icon">{icon}</span>
          {quantity > 1 && <span className="item-tile__qty">{quantity}</span>}
          <span className="item-tile__name">{name.trim() || 'Novo item'}</span>
        </div>

        <label className="field">
          <span className="field__label">Nome *</span>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex.: Adaga da Sombra"
            maxLength={40}
            required
            autoFocus
          />
        </label>

        <label className="field">
          <span className="field__label">Descrição</span>
          <textarea
            className="input forge__textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Efeitos, história, regras…"
            rows={3}
            maxLength={400}
          />
        </label>

        <div className="field">
          <span className="field__label">Sprite</span>
          <div className="sprite-picker" role="listbox" aria-label="Sprite do item">
            {ITEM_SPRITES.map((sprite) => (
              <button
                type="button"
                key={sprite.icon}
                role="option"
                aria-selected={icon === sprite.icon}
                title={sprite.label}
                className={`sprite-picker__option ${icon === sprite.icon ? 'is-selected' : ''}`}
                onClick={() => setIcon(sprite.icon)}
              >
                {sprite.icon}
              </button>
            ))}
          </div>
        </div>

        <div className="field__row">
          <label className="field">
            <span className="field__label">Raridade</span>
            <select className="input" value={rarity} onChange={(e) => setRarity(e.target.value as ItemRarity)}>
              {RARITIES.map((r) => (
                <option key={r} value={r}>
                  {RARITY_LABEL[r]}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="field__label">Qtd.</span>
            <input
              className="input forge__qty"
              type="number"
              min={1}
              max={999}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
            />
          </label>
        </div>

        <div className="forge__actions">
          <button type="button" className="btn" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn--gold" disabled={!valid}>
            ⚒️ Forjar / Criar Item
          </button>
        </div>
      </form>
    </Modal>
  )
}
