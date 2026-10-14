import { Capacitor } from '@capacitor/core'
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'

export type ImageSource = 'camera' | 'gallery'

/**
 * Abre a câmera ou a galeria e devolve a imagem como data URL (ou null se cancelado).
 * No Android usa o plugin nativo; na web/demo usa um <input type="file">.
 */
export async function pickImage(source: ImageSource): Promise<string | null> {
  if (Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('Camera')) {
    try {
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.DataUrl,
        source: source === 'camera' ? CameraSource.Camera : CameraSource.Photos,
        quality: 85,
        width: 1280,
        height: 1280,
        correctOrientation: true,
      })
      return photo.dataUrl ?? null
    } catch {
      return null
    }
  }
  return pickImageFromFileInput(source)
}

function pickImageFromFileInput(source: ImageSource): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    if (source === 'camera') input.capture = 'environment'
    input.style.display = 'none'
    document.body.appendChild(input)
    const done = (value: string | null) => {
      input.remove()
      resolve(value)
    }
    input.addEventListener('change', () => {
      const file = input.files?.[0]
      if (!file) return done(null)
      const reader = new FileReader()
      reader.onload = () => done(typeof reader.result === 'string' ? reader.result : null)
      reader.onerror = () => done(null)
      reader.readAsDataURL(file)
    })
    input.addEventListener('cancel', () => done(null))
    input.click()
  })
}
