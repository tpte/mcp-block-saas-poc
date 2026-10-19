import { BrowserRouter } from 'react-router-dom'
import { MatrixAppLayout } from './app/MatrixAppLayout'

export default function App() {
  return (
    <BrowserRouter>
      <MatrixAppLayout />
    </BrowserRouter>
  )
}
