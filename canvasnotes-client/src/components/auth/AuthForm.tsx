import { useState } from "react";
import Button from "../ui/Button";
import { useNavigate } from "react-router";

export default function AuthForm() {
    const [isLogin, setIsLogin] = useState(true);
    const navigate = useNavigate();

    const handleClick = () => {
        if (!isLogin){
            navigate("/auth/register")
        }
    }
    
    return (
        <div className="bg-slate-700 shadow-2xl flex flex-col gap-3 h-fit max-w-[24rem] w-fit px-6 py-3.5 rounded-lg items-center flex-wrap z-10">
            <h1>{isLogin ? "Login" : "Singup"}</h1>

            {/* Social Auth */}
            <div className="social-auth flex flex-col gap-1.5">
                <Button text="Continue with Google" />
                <Button text="Continue with Apple" />
                <Button text="Continue with Meta" />
            </div>

            <p>OR</p>

            <Button text="Continue with Email/ Phone Number" onClick={handleClick} />

            <div>
                {isLogin ? (
                    <p>New here! <Button text="Create Account" onClick={() => setIsLogin(false)} /></p>
                ) : (
                    <p>Already a user! <Button text="Login" onClick={() => setIsLogin(true)} /></p>
                )}
            </div>

            <div>
                <br className="size-1 bg-amber-300" />
                <p>By continuing, you agree to the <span className="underline cursor-pointer">CanvasNotes Account Agreement</span></p>
            </div>
        </div>
    )
}
