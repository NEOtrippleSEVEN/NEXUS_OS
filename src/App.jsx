import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import PathLab from './pages/PathLab.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/path" element={<PathLab />} />
    </Routes>
  )
}
