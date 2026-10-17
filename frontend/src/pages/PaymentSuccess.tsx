import type { PaymentProps } from '../utils/props';

function PaymentSuccess({goBack} : PaymentProps) {
    return (
        <section id="paymentSuccessContainer">
            <header>
                <h2>Payment Successful!</h2>
                <p>Your transaction has been processed and confirmed.</p>
            </header>

            <main>
                <p className='loadingText'>Your payment has been confirmed. A record has been saved to your payment history.</p>

                <div className="btnWrapper">
                    <button className="backBtn" onClick={goBack}>Go Back</button>
                </div>
            </main>
        </section>
    );
}

export default PaymentSuccess;