import { useState, useEffect, useRef } from 'react'
import { authFetch } from '../utils/api'
import type { UpdateProfileProps, Step } from '../utils/props'

function ProgressSteps({ steps }: { steps: Step[] }) {
    return (
        <div className="flex items-start justify-between">
            {steps.map((step, i) => (
                <div key={i} className="relative flex flex-1 flex-col items-center gap-2">
                    <div className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors ${step.status === 'done'
                        ? 'bg-[var(--primary)] text-white'
                        : step.status === 'active'
                            ? 'border-2 border-[var(--primary)] bg-white text-[var(--primary)]'
                            : 'border-2 border-gray-300 bg-white text-gray-400'}`}
                    >
                        {step.status === 'done'
                            ? <i className='fa-solid fa-check text-xs' />
                            : <span>{i + 1}</span>
                        }
                    </div>

                    <p className={`text-center text-xs font-medium ${step.status === 'pending' ? 'text-gray-400' : 'text-[var(--primary-dark)]'}`}>{step.label}</p>

                    {i < steps.length - 1 && (
                        <div className={`absolute left-1/2 top-4 h-0.5 w-full ${steps[i + 1].status !== 'pending' ? 'bg-[var(--primary)]' : 'bg-gray-200'}`} />
                    )}
                </div>
            ))}
        </div>
    );
}

function UpdateProfile({ goBack, userRole, userId, restrictToCredentials = false, onSuccess }: UpdateProfileProps) {
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showCredForm, setShowCredForm] = useState(restrictToCredentials);
    const [showInfoForm, setShowInfoForm] = useState(false);
    const anySelected = showCredForm || showInfoForm;
    const [isVerified, setIsVerified] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [verifyError, setVerifyError] = useState('');
    const [viewCurrentPassword, setViewCurrentPassword] = useState(false);
    const [viewPin, setViewPin] = useState(false);
    const [viewNewPassword, setViewNewPassword] = useState(false);
    const [viewConfirmNewPassword, setViewConfirmNewPassword] = useState(false);

    const [infoData, setInfoData] = useState({
        first_name: '',
        middle_name: '',    
        last_name: '',
        ext_name: '',
        email: '',
        contact_num: '',
    });

    const [credData, setCredData] = useState({
        identifier: '',
        currentPassword: '',
        pin: '',
        newUsername: '',
        newPassword: '',
        confirmNewPassword: '',
    });

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (restrictToCredentials) {
            setLoading(false);
            return;
        }

        const fetchProfile = async () => {
            const endpoint = userRole === 'landlord' ? '/api/landlords' : '/api/tenants';
            
            try {
                const response = await authFetch(`${import.meta.env.VITE_API_URL}${endpoint}/${userId}`);
                if (!response.ok) return;

                const data = await response.json();
                setInfoData({
                    first_name: data.first_name || '',
                    middle_name: data.middle_name || '',
                    last_name: data.last_name || '',
                    ext_name: data.ext_name || '',
                    email: data.email || '',
                    contact_num: data.contact_num || '',
                });
            } catch (error) {
                console.error("Error fetching profile:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [userId, userRole]);

    const attemptVerify = (identifier: string, pin: string) => {
        if (!identifier || !pin) {
            setIsVerified(false);
            setVerifyError('');
            return;
        }

        if (debounceRef.current) clearTimeout(debounceRef.current);

        debounceRef.current = setTimeout(async () => {
            setVerifying(true);
            setVerifyError('');
            try {
                let response: Response;

                if (restrictToCredentials) {
                    response = await fetch(
                        `${import.meta.env.VITE_API_URL}/api/users/reset/verify`,
                        {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ identifier, pin })
                        },
                    );
                } else {
                    response = await authFetch(
                        `${import.meta.env.VITE_API_URL}/api/users/${userId}/verify`,
                        { method: 'POST', body: JSON.stringify({ currentPassword: identifier, pin }) }
                    );
                }

                if (response.ok) {
                    setIsVerified(true);
                    setVerifyError('');
                } else {
                    setIsVerified(false);
                    const data = await response.json();
                    setVerifyError(data.error || 'Verification failed.');
                }
            } catch {
                setIsVerified(false);
                setVerifyError('Unable to verify. Please try again.');
            } finally {
                setVerifying(false);
            }
        }, 600);
    };

    const handleCredChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const updated = { ...credData, [e.target.name]: e.target.value };
        setCredData(updated);

        if (e.target.name === 'identifier' || e.target.name === 'currentPassword' || e.target.name === 'pin') {
            setIsVerified(false);
            const identifierVal = restrictToCredentials
                ? (e.target.name === 'identifier' ? e.target.value : credData.identifier)
                : (e.target.name === 'currentPassword' ? e.target.value : credData.currentPassword);
            
            attemptVerify(
                identifierVal,
                e.target.name === 'pin' ? e.target.value : credData.pin
            );
        }
    };

    const handleInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInfoData({ ...infoData, [e.target.name]: e.target.value });
    };

    const handleCredToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
        setShowCredForm(e.target.checked);
        if (!e.target.checked) {
            setCredData({
                identifier: '', currentPassword: '', pin: '', newUsername: '',
                newPassword: '', confirmNewPassword: '',
            });
        }
    };

    const handleInfoToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
        setShowInfoForm(e.target.checked);
        if (!e.target.checked) {
            setInfoData({ first_name: '', middle_name: '', last_name: '', ext_name: '', email: '', contact_num: '' });
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        if (showCredForm) {
            if (restrictToCredentials) {
                if (!credData.identifier || !credData.pin) {
                    alert("Username/email and PIN are required.");
                    return;
                }
            } else {
                if (!credData.currentPassword || !credData.pin) {
                    alert("Current password and PIN are required.");
                    return;
                }
            }

            if (!credData.newUsername && !credData.newPassword) {
                alert("Please provide a new username or new password to update.");
                return;
            }
            
            if (credData.newPassword && credData.newPassword !== credData.confirmNewPassword) {
                alert("New passwords do not match.");
                return;
            }
        }
        setSubmitting(true);

        try {
            const requests: Promise<Response>[] = [];

            if (showCredForm) {
                const endpoint = restrictToCredentials
                    ? `${import.meta.env.VITE_API_URL}/api/users/reset/credentials`
                    : `${import.meta.env.VITE_API_URL}/api/users/${userId}/credentials`;

                const body = restrictToCredentials
                    ? {
                        identifier: credData.identifier,
                        pin: credData.pin,
                        newUsername: credData.newUsername || undefined,
                        newPassword: credData.newPassword || undefined,
                    }
                    : {
                        currentPassword: credData.currentPassword,
                        pin: credData.pin,
                        newUsername: credData.newUsername || undefined,
                        newPassword: credData.newPassword || undefined,
                    };

                const fetchFn = restrictToCredentials ? fetch : authFetch;
                requests.push(fetchFn(endpoint, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                }) as Promise<Response>);
            }

            if (showInfoForm) {
                const endpoint = userRole === 'landlord' ? '/api/landlords' : '/api/tenants';
                requests.push(
                    authFetch(`${import.meta.env.VITE_API_URL}${endpoint}/${userId}`, {
                        method: 'PATCH',
                        body: JSON.stringify(infoData),
                    })
                );
            }

            const results = await Promise.all(requests);
            const failed = results.find(r => !r.ok);

            if (failed) {
                const errorData = await failed.json();
                alert(`Error: ${errorData.error || 'One or more updates failed.'}`);
                return;
            }

            alert(showCredForm
                ? "Credentials updated. Please log in again."
                : "Profile updated successfully!"
            );

            onSuccess();
        } catch (error) {
            console.error("Update failed:", error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <section id='updateProfileContainer' className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 font-[family-name:var(--font-body)] text-[var(--text)] sm:px-6">
            <header className="relative overflow-hidden rounded-2xl bg-[url('/Background.png')] bg-cover bg-center">
                <div className="absolute inset-0 bg-orange-600/70" />

                <div className="relative flex flex-col gap-2 px-6 py-10 sm:px-10">
                    <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-white sm:text-3xl">{restrictToCredentials ? 'Password Recovery' : 'Update Profile'}</h2>
                    <p className="max-w-2xl text-sm text-orange-50 sm:text-base">{restrictToCredentials ? 'Securely reset your password for your account.' : 'Manage and update your account credentials and personal information securely.'}</p>
                </div>
            </header>

            {loading ? (
                <p className="py-12 text-center text-sm text-gray-500">Loading profile...</p>
            ) : (
                <main>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                        {!restrictToCredentials && (
                            <fieldset className="flex flex-col gap-4 rounded-xl border border-orange-100 bg-white p-5 shadow-sm">
                                <legend className="px-2 font-[family-name:var(--font-heading)] text-sm font-semibold text-[var(--primary-dark)]">Select What You Would Like to Update</legend>
                                <small className="text-sm text-gray-500">You may update one or both sections simultaneously. Select the applicable option(s) below to proceed.</small>
                                
                                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-orange-100 bg-white p-3 text-sm text-gray-700 transition-colors hover:bg-[var(--primary-soft)]">
                                    <input
                                        type='checkbox'
                                        checked={showCredForm}
                                        onChange={handleCredToggle}
                                        className="mt-0.5 h-4 w-4 cursor-pointer accent-[var(--primary)]"
                                    />
                                    <span>I would like to update my account credentials <span className="text-gray-400">(username or password)</span></span>
                                </label>

                                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-orange-100 bg-white p-3 text-sm text-gray-700 transition-colors hover:bg-[var(--primary-soft)]">
                                    <input
                                        type='checkbox'
                                        checked={showInfoForm}
                                        onChange={handleInfoToggle}
                                        className="mt-0.5 h-4 w-4 cursor-pointer accent-[var(--primary)]"
                                    />
                                    <span>I would like to update my personal information</span>
                                </label>
                            </fieldset>
                        )}

                        {showCredForm && (
                            <fieldset className="flex flex-col gap-4 rounded-xl border border-orange-100 bg-white p-5 shadow-sm">
                                <legend className="px-2 font-[family-name:var(--font-heading)] text-sm font-semibold text-[var(--primary-dark)]">Change Account Credentials</legend>
                                <small className="text-sm text-gray-500">For security purposes, please verify your identity before making any changes to your account credentials.</small>
                                
                                {(() => {
                                    const hasBoth = restrictToCredentials
                                        ? !!credData.identifier && !!credData.pin
                                        : !!credData.currentPassword && !!credData.pin;
                                    const verified  = isVerified;
                                    const hasNew    = !!(credData.newUsername || credData.newPassword);
                                    const confirmed = hasNew && credData.newPassword === credData.confirmNewPassword;

                                    const steps: Step[] = [
                                        { label: 'Enter Credentials', status: hasBoth ? 'done' : 'active' },
                                        { label: 'Verify Identity', status: !hasBoth ? 'pending' : verified ? 'done' : 'active' },
                                        { label: 'Set New Details', status: !verified ? 'pending' : (hasNew && !confirmed) ? 'active' : hasNew && confirmed ? 'done' : 'active' },
                                        { label: 'Save Changes', status: !verified || !hasNew ? 'pending' : confirmed ? 'active' : 'pending' },
                                    ];

                                    return <ProgressSteps steps={steps} />;
                                })()}

                                <fieldset className="flex flex-col gap-4 rounded-xl border border-orange-100 bg-white p-5 shadow-sm">
                                    <legend className="px-2 font-[family-name:var(--font-heading)] text-sm font-semibold text-[var(--primary-dark)]">Identity Verification</legend>
                                    <small className="text-sm text-gray-500">Enter your current password and PIN exactly as registered. Verification occurs automatically.</small>

                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        {restrictToCredentials ? (
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-sm font-medium text-gray-700">Username or Email <span className="text-red-500">*</span></label>
                                                <input
                                                    name='identifier'
                                                    type='text'
                                                    placeholder="Enter your username or email"
                                                    value={credData.identifier}
                                                    onChange={handleCredChange}
                                                    required
                                                    className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-[var(--text)] placeholder:text-gray-400 transition-colors focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-orange-200"
                                                />
                                            </div>
                                        ) : (
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-sm font-medium text-gray-700">Current Password <span className="text-red-500">*</span></label>
                                                <div className="relative">
                                                    <input
                                                        name='currentPassword'
                                                        type={viewCurrentPassword ? 'text' : 'password'}
                                                        placeholder="Enter your current password"
                                                        value={credData.currentPassword}
                                                        autoComplete='current-password'
                                                        onChange={handleCredChange}
                                                        required
                                                        className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 pr-10 text-sm text-[var(--text)] placeholder:text-gray-400 transition-colors focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-orange-200"
                                                    />

                                                    <button
                                                        type='button'
                                                        onClick={() => setViewCurrentPassword(prev => !prev)}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 transition-colors hover:text-[var(--primary)]"
                                                    >
                                                        <i className={`fa-solid ${viewCurrentPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                        
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-sm font-medium text-gray-700">PIN <span className="text-red-500">*</span></label>
                                            <div className="relative">
                                                <input
                                                    name='pin'
                                                    type={viewPin ? 'text' : 'password'}
                                                    placeholder="Enter your PIN"
                                                    value={credData.pin}
                                                    onChange={handleCredChange}
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
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        {verifying && <p className="text-sm text-gray-500"><small>Verifying credentials...</small></p>}
                                        {!verifying && isVerified && <p className="text-sm font-medium text-emerald-600"><small>Identity verified. You may now update your credentials below.</small></p>}
                                        {!verifying && verifyError && <p className="text-sm font-medium text-red-600"><small>{verifyError}</small></p>}
                                    </div>
                                </fieldset>
                                    
                                {isVerified && (
                                    <fieldset className="flex flex-col gap-4 rounded-xl border border-orange-100 bg-white p-5 shadow-sm">
                                        <legend className="px-2 font-[family-name:var(--font-heading)] text-sm font-semibold text-[var(--primary-dark)]">Account Details</legend>
                                        <small className="text-sm text-gray-500">Leave any field blank to retain its current value.</small>
                                        
                                        <div className="flex flex-col gap-4">
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-sm font-medium text-gray-700">New Username</label>
                                                <input
                                                    name='newUsername'
                                                    type='text'
                                                    placeholder="Enter a new username (optional)"
                                                    value={credData.newUsername}
                                                    autoComplete='username'
                                                    onChange={handleCredChange}
                                                    className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-[var(--text)] placeholder:text-gray-400 transition-colors focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-orange-200"
                                                />
                                            </div>
                                            
                                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                                <div className="flex flex-col gap-1.5">
                                                    <label className="text-sm font-medium text-gray-700">New Password</label>
                                                    <div className="relative">
                                                        <input
                                                            name='newPassword'
                                                            type={viewNewPassword ? 'text' : 'password'}
                                                            placeholder="Enter a new password (optional)"
                                                            value={credData.newPassword}
                                                            autoComplete='new-password'
                                                            onChange={handleCredChange}
                                                            className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 pr-10 text-sm text-[var(--text)] placeholder:text-gray-400 transition-colors focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-orange-200"
                                                        />

                                                        <button
                                                            type='button'
                                                            onClick={() => setViewNewPassword(prev => !prev)}
                                                            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 transition-colors hover:text-[var(--primary)]"
                                                        >
                                                            <i className={`fa-solid ${viewNewPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col gap-1.5">
                                                    <label className="text-sm font-medium text-gray-700">Confirm New Password</label>
                                                    <div className="relative">
                                                        <input
                                                            name='confirmNewPassword'
                                                            type={viewConfirmNewPassword ? 'text' : 'password'}
                                                            placeholder="Re-enter your new password"
                                                            value={credData.confirmNewPassword}
                                                            autoComplete='new-password'
                                                            onChange={handleCredChange}
                                                            className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 pr-10 text-sm text-[var(--text)] placeholder:text-gray-400 transition-colors focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-orange-200"
                                                        />

                                                        <button
                                                            type='button'
                                                            onClick={() => setViewConfirmNewPassword(prev => !prev)}
                                                            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 transition-colors hover:text-[var(--primary)]"
                                                        >
                                                            <i className={`fa-solid ${viewConfirmNewPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </fieldset>
                                )}
                            </fieldset>
                        )}

                        {showInfoForm && !restrictToCredentials && (
                            <fieldset className="flex flex-col gap-4 rounded-xl border border-orange-100 bg-white p-5 shadow-sm">
                                <legend className="px-2 font-[family-name:var(--font-heading)] text-sm font-semibold text-[var(--primary-dark)]">Personal Information</legend>
                                <small className="text-sm text-gray-500">Ensure all required fields are accurately filled in before submitting your changes.</small>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-sm font-medium text-gray-700">First Name <span className="text-red-500">*</span></label>
                                        <input name='first_name' type='text' placeholder="Enter your first name" value={infoData.first_name} autoComplete='firstName' onChange={handleInfoChange} required className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-[var(--text)] placeholder:text-gray-400 transition-colors focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-orange-200" />
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-sm font-medium text-gray-700">Middle Name</label>
                                        <input name='middle_name' type='text' placeholder="Enter your middle name" value={infoData.middle_name} autoComplete='middleName' onChange={handleInfoChange} className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-[var(--text)] placeholder:text-gray-400 transition-colors focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-orange-200" />
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-sm font-medium text-gray-700">Last Name <span className="text-red-500">*</span></label>
                                        <input name='last_name' type='text' placeholder="Enter your last name" value={infoData.last_name} autoComplete='lastName' onChange={handleInfoChange} required className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-[var(--text)] placeholder:text-gray-400 transition-colors focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-orange-200" />
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-sm font-medium text-gray-700">Extension</label>
                                        <input name='ext_name' type='text' placeholder="e.g. jr., sr., III" value={infoData.ext_name} autoComplete='extenstion' onChange={handleInfoChange} className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-[var(--text)] placeholder:text-gray-400 transition-colors focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-orange-200" />
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-sm font-medium text-gray-700">Email <span className="text-red-500">*</span></label>
                                        <input name='email' type='email' placeholder="e.g. XXXXXXX@XXXXX.com" value={infoData.email} autoComplete='email' onChange={handleInfoChange} required className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-[var(--text)] placeholder:text-gray-400 transition-colors focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-orange-200" />
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-sm font-medium text-gray-700">Contact Number</label>
                                        <input name='contact_num' type='text' placeholder="09XXXXXXXXX" value={infoData.contact_num} autoComplete='contactNumber' onChange={handleInfoChange} className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-[var(--text)] placeholder:text-gray-400 transition-colors focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-orange-200" />
                                    </div>
                                </div>
                            </fieldset>
                        )}

                        <div className="flex flex-wrap justify-end gap-3">
                            {anySelected ? (
                                <>
                                    <button
                                        type='submit'
                                        disabled={submitting}
                                        className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--primary-dark)] disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        <i className="fa-solid fa-floppy-disk" />
                                        {submitting ? 'Saving...' : 'Save Changes'}
                                    </button>

                                    <button
                                        type='button'
                                        onClick={goBack}
                                        className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100"
                                    >
                                        <i className="fa-solid fa-xmark" />
                                        Cancel
                                    </button>
                                </>
                            ) : (
                                <button
                                    type='button'
                                    onClick={goBack}
                                    className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100"
                                >
                                    <i className="fa-solid fa-arrow-left" />
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                </main>
            )}
        </section>
    );
}

export default UpdateProfile;