import Stripe from 'stripe/cjs/stripe.cjs.node.js';
// import Stripe from 'stripe';

const payment = async ({
    stripe = new Stripe(process.env.stripeKey),
    payment_method_types = ["card"],
    mode = "payment",
    customer_email,
    metadata = {},
    success_url=process.env.success_url,
    cancel_url,
    discounts = [],
    line_items = []
} = {}) => {

    const session = await stripe.checkout.sessions.create({
        payment_method_types,
        mode,
        customer_email,
        metadata,
        success_url,
        cancel_url,
        discounts,
        line_items
    })
    return session
}

export default payment

// // Assuming you have the paymentIntent created and it has failed
// async function retryPayment(paymentIntent) {
//     try {
//       const paymentConfirmed = await stripe.paymentIntents.confirm(paymentIntent.client_secret);
//       return paymentConfirmed;
//     } catch (error) {
//       console.error('Error retrying Payment Intent:', error);
//       throw error;
//     }
//   }
  
// async function retryPaymentWithExponentialBackoff(paymentIntent, maxRetries, delay) {
//   let retryCount = 0;
//   let paymentConfirmed = null;

//   while (retryCount < maxRetries) {
//     try {
//       paymentConfirmed = await retryPayment(paymentIntent);
//       if (paymentConfirmed.status === 'succeeded') {
//         console.log('Payment successful on retry.');
//         break;
//       }
//     } catch (error) {
//       console.error(`Error on retry attempt ${retryCount + 1}:`, error);
//     }

//     retryCount++;
//     await new Promise((resolve) => setTimeout(resolve, delay * (2 ** retryCount)));
//   }

//   if (!paymentConfirmed || paymentConfirmed.status !== 'succeeded') {
//     console.log('Payment retries exhausted. Payment failed.');
//   }
// }
