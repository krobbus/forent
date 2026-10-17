import Stripe from 'stripe';
module.exports = Stripe(process.env.STRIPE_KEY);