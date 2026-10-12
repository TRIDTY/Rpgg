import { useState } from 'react'
import { AVATAR_CATEGORIES } from '../domain/character'
import { CategoryTabs } from './CategoryTabs'

interface Props {
  value: string
  onChange: (avatar: string) => void
  ariaLabel: string
}

export function AvatarPicker({ value, onChange, ariaLabel }: Props) {
  const [categoryId, setCategoryId] = useState(
    () =>
      AVATAR_CATEGORIES.find((c) => c.avatars.some((a) => a.icon === value))?.id ??
      AVATAR_CATEGORIES[0].id,
  )
  const category =
    AVATAR_CATEGORIES.find((c) => c.id === categoryId) ?? AVATAR_CATEGORIES[0]
  return (
    <>
      <CategoryTabs
        tabs={AVATAR_CATEGORIES}
        activeId={category.id}
        onChange={setCategoryId}
        ariaLabel={`${ariaLabel}: categorias`}
      />
      <div className="avatar-picker" role="radiogroup" aria-label={ariaLabel}>
        {category.avatars.map((a) => (
          <button
            type="button"
            key={a.icon}
            role="radio"
            aria-checked={value === a.icon}
            title={a.label}
            className={`avatar-picker__option ${value === a.icon ? 'is-selected' : ''}`}
            onClick={() => onChange(a.icon)}
          >
            {a.icon}
          </button>
        ))}
      </div>
    </>
  )
}
