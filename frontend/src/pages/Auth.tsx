import React, { useState, type ChangeEvent } from 'react'
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

    const handleSubmit = async (e: ChangeEvent) => {
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
        <section id='authContainer' className={`fr-page container py-5 ${isLogin ? 'fr-narrow' : 'fr-medium'}`}>
            <header className='fr-page-header'>
                <span className='fr-badge-icon'><i className={`fa-solid ${isLogin ? 'fa-house-chimney' : 'fa-user-plus'}`} /></span>
                <h2>{isLogin ? 'Welcome Back' : 'Create Your Account'}</h2>
                <p>Please {isLogin ? 'log in' : 'sign up'} your account to continue</p>
            </header>

            <main>
                <form onSubmit={handleSubmit}>
                    <div className='row g-4'>
                        <div className={isLogin ? 'col-12' : 'col-md-6'}>
                            <fieldset className='authField fr-fieldset'>
                                <legend><i className='fa-solid fa-shield-halved' />Account {isLogin ? 'Log In' : 'Sign Up Credentials'}</legend>

                                <div id={!isLogin ? 'signup-username' : 'login-username'} className='mb-3'>
                                    <label htmlFor='usernameInput' className='form-label'>{isLogin ? 'Email or Username' : 'Username'} <span className='text-danger'>*</span></label>
                                    <div className='input-group'>
                                        <span className='input-group-text'><i className='fa-solid fa-user' /></span>
                                        <input id='usernameInput' className='form-control' name={isLogin ? 'loginId' : 'username'} type='text' placeholder={isLogin ? 'Enter your email or username' : 'Enter your username'} autoComplete={isLogin ? 'loginId' : 'username'} onChange={handleChange} required />
                                    </div>
                                </div>

                                {!isLogin && (
                                    <div id='role' className='mb-3'>
                                        <label htmlFor='roleInput' className='form-label'>Role <span className='text-danger'>*</span></label>
                                        <div className='input-group'>
                                            <span className='input-group-text'><i className='fa-solid fa-id-badge' /></span>
                                            <select id='roleInput' className='form-select' name='role' onChange={handleChange} required>
                                                <option value='' className="default">Select Role</option>
                                                <option value='landlord'>Landlord</option>
                                                <option value='tenant'>Tenant</option>
                                            </select>
                                        </div>
                                    </div>
                                )}

                                <div id={!isLogin ? 'signup-password' : 'login-password'} className='mb-3'>
                                    <label htmlFor='passwordInput' className='form-label'>Password <span className='text-danger'>*</span></label>
                                    <div className='input-group'>
                                        <span className='input-group-text'><i className='fa-solid fa-lock' /></span>
                                        <input
                                            id='passwordInput'
                                            className='form-control'
                                            name='password'
                                            type={viewPassword ? 'text' : 'password'}
                                            placeholder="Enter your password"
                                            autoComplete={isLogin ? 'current-password' : 'new-password'}
                                            onChange={handleChange}
                                            required
                                        />
                                        <button type='button' className='btn btn-outline-secondary fr-toggle-eye' aria-label='Toggle password visibility' onClick={() => setViewPassword(prev => !prev)}>
                                            <i className={`fa-solid m-0 ${viewPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
                                        </button>
                                    </div>
                                </div>

                                {isLogin && <small className='text-secondary'>Forgot your password? <a className='fr-link' role='button' onClick={onForgotPassword}>Click here</a></small>}

                                {!isLogin && (
                                    <>
                                        <div id='confirmPassword' className='mb-3'>
                                            <label htmlFor='confirmPasswordInput' className='form-label'>Confirm Password <span className='text-danger'>*</span></label>
                                            <div className='input-group'>
                                                <span className='input-group-text'><i className='fa-solid fa-lock' /></span>
                                                <input
                                                    id='confirmPasswordInput'
                                                    className='form-control'
                                                    name='confirmPassword'
                                                    type={viewConfirmPassword ? 'text' : 'password'}
                                                    placeholder="Re-enter your password"
                                                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                                                    onChange={handleChange}
                                                    required
                                                />
                                                <button type='button' className='btn btn-outline-secondary fr-toggle-eye' aria-label='Toggle password visibility' onClick={() => setViewConfirmPassword(prev => !prev)}>
                                                    <i className={`fa-solid m-0 ${viewConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
                                                </button>
                                            </div>
                                        </div>

                                        <div id='pin' className='mb-3'>
                                            <label htmlFor='pinInput' className='form-label'>PIN <span className='text-danger'>*</span></label>
                                            <div className='input-group'>
                                                <span className='input-group-text'><i className='fa-solid fa-key' /></span>
                                                <input
                                                    id='pinInput'
                                                    className='form-control'
                                                    name='pin'
                                                    type={viewPin ? 'text' : 'password'}
                                                    placeholder="Enter your PIN"
                                                    autoComplete='pin'
                                                    onChange={handleChange}
                                                    required
                                                />
                                                <button type='button' className='btn btn-outline-secondary fr-toggle-eye' aria-label='Toggle PIN visibility' onClick={() => setViewPin(prev => !prev)}>
                                                    <i className={`fa-solid m-0 ${viewPin ? 'fa-eye-slash' : 'fa-eye'}`} />
                                                </button>
                                            </div>
                                        </div>

                                        <div id='confirmPin'>
                                            <label htmlFor='confirmPinInput' className='form-label'>Confirm PIN <span className='text-danger'>*</span></label>
                                            <div className='input-group'>
                                                <span className='input-group-text'><i className='fa-solid fa-key' /></span>
                                                <input
                                                    id='confirmPinInput'
                                                    className='form-control'
                                                    name='confirmPin'
                                                    type={viewConfirmPin ? 'text' : 'password'}
                                                    placeholder="Re-enter your PIN"
                                                    autoComplete='confirmPin'
                                                    onChange={handleChange}
                                                    required
                                                />
                                                <button type='button' className='btn btn-outline-secondary fr-toggle-eye' aria-label='Toggle PIN visibility' onClick={() => setViewConfirmPin(prev => !prev)}>
                                                    <i className={`fa-solid m-0 ${viewConfirmPin ? 'fa-eye-slash' : 'fa-eye'}`} />
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </fieldset>
                        </div>

                        {!isLogin && (
                            <div className='col-md-6'>
                                <fieldset className='infoField fr-fieldset'>
                                    <legend><i className='fa-solid fa-address-card' />Personal Information</legend>

                                    <div className='row g-3'>
                                        <div id='firstName' className='col-12'>
                                            <label htmlFor='firstNameInput' className='form-label'>First Name <span className='text-danger'>*</span></label>
                                            <input id='firstNameInput' className='form-control' name='firstName' type='text' placeholder="Enter your first name" autoComplete='firstName' onChange={handleChange} required />
                                        </div>

                                        <div id='middleName' className='col-12'>
                                            <label htmlFor='middleNameInput' className='form-label'>Middle Name</label>
                                            <input id='middleNameInput' className='form-control' name='middleName' type='text' placeholder="Enter your middle name" autoComplete='middleName' onChange={handleChange} />
                                        </div>

                                        <div id='lastName' className='col-sm-8'>
                                            <label htmlFor='lastNameInput' className='form-label'>Last Name <span className='text-danger'>*</span></label>
                                            <input id='lastNameInput' className='form-control' name='lastName' type='text' placeholder="Enter your last name" autoComplete='lastName' onChange={handleChange} required />
                                        </div>

                                        <div id='extName' className='col-sm-4'>
                                            <label htmlFor='extensionInput' className='form-label'>Extension</label>
                                            <input id='extensionInput' className='form-control' name='extension' type='text' placeholder="e.g. jr., III" autoComplete='extenstion' onChange={handleChange} />
                                        </div>

                                        <div id='email' className='col-12'>
                                            <label htmlFor='emailInput' className='form-label'>Email <span className='text-danger'>*</span></label>
                                            <div className='input-group'>
                                                <span className='input-group-text'><i className='fa-solid fa-envelope' /></span>
                                                <input id='emailInput' className='form-control' name='email' type='email' placeholder="e.g. XXXXXXX@XXXXX.com" autoComplete='email' onChange={handleChange} required />
                                            </div>
                                        </div>

                                        <div id='contactNumber' className='col-12'>
                                            <label htmlFor='contactNumberInput' className='form-label'>Contact Number</label>
                                            <div className='input-group'>
                                                <span className='input-group-text'><i className='fa-solid fa-phone' /></span>
                                                <input id='contactNumberInput' className='form-control' name='contactNumber' type='text' placeholder="09XXXXXXXXX" autoComplete='contactNumber' onChange={handleChange} />
                                            </div>
                                        </div>
                                    </div>
                                </fieldset>
                            </div>
                        )}
                    </div>

                    <section className='btnWrapper d-grid gap-2 col-md-8 col-lg-6 mx-auto mt-4'>
                        <button className='authBtn btn btn-primary btn-lg' type='submit'>
                            <i className={`fa-solid ${isLogin ? 'fa-right-to-bracket' : 'fa-user-check'}`} />
                            {isLogin ? 'Login' : 'Register'}
                        </button>
                        <button className='switchBtn btn btn-outline-primary' type='button' onClick={() => setIsLogin(!isLogin)}>
                            <i className='fa-solid fa-repeat' />
                            Switch to {isLogin ? 'Registration' : 'Login'}
                        </button>
                        <button className='backBtn btn btn-link text-secondary text-decoration-none' type='button' onClick={goBack}>
                            <i className='fa-solid fa-arrow-left' />
                            Go Back
                        </button>
                    </section>
                </form>
            </main>
        </section>
    )
}

export default Auth
