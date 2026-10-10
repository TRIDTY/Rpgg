import { useEffect } from 'react'
import { useAppStore } from './store/appStore'
import { useRoomStore } from './store/roomStore'
import { HomeScreen } from './screens/HomeScreen'
import { CreateCharacterScreen } from './screens/CreateCharacterScreen'
import { HostRoomScreen } from './screens/HostRoomScreen'
import { JoinRoomScreen } from './screens/JoinRoomScreen'
import { ProfileSelectScreen } from './screens/ProfileSelectScreen'
import { SessionScreen } from './screens/SessionScreen'

export default function App() {
  const screen = useAppStore((s) => s.screen)
  const loading = useAppStore((s) => s.loading)
  const load = useAppStore((s) => s.load)
  const mode = useRoomStore((s) => s.mode)
  const self = useRoomStore((s) => s.self)
  const navigate = useAppStore((s) => s.navigate)

  useEffect(() => {
    void load()
  }, [load])

  // A sessão exige rede + ficha; a seleção de ficha exige rede. Se a conexão cair, volta para a Home.
  useEffect(() => {
    if (mode === 'idle' && (screen === 'session' || screen === 'select-profile')) navigate('home')
    else if (screen === 'session' && !self && mode !== 'idle') navigate('select-profile')
  }, [screen, mode, self, navigate])

  if (loading) return null

  switch (screen) {
    case 'create-character':
      return <CreateCharacterScreen />
    case 'host-room':
      return <HostRoomScreen />
    case 'join-room':
      return <JoinRoomScreen />
    case 'select-profile':
      return mode === 'idle' ? null : <ProfileSelectScreen />
    case 'session':
      return mode === 'idle' || !self ? null : <SessionScreen />
    case 'home':
    default:
      return <HomeScreen />
  }
}
