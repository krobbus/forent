import { useState, useEffect, useRef } from 'react'
import { authFetch } from '../utils/api'
import type { UpdateProfileProps, Step } from '../utils/props'

function ProgressSteps({ steps }: { steps: Step[] }) {
    return (
        <div className='progressWrapper'>
            {steps.map((step, i) => (
                <div key={i} className='progressStep'>
                    <div className={`progressNode ${step.status}`}>
                        {step.status === 'done'
                            ? <i className='fa-solid fa-check' />
                            : <span>{i + 1}</span>
                        }
                    </div>

                    <p className={`progressLabel ${step.status}`}>{step.label}</p>

                    {i < steps.length - 1 && (
                        <div className={`progressLine ${steps[i + 1].status !== 'pending' ? 'done' : ''}`} />
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

    const handleSubmit = async (e: React.ChangeEvent<HTMLFormElement>) => {
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
        <section id='updateProfileContainer'>
            <header>
                <h2>{restrictToCredentials ? 'Password Recovery' : 'Update Profile'}</h2>
                <p>{restrictToCredentials ? 'Securely reset your password for your account.' : 'Manage and update your account credentials and personal information securely.'}</p>
            </header>

            {loading ? (
                <p className='loadingText'>Loading profile...</p>
            ) : (
                <>
                    <main>
                        <form onSubmit={handleSubmit}>
                            {!restrictToCredentials && (
                                <fieldset className="toggleField">
                                    <legend>Select What You Would Like to Update</legend>
                                    <small>You may update one or both sections simultaneously. Select the applicable option(s) below to proceed.</small>
                                    
                                    <label className='toggleCheckbox'>
                                        <input
                                            type='checkbox'
                                            checked={showCredForm}
                                            onChange={handleCredToggle}
                                        />
                                        <p>I would like to update my account credentials <span>(username or password)</span></p>
                                    </label>

                                
                                    <label className='toggleCheckbox'>
                                        <input
                                            type='checkbox'
                                            checked={showInfoForm}
                                            onChange={handleInfoToggle}
                                        />
                                        <p>I would like to update my personal information</p>
                                    </label>
                                </fieldset>
                            )}

                            {showCredForm && (
                                <fieldset className='authField'>
                                    <legend>Change Account Credentials</legend>
                                    <small>For security purposes, please verify your identity before making any changes to your account credentials.</small>
                                    
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

                                    <fieldset className='accountIdentityField'>
                                        <legend>Identity Verification</legend>
                                        <small>Enter your current password and PIN exactly as registered. Verification occurs automatically.</small>

                                        <div className="accountIdentityWrapper">
                                            {restrictToCredentials ? (
                                                <div className='username'>
                                                    <label>Username or Email <span>*</span></label>
                                                    <input
                                                        name='identifier'
                                                        type='text'
                                                        placeholder="Enter your username or email"
                                                        value={credData.identifier}
                                                        onChange={handleCredChange}
                                                        required
                                                    />
                                                </div>
                                            ) : (
                                                <div className='currentPass'>
                                                    <label>Current Password <span>*</span></label>
                                                    <input
                                                        name='currentPassword'
                                                        type={viewCurrentPassword ? 'text' : 'password'}
                                                        placeholder="Enter your current password"
                                                        value={credData.currentPassword}
                                                        autoComplete='current-password'
                                                        onChange={handleCredChange}
                                                        required
                                                    />

                                                    <i 
                                                        className={`fa-solid ${viewCurrentPassword ? 'fa-eye-slash' : 'fa-eye'}`}
                                                        onClick={() => setViewCurrentPassword(prev => !prev)}
                                                    />
                                                </div>
                                            )}
                                            
                                            <div className="pin">
                                                <label>PIN <span>*</span></label>
                                                <input
                                                    name='pin'
                                                    type={viewPin ? 'text' : 'password'}
                                                    placeholder="Enter your PIN"
                                                    value={credData.pin}
                                                    onChange={handleCredChange}
                                                    required
                                                />

                                                <i 
                                                    className={`fa-solid ${viewPin ? 'fa-eye-slash' : 'fa-eye'}`}
                                                    onClick={() => setViewPin(prev => !prev)}
                                                />
                                            </div>
                                        </div>

                                        <div className="verificationWrapper">
                                            {verifying && <p className='verifying'><small>Verifying credentials...</small></p>}
                                            {!verifying && isVerified && <p className='verified'><small>Identity verified. You may now update your credentials below.</small></p>}
                                            {!verifying && verifyError && <p className='error'><small>{verifyError}</small></p>}
                                        </div>
                                    </fieldset>
                                        
                                    {isVerified && (
                                        <fieldset className='accountDetailsField'>
                                            <legend>Account Details</legend>
                                            <small>Leave any field blank to retain its current value.</small>
                                            
                                            <div className="accountDetailsWrapper">
                                                <div className="username">
                                                    <label>New Username</label>
                                                    <input
                                                        name='newUsername'
                                                        type='text'
                                                        placeholder="Enter a new username (optional)"
                                                        value={credData.newUsername}
                                                        autoComplete='username'
                                                        onChange={handleCredChange}
                                                    />
                                                </div>
                                                
                                                <div className="newPassword">
                                                    <label>New Password</label>
                                                    <input
                                                        name='newPassword'
                                                        type = {viewNewPassword ? 'text' : 'password'}
                                                        placeholder="Enter a new password (optional)"
                                                        value={credData.newPassword}
                                                        autoComplete='new-password'
                                                        onChange={handleCredChange}
                                                    />

                                                    <i 
                                                        className={`fa-solid ${viewNewPassword ? 'fa-eye-slash' : 'fa-eye'}`}
                                                        onClick={() => setViewNewPassword(prev => !prev)}
                                                    />
                                                </div>

                                                <div className="confirmPassword">
                                                    <label>Confirm New Password</label>
                                                    <input
                                                        name='confirmNewPassword'
                                                        type = {viewConfirmNewPassword ? 'text' : 'password'}
                                                        placeholder="Re-enter your new password"
                                                        value={credData.confirmNewPassword}
                                                        autoComplete='new-password'
                                                        onChange={handleCredChange}
                                                    />

                                                    <i 
                                                        className={`fa-solid ${viewConfirmNewPassword ? 'fa-eye-slash' : 'fa-eye'}`}
                                                        onClick={() => setViewConfirmNewPassword(prev => !prev)}
                                                    />
                                                </div>
                                            </div>
                                        </fieldset>
                                    )}
                                </fieldset>
                            )}

                            {showInfoForm && !restrictToCredentials && (
                                <fieldset className='infoField'>
                                    <legend>Personal Information</legend>
                                    <small>Ensure all required fields are accurately filled in before submitting your changes.</small>

                                    <div className="infoWrapper">
                                        <div id="firstName">
                                            <label>First Name <span>*</span></label>
                                            <input name='first_name' type='text' placeholder="Enter your first name" value={infoData.first_name} autoComplete='firstName' onChange={handleInfoChange} required />
                                        </div>

                                        <div id="middleName">
                                            <label>Middle Name</label>
                                            <input name='middle_name' type='text' placeholder="Enter your middle name" value={infoData.middle_name} autoComplete='middleName' onChange={handleInfoChange} />
                                        </div>

                                        <div id="lastName">
                                            <label>LastName <span>*</span></label>
                                            <input name='last_name' type='text' placeholder="Enter your last name" value={infoData.last_name} autoComplete='lastName' onChange={handleInfoChange} required />
                                        </div>

                                        <div id="extName">
                                            <label>Extension</label>
                                            <input name='ext_name' type='text' placeholder="e.g. jr., sr., III" value={infoData.ext_name} autoComplete='extenstion' onChange={handleInfoChange} />
                                        </div>

                                        <div id="email">
                                            <label>Email <span>*</span></label>
                                            <input name='email' type='email' placeholder="e.g. XXXXXXX@XXXXX.com" value={infoData.email} autoComplete='email' onChange={handleInfoChange} required />
                                        </div>

                                        <div id="contactNumber">
                                            <label>Contact Number</label>
                                            <input name='contact_num' type='text' placeholder="09XXXXXXXXX" value={infoData.contact_num} autoComplete='contactNumber' onChange={handleInfoChange} />
                                        </div>
                                    </div>
                                </fieldset>
                            )}

                            <div className='btnWrapper'>
                                {anySelected ? (
                                    <>
                                        <button type='submit' className='saveBtn' disabled={submitting}>
                                            {submitting ? 'Saving...' : 'Save Changes'}
                                        </button>
                                        <button type='button' className='cancelBtn' onClick={goBack}>Cancel</button>
                                    </>
                                ) : (
                                    <button type='button' className='backBtn' onClick={goBack}>Cancel</button>
                                )}
                            </div>
                        </form>
                    </main>
                </>
            )}
        </section>
    );
}

export default UpdateProfile;