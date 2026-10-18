import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_KEY);

export const createRentCheckoutSession = ({
    amount,
    propertyName,
    periodCovered,
    paymentRecordId,
    propertyId,
    tenantId
}) => stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
        {
            price_data: {
                currency: 'php',
                product_data: {
                    name: `Rent Payment - ${propertyName}`,
                    description: `Period covered: ${periodCovered}`,
                },
                unit_amount: Math.round(amount * 100),
            },
            quantity: 1,
        },
    ],
    mode: 'payment',
    success_url: `${process.env.FRONTEND_URL}/?payment=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.FRONTEND_URL}/?payment=cancel`,
    metadata: {
        payment_record_id: paymentRecordId.toString(),
        property_id: propertyId.toString(),
        tenant_id: tenantId.toString(),
    },
});

export const constructStripeWebhookEvent = (payload, signature) =>
    stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK
    );