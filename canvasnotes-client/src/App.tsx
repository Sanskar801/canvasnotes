import { Route, Routes } from "react-router"
import Hero from "./components/Hero"
import AuthScreen from "./components/auth/AuthScreen"
import RegistrationForm from "./components/auth/RegistrationForm"

export default function App() {
  return (
    <div className="bg-transparent text-black">
      <Routes>
        <Route path="/" element={<Hero />} />
        <Route path="/auth" element={<AuthScreen />} />
        <Route path="/auth/register" element={<RegistrationForm />} />
      </Routes>
    </div>
  )
}
