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
        <section id='viewProfileContainer' className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 font-[family-name:var(--font-body)] text-[var(--text)] sm:px-6">
            <header className="relative overflow-hidden rounded-2xl bg-[url('/Background.png')] bg-cover bg-center">
                <div className="absolute inset-0 bg-orange-600/70" />

                <div className="relative flex flex-col gap-2 px-6 py-10 sm:px-10">
                    <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-white sm:text-3xl">My Profile</h2>
                    <p className="max-w-2xl text-sm text-orange-50 sm:text-base">Review your account details and personal information on file.</p>
                </div>
            </header>

            <main className="flex flex-col gap-6">
                {loading ? (
                    <p className="py-12 text-center text-sm text-gray-500">Loading profile...</p>
                ) : (
                    <>
                        <fieldset className="flex flex-col gap-4 rounded-xl border border-orange-100 bg-white p-5 shadow-sm">
                            <legend className="px-2 font-[family-name:var(--font-heading)] text-sm font-semibold text-[var(--primary-dark)]">Account Details</legend>

                            <div className="flex flex-col gap-3">
                                <div className="flex flex-col gap-0.5 border-b border-orange-100 pb-3 sm:flex-row sm:items-center sm:gap-4">
                                    <strong className="text-sm font-semibold text-gray-700 sm:w-44">Member Since:</strong>
                                    <p className="text-sm text-[var(--text)]">{user?.created_at ? formatDate(user.created_at) : 'N/A'}</p>
                                </div>

                                <div className="flex flex-col gap-0.5 border-b border-orange-100 pb-3 sm:flex-row sm:items-center sm:gap-4">
                                    <strong className="text-sm font-semibold text-gray-700 sm:w-44">Username:</strong>
                                    <p className="text-sm text-[var(--text)]">{user?.username || 'N/A'}</p>
                                </div>

                                <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-4">
                                    <strong className="text-sm font-semibold text-gray-700 sm:w-44">Role:</strong>
                                    <p className="text-sm text-[var(--text)]">{user?.role ? user?.role.charAt(0).toUpperCase() + user?.role.slice(1) : 'N/A'}</p>
                                </div>
                            </div>
                        </fieldset>

                        <fieldset className="flex flex-col gap-4 rounded-xl border border-orange-100 bg-white p-5 shadow-sm">
                            <legend className="px-2 font-[family-name:var(--font-heading)] text-sm font-semibold text-[var(--primary-dark)]">{userRole === 'landlord' ? 'Landlord' : 'Tenant'} Information</legend>

                            <div className="flex flex-col gap-3">
                                <div className="flex flex-col gap-0.5 border-b border-orange-100 pb-3 sm:flex-row sm:items-center sm:gap-4">
                                    <strong className="text-sm font-semibold text-gray-700 sm:w-44">Account ID:</strong>
                                    <p className="text-sm text-[var(--text)]">{profile?.user_id || 'N/A'}</p>
                                </div>
                                
                                <div className="flex flex-col gap-0.5 border-b border-orange-100 pb-3 sm:flex-row sm:items-center sm:gap-4">
                                    <strong className="text-sm font-semibold text-gray-700 sm:w-44">Full Name:</strong>
                                    <p className="text-sm text-[var(--text)]">{profile?.first_name || ''} {profile?.middle_name || ''} {profile?.last_name || ''} {profile?.ext_name || ''}</p>
                                </div>

                                <div className="flex flex-col gap-0.5 border-b border-orange-100 pb-3 sm:flex-row sm:items-center sm:gap-4">
                                    <strong className="text-sm font-semibold text-gray-700 sm:w-44">Email:</strong>
                                    <p className="text-sm text-[var(--text)]">{profile?.email || 'N/A'}</p>
                                </div>

                                <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-4">
                                    <strong className="text-sm font-semibold text-gray-700 sm:w-44">Contact Number:</strong>
                                    <p className="text-sm text-[var(--text)]">{profile?.contact_num || 'N/A'}</p>
                                </div>
                            </div>
                        </fieldset>

                        <div className="flex flex-wrap gap-3">
                            <button
                                type="button"
                                onClick={() => onUpdateProfile()}
                                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--primary-dark)] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <i className="fa-solid fa-pen-to-square" />
                                Modify Details
                            </button>

                            <button
                                type="button"
                                onClick={goBack}
                                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100"
                            >
                                <i className="fa-solid fa-arrow-left" />
                                Go Back
                            </button>
                        </div>
                    </>
                )}
            </main>
        </section>
    )
}

export default ViewProfile