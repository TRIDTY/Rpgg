import { useEffect } from 'react'
import { useAppStore } from './store/appStore'
import { useRoomStore } from './store/roomStore'
import { HomeScreen } from './screens/HomeScreen'
import { CreateCharacterScreen } from './screens/CreateCharacterScreen'
import { HostRoomScreen } from './screens/HostRoomScreen'
import { JoinRoomScreen } from './screens/JoinRoomScreen'
import { SessionScreen } from './screens/SessionScreen'

export default function App() {
  const screen = useAppStore((s) => s.screen)
  const loading = useAppStore((s) => s.loading)
  const load = useAppStore((s) => s.load)
  const mode = useRoomStore((s) => s.mode)
  const navigate = useAppStore((s) => s.navigate)

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (screen === 'session' && mode === 'idle') navigate('home')
  }, [screen, mode, navigate])

  if (loading) return null

  switch (screen) {
    case 'create-character':
      return <CreateCharacterScreen />
    case 'host-room':
      return <HostRoomScreen />
    case 'join-room':
      return <JoinRoomScreen />
    case 'session':
      return mode === 'idle' ? null : <SessionScreen />
    case 'home':
    default:
      return <HomeScreen />
  }
}
