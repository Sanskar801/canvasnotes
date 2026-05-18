import type { ComponentProps } from "react";

interface ButtonProps extends ComponentProps<'button'> {
    text: string;
    onClick?: () => void;
}

export default function Button({ text, onClick, ...rest }: ButtonProps) {
    return (
        <button
            // className="bg-gray-600 text-white px-4 py-2 rounded-xl hover:bg-gray-500 cursor-pointer w-fit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer w-fit"
            onClick={onClick}
            {...rest}
        >
            {text}
        </button>
    )
}
