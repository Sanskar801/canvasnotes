import { Route, Routes } from "react-router"
import Hero from "./components/Hero"
import AuthScreen from "./components/auth/AuthScreen"
import RegistrationForm from "./components/auth/RegistrationForm"
import CanvasApp from "./components/canvas/CanvasApp"

export default function App() {
  return (
    <div className="bg-transparent text-black">
      <Routes>
        <Route path="/" element={<Hero />} />
        <Route path="/auth" element={<AuthScreen />} />
        <Route path="/auth/register" element={<RegistrationForm />} />
        <Route path="/canvas" element={<CanvasApp />} />
        <Route path="/canvas/:id" element={<CanvasApp />} />
      </Routes>
    </div>
  )
}
