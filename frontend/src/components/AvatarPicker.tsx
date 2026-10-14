import { useState } from 'react'
import { AVATAR_CATEGORIES } from '../domain/character'
import { useCustomIcons } from '../store/iconStore'
import { CategoryTabs } from './CategoryTabs'
import { IconView } from './IconView'
import { isImageIcon } from '../domain/icon'

const CUSTOM_TAB = { id: 'custom', label: '📷 Personalizados' }

interface Props {
  value: string
  onChange: (avatar: string) => void
  ariaLabel: string
}

export function AvatarPicker({ value, onChange, ariaLabel }: Props) {
  const customIcons = useCustomIcons('character')
  const [categoryId, setCategoryId] = useState(
    () =>
      (isImageIcon(value) ? CUSTOM_TAB.id : undefined) ??
      AVATAR_CATEGORIES.find((c) => c.avatars.some((a) => a.icon === value))?.id ??
      AVATAR_CATEGORIES[0].id,
  )
  const category = AVATAR_CATEGORIES.find((c) => c.id === categoryId)
  const options =
    category?.avatars ?? customIcons.map((i) => ({ icon: i.dataUrl, label: 'Ícone personalizado' }))
  return (
    <>
      <CategoryTabs
        tabs={[...AVATAR_CATEGORIES, CUSTOM_TAB]}
        activeId={category?.id ?? CUSTOM_TAB.id}
        onChange={setCategoryId}
        ariaLabel={`${ariaLabel}: categorias`}
      />
      {options.length === 0 ? (
        <p className="picker-empty">
          Nenhum ícone personalizado ainda. Suba suas imagens em "📷 Ícones personalizados" na tela inicial.
        </p>
      ) : (
        <div className="avatar-picker" role="radiogroup" aria-label={ariaLabel}>
          {options.map((a) => (
            <button
              type="button"
              key={a.icon}
              role="radio"
              aria-checked={value === a.icon}
              title={a.label}
              className={`avatar-picker__option ${value === a.icon ? 'is-selected' : ''}`}
              onClick={() => onChange(a.icon)}
            >
              <IconView icon={a.icon} />
            </button>
          ))}
        </div>
      )}
    </>
  )
}
