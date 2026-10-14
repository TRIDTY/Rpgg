import { useState, type FormEvent } from 'react'
import { MAX_CONTAINER_SLOTS, type ItemRarity, type NewItemInput } from '../types'
import { ITEM_SPRITES, ITEM_SPRITE_CATEGORIES, RARITIES, RARITY_LABEL, isValidItemInput } from '../domain/itemForge'
import { CategoryTabs } from './CategoryTabs'
import { IconView } from './IconView'
import { useCustomIcons } from '../store/iconStore'
import { Modal } from './Modal'
import { ImageCropper } from './ImageCropper'
import { pickImage, type ImageSource } from '../services/imagePicker'
import './ItemCreationModal.css'

const CUSTOM_TAB = { id: 'custom', label: '📷 Personalizados' }
const ITEM_IMAGE_SIZE = 512

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
  const [image, setImage] = useState<string | undefined>(undefined)
  const [rawImage, setRawImage] = useState<string | null>(null)
  const [picking, setPicking] = useState(false)

  const pick = async (source: ImageSource) => {
    setPicking(true)
    try {
      const dataUrl = await pickImage(source)
      if (dataUrl) setRawImage(dataUrl)
    } finally {
      setPicking(false)
    }
  }
  const [quantityText, setQuantityText] = useState('1')
  const [storage, setStorage] = useState(false)
  const [containerText, setContainerText] = useState('8')
  const containerSlots = Number.parseInt(containerText, 10)
  const containerOk = !storage || (containerSlots >= 1 && containerSlots <= MAX_CONTAINER_SLOTS)
  const quantity = storage ? 1 : Number.parseInt(quantityText, 10)

  const input: NewItemInput = {
    name,
    description,
    icon,
    image,
    rarity,
    quantity: quantity >= 1 ? quantity : 1,
    maxStack: Math.max(quantity, 99),
    containerSlots: storage && containerOk ? containerSlots : undefined,
  }
  const valid = quantity >= 1 && containerOk && isValidItemInput(input)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!valid) return
    onForge(input)
  }

  if (rawImage) {
    return (
      <Modal title="🖼️ Imagem do item" onClose={() => setRawImage(null)}>
        <ImageCropper
          src={rawImage}
          output={ITEM_IMAGE_SIZE}
          frame={260}
          renderActions={(crop, ready) => (
            <div className="forge__actions">
              <button type="button" className="btn" onClick={() => setRawImage(null)}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn--gold"
                disabled={!ready}
                onClick={() => {
                  const result = crop()
                  if (!result) return
                  setImage(result)
                  setRawImage(null)
                }}
              >
                ✓ Usar imagem
              </button>
            </div>
          )}
        />
      </Modal>
    )
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
          <span className="field__label">Imagem (opcional)</span>
          {image ? (
            <div className="forge__image">
              <img src={image} alt="Imagem do item" draggable={false} />
              <div className="forge__image-actions">
                <button type="button" className="btn" disabled={picking} onClick={() => void pick('gallery')}>
                  Trocar
                </button>
                <button type="button" className="btn btn--danger" onClick={() => setImage(undefined)}>
                  Remover
                </button>
              </div>
            </div>
          ) : (
            <div className="forge__image-pick">
              <button type="button" className="btn" disabled={picking} onClick={() => void pick('camera')}>
                📸 Tirar foto
              </button>
              <button type="button" className="btn" disabled={picking} onClick={() => void pick('gallery')}>
                🖼️ Galeria
              </button>
            </div>
          )}
        </div>

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

        <label className="checkbox">
          <input type="checkbox" checked={storage} onChange={(e) => setStorage(e.target.checked)} />
          <span>📦 Item de armazenamento (guarda outros itens dentro)</span>
        </label>
        {storage && (
          <label className="field">
            <span className="field__label">Slots internos (1–{MAX_CONTAINER_SLOTS})</span>
            <input
              className="input forge__qty"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={containerText}
              onChange={(e) => setContainerText(e.target.value.replace(/\D/g, '').slice(0, 2))}
              aria-invalid={!containerOk}
              aria-label="Slots internos"
            />
          </label>
        )}

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
              value={storage ? '1' : quantityText}
              disabled={storage}
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
