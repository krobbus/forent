import React, { useState } from 'react'
import type { AuthProps } from '../utils/props'

function Auth({ goBack, setUserRole, setUserId, onForgotPassword }: AuthProps){
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: '',
        pin: '',
        confirmPin: '',
        role: '',
        firstName: '',
        middleName: '',
        lastName: '',
        extension: '',
        email: '',
        contactNumber: ''
    });
    
    const [viewPassword, setViewPassword] = useState(false);
    const [viewConfirmPassword, setViewConfirmPassword] = useState(false);
    const [viewPin, setViewPin] = useState(false);
    const [viewConfirmPin, setViewConfirmPin] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!isLogin) {
            if (formData.password !== formData.confirmPassword) {
                alert("Passwords do not match.");
                return;
            }
            if (formData.pin !== formData.confirmPin) {
                alert("PINs do not match.");
                return;
            }
        }

        const { confirmPassword, confirmPin, ...payload } = formData;
        const endpoint = isLogin ? '/api/login' : '/api/register'; 
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const data = await response.json();

                if (isLogin){
                    setUserId(data.user.id);
                    setUserRole(data.user.role);
                } else {
                    alert("Registration successful! Please log in.");
                    setIsLogin(true);
                }
            } else {
                const data = await response.json();

                if (isLogin) {
                    alert("Wrong credentials, please try again.");
                } else {
                    alert(`Registration failed: ${data.message || 'Please check your input and try again.'}`);
                }
            }
        } catch (error) {
            console.error("Connection error:", error);
        }
    };

    return (
        <section id='authContainer' className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 font-[family-name:var(--font-body)] text-[var(--text)] sm:px-6">
            <header className="relative overflow-hidden rounded-2xl bg-[url('/Background.png')] bg-cover bg-center">
                <div className="absolute inset-0 bg-orange-600/70" />

                <div className="relative flex flex-col gap-2 px-6 py-10 sm:px-10">
                    <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-white sm:text-3xl">{isLogin ? 'Log In' : 'Sign Up'}</h2>
                    <p className="max-w-2xl text-sm text-orange-50 sm:text-base">Please {isLogin ? 'log in' : 'sign up'} your account to continue</p>
                </div>
            </header>

            <main>
                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    <fieldset className="flex flex-col gap-4 rounded-xl border border-orange-100 bg-white p-5 shadow-sm">
                        <legend className="px-2 font-[family-name:var(--font-heading)] text-sm font-semibold text-[var(--primary-dark)]">Account {isLogin ? 'Log In' : 'Sign Up Credentials'}</legend>
                        
                        <div className={`grid grid-cols-1 gap-4 ${!isLogin ? 'sm:grid-cols-2' : ''}`}>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-gray-700">{isLogin ? 'Email or Username' : 'Username'} <span className="text-red-500">*</span></label>
                                <input
                                    name={isLogin ? 'loginId' : 'username'}
                                    type='text'
                                    placeholder={isLogin ? 'Enter your email or username' : 'Enter your username'}
                                    autoComplete={isLogin ? 'loginId' : 'username'}
                                    onChange={handleChange}
                                    required
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-[var(--text)] placeholder:text-gray-400 transition-colors focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-orange-200"
                                />
                            </div>

                            {!isLogin && (
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-medium text-gray-700">Role <span className="text-red-500">*</span></label>
                                    <select
                                        name='role'
                                        onChange={handleChange}
                                        required
                                        className="w-full cursor-pointer rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-[var(--text)] transition-colors focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-orange-200"
                                    >
                                        <option value=''>Select Role</option>
                                        <option value='landlord'>Landlord</option>
                                        <option value='tenant'>Tenant</option>
                                    </select>
                                </div>
                            )}

                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-gray-700">Password <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <input 
                                        name='password' 
                                        type={viewPassword ? 'text' : 'password'}
                                        placeholder="Enter your password"
                                        autoComplete={isLogin ? 'current-password' : 'new-password'}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 pr-10 text-sm text-[var(--text)] placeholder:text-gray-400 transition-colors focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-orange-200"
                                    />

                                    <button
                                        type='button'
                                        onClick={() => setViewPassword(prev => !prev)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 transition-colors hover:text-[var(--primary)]"
                                    >
                                        <i className={`fa-solid ${viewPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
                                    </button>
                                </div>
                            </div>

                            {!isLogin && (
                                <>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-sm font-medium text-gray-700">Confirm Password <span className="text-red-500">*</span></label>
                                        <div className="relative">
                                            <input 
                                                name='confirmPassword' 
                                                type={viewConfirmPassword ? 'text' : 'password'}
                                                placeholder="Re-enter your password"
                                                autoComplete='new-password'
                                                onChange={handleChange}
                                                required
                                                className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 pr-10 text-sm text-[var(--text)] placeholder:text-gray-400 transition-colors focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-orange-200"
                                            />

                                            <button
                                                type='button'
                                                onClick={() => setViewConfirmPassword(prev => !prev)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 transition-colors hover:text-[var(--primary)]"
                                            >
                                                <i className={`fa-solid ${viewConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-sm font-medium text-gray-700">PIN <span className="text-red-500">*</span></label>
                                        <div className="relative">
                                            <input
                                                name='pin'
                                                type={viewPin ? 'text' : 'password'}
                                                placeholder="Enter your PIN"
                                                autoComplete='pin'
                                                onChange={handleChange}
                                                required
                                                className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 pr-10 text-sm text-[var(--text)] placeholder:text-gray-400 transition-colors focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-orange-200"
                                            />

                                            <button
                                                type='button'
                                                onClick={() => setViewPin(prev => !prev)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 transition-colors hover:text-[var(--primary)]"
                                            >
                                                <i className={`fa-solid ${viewPin ? 'fa-eye-slash' : 'fa-eye'}`} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-sm font-medium text-gray-700">Confirm PIN <span className="text-red-500">*</span></label>
                                        <div className="relative">
                                            <input
                                                name='confirmPin'
                                                type={viewConfirmPin ? 'text' : 'password'}
                                                placeholder="Re-enter your PIN"
                                                autoComplete='confirmPin'
                                                onChange={handleChange}
                                                required
                                                className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 pr-10 text-sm text-[var(--text)] placeholder:text-gray-400 transition-colors focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-orange-200"
                                            />

                                            <button
                                                type='button'
                                                onClick={() => setViewConfirmPin(prev => !prev)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 transition-colors hover:text-[var(--primary)]"
                                            >
                                                <i className={`fa-solid ${viewConfirmPin ? 'fa-eye-slash' : 'fa-eye'}`} />
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {isLogin && (
                            <small className="text-sm text-gray-500">
                                Forgot your password?{' '}
                                <button
                                    type='button'
                                    onClick={onForgotPassword}
                                    className="cursor-pointer font-semibold text-[var(--primary)] transition-colors hover:text-[var(--primary-dark)] hover:underline"
                                >
                                    Click here
                                </button>
                            </small>
                        )}
                    </fieldset>
                    
                    {!isLogin && (
                        <fieldset className="flex flex-col gap-4 rounded-xl border border-orange-100 bg-white p-5 shadow-sm">
                            <legend className="px-2 font-[family-name:var(--font-heading)] text-sm font-semibold text-[var(--primary-dark)]">Personal Information</legend>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-medium text-gray-700">First Name <span className="text-red-500">*</span></label>
                                    <input name='firstName' type='text' placeholder="Enter your first name" autoComplete='firstName' onChange={handleChange} required className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-[var(--text)] placeholder:text-gray-400 transition-colors focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-orange-200" />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-medium text-gray-700">Middle Name</label>
                                    <input name='middleName' type='text' placeholder="Enter your middle name" autoComplete='middleName' onChange={handleChange} className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-[var(--text)] placeholder:text-gray-400 transition-colors focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-orange-200" />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-medium text-gray-700">Last Name <span className="text-red-500">*</span></label>
                                    <input name='lastName' type='text' placeholder="Enter your last name" autoComplete='lastName' onChange={handleChange} required className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-[var(--text)] placeholder:text-gray-400 transition-colors focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-orange-200" />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-medium text-gray-700">Extension</label>
                                    <input name='extension' type='text' placeholder="e.g. jr., sr., III" autoComplete='extenstion' onChange={handleChange} className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-[var(--text)] placeholder:text-gray-400 transition-colors focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-orange-200" />
                                </div>
                                
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-medium text-gray-700">Email <span className="text-red-500">*</span></label>
                                    <input name='email' type='email' placeholder="e.g. XXXXXXX@XXXXX.com" autoComplete='email' onChange={handleChange} required className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-[var(--text)] placeholder:text-gray-400 transition-colors focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-orange-200" />
                                </div>
                                
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-medium text-gray-700">Contact Number</label>
                                    <input name='contactNumber' type='text' placeholder="09XXXXXXXXX" autoComplete='contactNumber' onChange={handleChange} className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-[var(--text)] placeholder:text-gray-400 transition-colors focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-orange-200" />
                                </div>
                            </div>
                        </fieldset>
                    )}
                    
                    <div className="flex flex-wrap justify-center gap-3 ml-auto">
                        <button
                            type='submit'
                            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--primary-dark)] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <i className={`fa-solid ${isLogin ? 'fa-right-to-bracket' : 'fa-user-plus'}`} />
                            {isLogin ? 'Login' : 'Register'}
                        </button>

                        <button
                            type='button'
                            onClick={() => setIsLogin(!isLogin)}
                            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-[var(--primary)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--primary)] transition-colors hover:bg-[var(--primary-soft)]"
                        >
                            <i className='fa-solid fa-repeat' />
                            Switch to {isLogin ? 'Registration' : 'Login'}
                        </button>

                        <button
                            type='button'
                            onClick={goBack}
                            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100"
                        >
                            <i className='fa-solid fa-arrow-left' />
                            Go Back
                        </button>
                    </div>
                </form>
            </main>
        </section>
    )
}

export default Auth