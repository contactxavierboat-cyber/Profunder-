import { getUncachableStripeClient } from './stripeClient';

const PLANS = [
  {
    name: 'Profundr Basic',
    description: 'Credit analysis, Capital Readiness Report, AI Chat Assistant, profile monitoring, and basic underwriting insights.',
    price: 2900,
  },
  {
    name: 'Profundr Repair',
    description: 'Everything in Basic plus Repair Center, AI dispute letters, 3-round dispute system, negative item identification, inquiry analysis, credit report error detection, and dispute tracking dashboard.',
    price: 4900,
  },
  {
    name: 'Profundr Capital',
    description: 'Everything in Basic + Repair plus Funding Sequence Strategy, lender targeting, capital stacking plan, real-time underwriting intelligence, Credit Unlocks tab, 1-on-1 guidance access, and approval probability insights.',
    price: 7900,
  },
];

async function createProducts() {
  const stripe = await getUncachableStripeClient();

  for (const plan of PLANS) {
    const products = await stripe.products.search({ query: `name:'${plan.name}'` });
    if (products.data.length > 0) {
      console.log(`Product already exists: ${products.data[0].id} (${plan.name})`);
      const prices = await stripe.prices.list({ product: products.data[0].id, active: true });
      if (prices.data.length > 0) {
        console.log(`  Price: ${prices.data[0].id} $${(prices.data[0].unit_amount! / 100)}/month`);
      }
      continue;
    }

    const product = await stripe.products.create({
      name: plan.name,
      description: plan.description,
    });
    console.log(`Created product: ${product.id} (${plan.name})`);

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: plan.price,
      currency: 'usd',
      recurring: { interval: 'month' },
    });
    console.log(`  Created price: ${price.id} ($${plan.price / 100}/month)`);
  }
}

createProducts().then(() => {
  console.log('Done!');
  process.exit(0);
}).catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
