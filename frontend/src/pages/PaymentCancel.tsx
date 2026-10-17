import type { PaymentProps } from '../utils/props';

function PaymentCancel({goBack} : PaymentProps) {
    return (
        <section id="paymentCancelContainer">
            <header>
                <h2>Payment Cancelled</h2>
                <p>Your payment session was ended before completion.</p>
            </header>

            <main>
                <p className='loadingText'>Your payment was not completed. Your pending record has been saved, you can try again anytime.</p>

                <div className="btnWrapper">
                    <button className="backBtn" onClick={goBack}>Go Back</button>
                </div>
            </main>
        </section>
    );
}

export default PaymentCancel;