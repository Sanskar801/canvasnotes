
export default function RegistrationForm() {
    return (
        <div className="bg-slate-700 shadow-2xl flex flex-col gap-3 h-fit max-w-[24rem] w-fit px-6 py-3.5 rounded-lg items-center flex-wrap z-10">
            <label htmlFor="email">Email</label>
            <input type="email" name="email" id="email" />
            <label htmlFor="password">Password</label>
            <input type="password" name="password" id="password" />
        </div>
    )
}

/* 
Email
OTP

Name
Gender
DOB | Age
Student | Working professional
if working industry

*/