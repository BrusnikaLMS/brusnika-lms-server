import { createRoot } from 'react-dom/client'
import { EmbedPlayer } from './EmbedPlayer'

const root = createRoot(document.getElementById('root')!)
root.render(<EmbedPlayer />)
