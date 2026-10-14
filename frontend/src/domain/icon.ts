/** Ícones podem ser emoji (texto) ou imagens personalizadas serializadas como data URL. */
export const isImageIcon = (icon: string) => icon.startsWith('data:image/')
