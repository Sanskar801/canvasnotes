import Background from "../Background";
import AuthForm from "./AuthForm";

export default function AuthScreen() {
    return (
        <div className="h-screen flex items-center pl-6 relative">
            <AuthForm />
            <Background />
        </div>
    )
}
