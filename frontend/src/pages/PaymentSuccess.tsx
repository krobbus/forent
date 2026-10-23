import type { PaymentProps } from '../utils/props';

function PaymentSuccess({ goBack }: PaymentProps) {
    return (
        <section id="paymentSuccessContainer" className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 font-[family-name:var(--font-body)] text-[var(--text)] sm:px-6">
            <header className="relative overflow-hidden rounded-2xl bg-[url('/Background.png')] bg-cover bg-center">
                <div className="absolute inset-0 bg-orange-600/70" />

                <div className="relative flex flex-col gap-2 px-6 py-10 sm:px-10">
                    <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-white sm:text-3xl">Payment Successful!</h2>
                    <p className="max-w-2xl text-sm text-orange-50 sm:text-base">Your transaction has been processed and confirmed.</p>
                </div>
            </header>

            <main className="flex flex-col gap-6">
                <div className="flex flex-col items-center gap-4 rounded-xl border border-orange-100 bg-white p-8 text-center shadow-sm">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                        <i className="fa-solid fa-circle-check text-3xl" />
                    </div>

                    <p className="max-w-md text-sm leading-relaxed text-gray-600">
                        Your payment has been confirmed. A record has been saved to your payment history.
                    </p>
                </div>

                <div className="flex flex-wrap justify-end gap-3">
                    <button
                        type="button"
                        onClick={goBack}
                        className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--primary-dark)] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <i className="fa-solid fa-credit-card" />
                        View Payment History
                    </button>
                </div>
            </main>
        </section>
    );
}

export default PaymentSuccess;