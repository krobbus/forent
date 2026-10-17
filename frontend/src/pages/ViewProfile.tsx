import { useState, useEffect } from 'react'
import { authFetch } from '../utils/api'
import type { UserDataProps, ProfileDataProps, ViewProfileProps } from '../utils/props'

function ViewProfile({ goBack, userRole, userId, onUpdateProfile }: ViewProfileProps){
    const [user, setUser] = useState<UserDataProps | null>(null);
    const [profile, setProfile] = useState<ProfileDataProps | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await authFetch(`${import.meta.env.VITE_API_URL}/api/users/${userId}`);
                if (!response.ok) return;

                const data = await response.json();
                setUser(data);
            } catch (error) {
                console.error("Error fetching user:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [userId]);

    useEffect(() => {
        const fetchProfile = async () => {
            const endpoint = userRole === 'landlord' ? `/api/landlords` : `/api/tenants`;

            try {
                const response = await authFetch(`${import.meta.env.VITE_API_URL}${endpoint}/${userId}`);
                if (!response.ok) return;

                const data = await response.json();
                setProfile(data);
            } catch (error) {
                console.error("Error fetching profile:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [userId, userRole]);

    const formatDate = (dateStr: string) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <section id='viewProfileContainer'>
            <header>
                <h2>My Profile</h2>
                <p>Review your account details and personal information on file.</p>
            </header>

            <main>
                {loading ? (
                    <p className='loadingText'>Loading profile...</p>
                ) : (
                    <>
                        <fieldset>
                            <legend>Account Details</legend>

                            <div className='columnGroup'>
                                <div className='rowGroup'>
                                    <strong>Member Since:</strong>
                                    <p>{user?.created_at ? formatDate(user.created_at) : 'N/A'}</p>
                                </div>

                                <div className='rowGroup'>
                                    <strong>Username:</strong>
                                    <p>{user?.username || 'N/A'}</p>
                                </div>

                                <div className='rowGroup'>
                                    <strong>Role:</strong>
                                    <p>{user?.role ? user?.role.charAt(0).toUpperCase() + user?.role.slice(1) : 'N/A'}</p>
                                </div>
                            </div>
                        </fieldset>

                        <fieldset>
                            <legend>{userRole === 'landlord' ? 'Landlord' : 'Tenant'} Information</legend>

                            <div className='columnGroup'>
                                <div className='rowGroup'>
                                    <strong>Account ID:</strong>
                                    <p>{profile?.user_id || 'N/A'}</p>
                                </div>
                                
                                <div className='rowGroup'>
                                    <strong>Full Name:</strong>
                                    <p>{profile?.first_name || ''} {profile?.middle_name || ''} {profile?.last_name || ''} {profile?.ext_name || ''}</p>
                                </div>

                                <div className='rowGroup'>
                                    <strong>Email:</strong>
                                    <p>{profile?.email || 'N/A'}</p>
                                </div>

                                <div className='rowGroup'>
                                    <strong>Contact Number:</strong>
                                    <p>{profile?.contact_num || 'N/A'}</p>
                                </div>
                            </div>
                        </fieldset>

                        <div className="btnWrapper">
                            <button type="button" className="modifyBtn" onClick={() => onUpdateProfile()}>Modify Details</button>
                            <button type="button" className="backBtn" onClick={goBack}>Go Back</button>
                        </div>
                    </>
                )}
            </main>
        </section>
    )
}

export default ViewProfile