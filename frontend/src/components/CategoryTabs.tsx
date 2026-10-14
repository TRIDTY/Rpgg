import './CategoryTabs.css'

export interface CategoryTab {
  id: string
  label: string
}

interface Props {
  tabs: CategoryTab[]
  activeId: string
  onChange: (id: string) => void
  ariaLabel: string
}

export function CategoryTabs({ tabs, activeId, onChange, ariaLabel }: Props) {
  return (
    <div className="category-tabs" role="tablist" aria-label={ariaLabel}>
      {tabs.map((t) => (
        <button
          type="button"
          key={t.id}
          role="tab"
          aria-selected={t.id === activeId}
          className={`category-tab ${t.id === activeId ? 'is-active' : ''}`}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
