import { useState, type FormEvent } from 'react'
import type { ItemRarity, NewItemInput } from '../types'
import { ITEM_SPRITES, ITEM_SPRITE_CATEGORIES, RARITIES, RARITY_LABEL, isValidItemInput } from '../domain/itemForge'
import { CategoryTabs } from './CategoryTabs'
import { IconView } from './IconView'
import { useCustomIcons } from '../store/iconStore'
import { Modal } from './Modal'
import './ItemCreationModal.css'

const CUSTOM_TAB = { id: 'custom', label: '📷 Personalizados' }

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
  const [categoryId, setCategoryId] = useState(ITEM_SPRITE_CATEGORIES[0].id)
  const customIcons = useCustomIcons('item')
  const category = ITEM_SPRITE_CATEGORIES.find((c) => c.id === categoryId)
  const sprites = category?.sprites ?? customIcons.map((i) => ({ icon: i.dataUrl, label: 'Ícone personalizado' }))
  const [rarity, setRarity] = useState<ItemRarity>('common')
  const [quantityText, setQuantityText] = useState('1')
  const quantity = Number.parseInt(quantityText, 10)

  const input: NewItemInput = {
    name,
    description,
    icon,
    rarity,
    quantity: quantity >= 1 ? quantity : 1,
    maxStack: Math.max(quantity, 99),
  }
  const valid = quantity >= 1 && isValidItemInput(input)

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
          <IconView className="item-tile__icon" icon={icon} />
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
          <CategoryTabs
            tabs={[...ITEM_SPRITE_CATEGORIES, CUSTOM_TAB]}
            activeId={category?.id ?? CUSTOM_TAB.id}
            onChange={setCategoryId}
            ariaLabel="Tipo de item"
          />
          {sprites.length === 0 && (
            <p className="picker-empty">
              Nenhum ícone personalizado ainda. Suba suas imagens em "📷 Ícones personalizados" na tela inicial.
            </p>
          )}
          <div className="sprite-picker" role="listbox" aria-label={`Sprites: ${category?.label ?? CUSTOM_TAB.label}`}>
            {sprites.map((sprite) => (
              <button
                type="button"
                key={sprite.icon}
                role="option"
                aria-selected={icon === sprite.icon}
                title={sprite.label}
                className={`sprite-picker__option ${icon === sprite.icon ? 'is-selected' : ''}`}
                onClick={() => setIcon(sprite.icon)}
              >
                <IconView icon={sprite.icon} />
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
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={quantityText}
              onChange={(e) => setQuantityText(e.target.value.replace(/\D/g, '').slice(0, 3))}
              aria-invalid={!(quantity >= 1)}
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
