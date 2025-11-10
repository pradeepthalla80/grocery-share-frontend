# Backend API Changes for Delivery Selection in Checkout

## Overview
The frontend now allows buyers to select delivery when purchasing items that offer it. The backend payment API must be updated to support this feature.

---

## API Endpoint Changes

### POST `/api/v1/payment/create-payment-intent`

#### Current Request Body:
```json
{
  "itemId": "string"
}
```

#### **NEW Request Body:**
```json
{
  "itemId": "string",
  "includeDelivery": boolean  // NEW FIELD (optional, defaults to false)
}
```

#### Backend Processing Steps:

1. **Fetch the item**:
   ```javascript
   const item = await Item.findById(itemId);
   if (!item) return res.status(404).json({ error: 'Item not found' });
   ```

2. **Validate delivery availability** (if `includeDelivery` is true):
   ```javascript
   if (includeDelivery && !item.offerDelivery) {
     return res.status(400).json({ 
       error: 'This item does not offer delivery' 
     });
   }
   ```

3. **Calculate total amount**:
   ```javascript
   let totalAmount = item.price;
   
   if (includeDelivery && item.offerDelivery) {
     // deliveryFee can be 0 for free delivery
     totalAmount += (item.deliveryFee || 0);
   }
   
   // Convert to cents for Stripe
   const amountInCents = Math.round(totalAmount * 100);
   ```

4. **Create Stripe PaymentIntent with the new total**:
   ```javascript
   const paymentIntent = await stripe.paymentIntents.create({
     amount: amountInCents,
     currency: 'usd',
     metadata: {
       itemId: item._id.toString(),
       itemName: item.name,
       itemPrice: item.price,
       includeDelivery: includeDelivery.toString(),  // NEW
       deliveryFee: includeDelivery ? (item.deliveryFee || 0) : 0,  // NEW
       sellerId: item.user.toString(),
       buyerId: req.user._id.toString()
     }
   });
   ```

5. **Store delivery selection** (when payment is confirmed):
   - When the payment is confirmed (in `confirmPayment` endpoint), store the delivery choice
   - Update the item or create an order record with `deliveryIncluded: boolean` field

---

## Database Schema Changes

### Item Model (if not already present):
```javascript
{
  offerDelivery: { type: Boolean, default: false },
  deliveryFee: { type: Number, default: 0 }  // Can be 0 for free delivery
}
```

### Transaction/Order Record (recommended):
When a payment is confirmed, store:
```javascript
{
  itemId: ObjectId,
  buyerId: ObjectId,
  sellerId: ObjectId,
  itemPrice: Number,
  deliveryIncluded: Boolean,  // NEW
  deliveryFee: Number,         // NEW
  totalAmount: Number,         // itemPrice + deliveryFee (if included)
  paymentIntentId: String,
  status: String,
  createdAt: Date
}
```

---

## Example Implementation

### `controllers/paymentController.js` - createPaymentIntent

```javascript
const createPaymentIntent = async (req, res) => {
  try {
    const { itemId, includeDelivery = false } = req.body;
    
    // Fetch item
    const item = await Item.findById(itemId).populate('user');
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    // Check if item is available
    if (item.status !== 'available') {
      return res.status(400).json({ error: 'Item is not available for purchase' });
    }
    
    // Validate delivery selection
    if (includeDelivery && !item.offerDelivery) {
      return res.status(400).json({ 
        error: 'This item does not offer delivery' 
      });
    }
    
    // Calculate total
    let totalAmount = item.price;
    let deliveryFee = 0;
    
    if (includeDelivery && item.offerDelivery) {
      deliveryFee = item.deliveryFee || 0;
      totalAmount += deliveryFee;
    }
    
    const amountInCents = Math.round(totalAmount * 100);
    
    // Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      metadata: {
        itemId: item._id.toString(),
        itemName: item.name,
        itemPrice: item.price.toString(),
        includeDelivery: includeDelivery.toString(),
        deliveryFee: deliveryFee.toString(),
        totalAmount: totalAmount.toString(),
        sellerId: item.user._id.toString(),
        buyerId: req.user._id.toString()
      }
    });
    
    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      totalAmount,
      deliveryIncluded: includeDelivery,
      deliveryFee
    });
    
  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
};
```

### `controllers/paymentController.js` - confirmPayment

Update to store delivery information:

```javascript
const confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    
    // Retrieve PaymentIntent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ error: 'Payment not successful' });
    }
    
    const { itemId, includeDelivery, deliveryFee, totalAmount } = paymentIntent.metadata;
    
    // Update item status
    const item = await Item.findByIdAndUpdate(
      itemId,
      { 
        status: 'sold',
        buyerId: req.user._id,
        paymentIntentId,
        // Store delivery info (optional, can be in separate order record)
        deliveryIncluded: includeDelivery === 'true',
        finalAmount: parseFloat(totalAmount)
      },
      { new: true }
    );
    
    // Notify seller with delivery info
    // ... notification logic
    
    res.json({
      success: true,
      message: 'Payment confirmed',
      item,
      deliveryIncluded: includeDelivery === 'true'
    });
    
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({ error: 'Failed to confirm payment' });
  }
};
```

---

## Frontend Integration (Already Implemented)

The frontend now sends:
```typescript
await createPaymentIntent(itemId, includeDelivery);
```

Where `includeDelivery` is a boolean that changes when the user toggles the delivery checkbox in the checkout modal.

---

## Testing Checklist

### Backend Testing:
- [ ] Payment intent creation with delivery (`includeDelivery: true`)
- [ ] Payment intent creation without delivery (`includeDelivery: false`)
- [ ] Validation error when delivery requested for non-delivery items
- [ ] Correct total calculation (item price + delivery fee)
- [ ] Free delivery (deliveryFee = 0) handled correctly
- [ ] Metadata stored in Stripe PaymentIntent
- [ ] Delivery info persisted in database after payment confirmation

### Frontend-Backend Integration:
- [ ] Delivery toggle changes payment intent amount
- [ ] Stripe checkout shows correct total
- [ ] Payment confirmation includes delivery status
- [ ] Seller notification shows if delivery was included
- [ ] Buyer receipt shows delivery fee breakdown

---

## Security Considerations

1. **Always validate delivery availability on backend** - Don't trust frontend
2. **Verify delivery fee matches item** - Prevent price manipulation
3. **Recalculate total on backend** - Never trust frontend totals
4. **Store delivery choice** - For fulfillment and support purposes

---

## Mobile Responsiveness (Frontend)

✅ Already implemented:
- Touch-friendly checkbox (44x44px minimum)
- Responsive text sizing (`text-sm sm:text-base`)
- Mobile-first layout (\u2264400px tested)
- Clear price breakdown visible on small screens

---

## Shopping Cart Feature Decision

**DECISION: Do NOT implement shopping cart**

**Rationale:**
- Grocery items are perishable and typically one-off
- Current "Buy Now" flow is streamlined for quick transactions
- Shopping cart adds complexity for minimal buyer value
- Inventory holds required for cart items add backend complexity
- Food sharing use case doesn't align with multi-item purchasing

**Revisit if:**
- Users frequently purchase multiple items from same seller
- Demand for bundled pickup/delivery from same location
- Analytics show cart abandonment costing conversions

---

## Deployment Steps

1. **Update backend payment controller** with new logic
2. **Test with Stripe test mode** to verify amounts
3. **Deploy backend** to Render (auto-deploy via GitHub)
4. **Deploy frontend** to Vercel (already done)
5. **Test end-to-end** with real checkout flow
6. **Monitor** payment success rates and delivery selections

---

## Support & Maintenance

- Payment metadata includes all delivery info for support queries
- Seller notifications should clearly indicate if delivery was purchased
- Buyer confirmations should show delivery fee breakdown
- Admin dashboard could show delivery vs pickup statistics
