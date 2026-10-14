import { MAX_CONTAINER_SLOTS, type Item, type ItemRarity, type NewItemInput } from '../types'
import { emptyInventory } from './character'
import { newId } from './character'

export interface ItemSprite {
  icon: string
  label: string
}

export interface ItemSpriteCategory {
  id: string
  label: string
  sprites: ItemSprite[]
}

const sprites = (pairs: [string, string][]): ItemSprite[] => pairs.map(([icon, label]) => ({ icon, label }))

/** Galeria de sprites padrão do ItemCreationModal, agrupada por tipo de item. */
export const ITEM_SPRITE_CATEGORIES: ItemSpriteCategory[] = [
  {
    id: 'weapons',
    label: '⚔️ Armas',
    sprites: sprites([
      ['🗡️', 'Espada'], ['⚔️', 'Espadas gêmeas'], ['🔪', 'Adaga'], ['🪓', 'Machado'], ['🔨', 'Martelo de guerra'],
      ['🏹', 'Arco e flecha'], ['🔱', 'Tridente'], ['🪃', 'Bumerangue'], ['🪄', 'Varinha'], ['🏑', 'Bastão'],
      ['🥢', 'Dardos'], ['💣', 'Bomba'], ['🧨', 'Explosivo'], ['🔫', 'Pistola'], ['🪚', 'Serra dentada'],
    ]),
  },
  {
    id: 'armor',
    label: '🛡️ Armaduras',
    sprites: sprites([
      ['🛡️', 'Escudo'], ['🪖', 'Elmo'], ['⛑️', 'Capacete'], ['👑', 'Coroa'], ['🎩', 'Cartola'], ['👒', 'Chapéu'],
      ['🎭', 'Máscara'], ['🥽', 'Óculos de proteção'], ['🦺', 'Colete'], ['👕', 'Túnica'], ['🥋', 'Gibão'],
      ['🧥', 'Casaco'], ['👘', 'Manto'], ['👗', 'Vestido'], ['🧣', 'Cachecol'], ['🧤', 'Luvas'], ['👖', 'Calças'],
      ['🩳', 'Calções'], ['🧦', 'Meias'], ['👢', 'Botas'], ['🥾', 'Botas de couro'], ['👞', 'Sapatos'], ['🩴', 'Sandálias'],
    ]),
  },
  {
    id: 'accessories',
    label: '💍 Acessórios',
    sprites: sprites([
      ['💍', 'Anel'], ['📿', 'Amuleto'], ['🧿', 'Talismã'], ['🪬', 'Amuleto da mão'], ['🔗', 'Corrente'], ['🎀', 'Fita'],
      ['⌚', 'Relógio'], ['🕰️', 'Relógio antigo'], ['👓', 'Óculos'], ['🕶️', 'Óculos escuros'], ['🪞', 'Espelho'],
      ['🎒', 'Mochila'], ['👜', 'Bolsa'], ['👝', 'Bolsinha'], ['💼', 'Maleta'], ['🧳', 'Mala'], ['🏮', 'Lanterna de papel'],
    ]),
  },
  {
    id: 'consumables',
    label: '🧪 Consumíveis',
    sprites: sprites([
      ['🧪', 'Poção'], ['⚗️', 'Elixir'], ['💊', 'Pílula'], ['🩹', 'Bandagem'], ['🍖', 'Carne'], ['🍗', 'Coxa assada'],
      ['🍞', 'Pão'], ['🧀', 'Queijo'], ['🍎', 'Maçã'], ['🍇', 'Uvas'], ['🥕', 'Cenoura'], ['🌽', 'Milho'], ['🍄', 'Cogumelo'],
      ['🌿', 'Erva'], ['🍯', 'Mel'], ['🥚', 'Ovo'], ['🐟', 'Peixe'], ['🍷', 'Vinho'], ['🍺', 'Cerveja'], ['🫖', 'Chá'],
      ['🥛', 'Leite'], ['🧂', 'Sal'], ['🌶️', 'Pimenta'],
    ]),
  },
  {
    id: 'tools',
    label: '🧰 Ferramentas',
    sprites: sprites([
      ['🗝️', 'Chave antiga'], ['🔑', 'Chave'], ['🔒', 'Cadeado'], ['🧭', 'Bússola'], ['🔭', 'Telescópio'], ['🔍', 'Lupa'],
      ['🕯️', 'Vela'], ['🪔', 'Lamparina'], ['🔦', 'Lanterna'], ['🪢', 'Corda'], ['⛏️', 'Picareta'], ['⚒️', 'Ferramentas de forja'],
      ['🔧', 'Chave inglesa'], ['🪝', 'Gancho'], ['🧰', 'Caixa de ferramentas'], ['🪣', 'Balde'], ['🎣', 'Vara de pescar'],
      ['⚖️', 'Balança'], ['🧵', 'Fio'], ['🪡', 'Agulha'], ['🧲', 'Ímã'], ['⏳', 'Ampulheta'], ['🔔', 'Sino'], ['🪤', 'Armadilha'],
    ]),
  },
  {
    id: 'materials',
    label: '🪨 Materiais',
    sprites: sprites([
      ['🦴', 'Osso'], ['🦷', 'Dente'], ['🪶', 'Pena'], ['🐚', 'Concha'], ['🕸️', 'Teia'], ['🪵', 'Madeira'], ['🪨', 'Pedra'],
      ['🧱', 'Tijolo'], ['⛓️', 'Correntes'], ['🧶', 'Lã'], ['🌾', 'Trigo'], ['🌰', 'Noz'], ['🍂', 'Folhas'], ['🌹', 'Rosa'],
      ['🧊', 'Gelo'], ['🔥', 'Brasa'], ['💧', 'Gota'], ['🫧', 'Essência'], ['🪙', 'Lingote'], ['🪹', 'Ninho'],
    ]),
  },
  {
    id: 'magic',
    label: '🔮 Mágicos',
    sprites: sprites([
      ['🔮', 'Orbe'], ['💎', 'Gema'], ['✨', 'Pó de fada'], ['🌟', 'Estrela cadente'], ['💫', 'Essência arcana'], ['⚡', 'Raio'],
      ['❄️', 'Cristal de gelo'], ['🌙', 'Lua'], ['☀️', 'Sol'], ['🪐', 'Astro'], ['☠️', 'Crânio'], ['👁️', 'Olho'], ['🫀', 'Coração'],
      ['🧠', 'Cérebro'], ['🪦', 'Lápide'], ['🫙', 'Frasco'], ['🧬', 'Fragmento'], ['🎇', 'Faísca'],
    ]),
  },
  {
    id: 'documents',
    label: '📜 Documentos',
    sprites: sprites([
      ['📜', 'Pergaminho'], ['📖', 'Grimório'], ['📕', 'Livro vermelho'], ['📘', 'Livro azul'], ['📗', 'Livro verde'],
      ['📓', 'Diário'], ['🗺️', 'Mapa'], ['✉️', 'Carta'], ['📝', 'Nota'], ['🖋️', 'Pena de escrever'], ['🔖', 'Marcador'],
      ['🪧', 'Placa'], ['📯', 'Corneta'], ['🎫', 'Bilhete'], ['🏷️', 'Etiqueta'],
    ]),
  },
  {
    id: 'treasure',
    label: '💰 Tesouro',
    sprites: sprites([
      ['💰', 'Saco de ouro'], ['🏺', 'Vaso antigo'], ['🏆', 'Troféu'], ['🥇', 'Medalha'], ['🎁', 'Presente'], ['📦', 'Caixa'],
      ['🗃️', 'Baú'], ['💵', 'Notas'], ['🎲', 'Dados'], ['🃏', 'Carta'], ['🎴', 'Carta de tarô'], ['🪕', 'Alaúde'],
      ['🎻', 'Violino'], ['🥁', 'Tambor'], ['🎺', 'Trompete'], ['🪈', 'Flauta'],
    ]),
  },
  {
    id: 'creatures',
    label: '🐉 Criaturas',
    sprites: sprites([
      ['🐉', 'Dragão'], ['🐀', 'Rato'], ['🦇', 'Morcego'], ['🕷️', 'Aranha'], ['🐍', 'Serpente'], ['🐸', 'Sapo'], ['🦉', 'Coruja'],
      ['🐺', 'Lobo'], ['🐴', 'Cavalo'], ['🦅', 'Águia'], ['🐢', 'Tartaruga'], ['🦎', 'Lagarto'], ['🐝', 'Abelha'], ['🪲', 'Besouro'],
    ]),
  },
]

/** Todas as opções em uma lista plana (ordem das categorias). */
export const ITEM_SPRITES: ItemSprite[] = ITEM_SPRITE_CATEGORIES.flatMap((c) => c.sprites)

export const RARITY_LABEL: Record<ItemRarity, string> = {
  common: 'Comum',
  uncommon: 'Incomum',
  rare: 'Raro',
  epic: 'Épico',
  legendary: 'Lendário',
}

export const RARITIES = Object.keys(RARITY_LABEL) as ItemRarity[]

/** Instancia a entidade Item com um UUID novo a partir do formulário do Mestre. */
export function forgeItem(input: NewItemInput): Item {
  const storage = input.containerSlots !== undefined
  const quantity = storage ? 1 : Math.max(1, Math.floor(input.quantity) || 1)
  const maxStack = storage ? 1 : Math.max(quantity, Math.floor(input.maxStack) || 1)
  return {
    ...(storage ? { container: emptyInventory(input.containerSlots) } : {}),
    id: newId(),
    name: input.name.trim(),
    icon: input.icon,
    description: input.description?.trim() || undefined,
    image: input.image || undefined,
    rarity: input.rarity,
    quantity,
    maxStack,
  }
}

/** Limite da imagem anexada (data URL) para não inchar a ficha JSON nem as mensagens da sala. */
export const MAX_ITEM_IMAGE_CHARS = 400_000

export function isValidItemInput(input: NewItemInput): boolean {
  return (
    input.name.trim().length > 0 &&
    input.icon.length > 0 &&
    (input.image === undefined || (input.image.startsWith('data:image/') && input.image.length <= MAX_ITEM_IMAGE_CHARS)) &&
    (input.containerSlots === undefined ||
      (Number.isInteger(input.containerSlots) && input.containerSlots >= 1 && input.containerSlots <= MAX_CONTAINER_SLOTS)) &&
    RARITIES.includes(input.rarity) &&
    Number.isInteger(input.quantity) &&
    input.quantity >= 1
  )
}
