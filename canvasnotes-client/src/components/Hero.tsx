import Button from "./ui/Button";
import Background from "./Background";
import { useNavigate } from "react-router";



export default function Hero() {

    const navigate = useNavigate();


    return (
        <div className="relative h-screen w-screen overflow-hidden">
            {/* Canvas fills the background */}
            <Background />

            {/* UI overlay on top of canvas */}
            <div className="relative z-10 flex flex-col items-center justify-center h-full gap-4">
                <h1 className="text-6xl font-bold">Canvas Notes</h1>
                <p className="text-lg text-gray-600">
                    Make notes in your own style with total freedom.
                </p>
                <Button text="Get Started" onClick={() => navigate("/canvas")} />
            </div>
        </div>
    );
}