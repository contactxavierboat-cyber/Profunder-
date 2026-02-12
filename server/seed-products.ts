import { getUncachableStripeClient } from './stripeClient';

async function createProducts() {
  const stripe = await getUncachableStripeClient();

  const products = await stripe.products.search({ query: "name:'MentXr Monthly'" });
  if (products.data.length > 0) {
    console.log('Product already exists:', products.data[0].id);
    const prices = await stripe.prices.list({ product: products.data[0].id, active: true });
    if (prices.data.length > 0) {
      console.log('Price already exists:', prices.data[0].id, '$' + (prices.data[0].unit_amount! / 100));
    }
    return;
  }

  const product = await stripe.products.create({
    name: 'MentXr Monthly',
    description: 'MentXr® Monthly Access — AI-powered fundability analysis, bank-level underwriting logic, document verification, and priority support.',
  });
  console.log('Created product:', product.id);

  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: 5000,
    currency: 'usd',
    recurring: { interval: 'month' },
  });
  console.log('Created price:', price.id, '($50/month)');
}

createProducts().then(() => {
  console.log('Done!');
  process.exit(0);
}).catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
