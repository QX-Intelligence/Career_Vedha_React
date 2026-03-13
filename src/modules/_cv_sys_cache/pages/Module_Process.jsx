import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Loader2, Lock } from 'lucide-react';
import { useCache } from '../context/Cache_Context';
import inventoryApi from '../api/inventoryApi';
import { getUserContext } from '../../../services/api';
import { useSnackbar } from '../../../context/SnackbarContext';

const Module_Process = () => {
  const { items, total, count, clear, summary } = useCache();
  const { showSnackbar } = useSnackbar();
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [complete, setComplete] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [searchParams] = useSearchParams();
  const retryOrderId = searchParams.get('orderId');

  const [pollingStatus, setPollingStatus] = useState("");
  const [purchasedEbooks, setPurchasedEbooks] = useState([]);
  const [retryTotal, setRetryTotal] = useState(null);
  const [retryLoading, setRetryLoading] = useState(false);
  
  const subTotal = summary.subTotal || 0;
  const tax = summary.gstAmount || 0;
  const grandTotal = summary.totalAmount || 0;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    zip: ''
  });

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  useEffect(() => {
    if (retryOrderId) {
      setOrderId(Number(retryOrderId));
      fetchRetryDetails(retryOrderId);
    }
  }, [retryOrderId]);

  const fetchRetryDetails = async (id) => {
    try {
      setRetryLoading(true);
      const res = await inventoryApi.get('/orders/my/orders');
      const order = res.data.find(o => String(o.orderId) === String(id));
      if (order) {
        setRetryTotal(order.totalAmount);
        setStep(3); // Jump to review/pay step
      }
    } catch (e) {
      console.error("Failed to fetch retry details", e);
    } finally {
      setRetryLoading(false);
    }
  };

  const finalTotal = retryTotal || grandTotal;

  const handlePlaceOrder = async () => {
    const { isAuthenticated } = getUserContext();
    if (!isAuthenticated) {
      showSnackbar("Your session has expired. Please login again.", "error");
      return;
    }

    if (items.length === 0 && !retryOrderId) {
      showSnackbar("Your cart is empty.", "warning");
      return;
    }

    setIsProcessing(true);
    setPollingStatus("Creating your order...");
    try {
      let activeOrderId = orderId;

      // 1. Create Order in Backend (skip if we have a retryOrderId)
      if (!activeOrderId) {
        const orderRes = await inventoryApi.post('/orders/checkout');
        activeOrderId = Number(orderRes.data);
        setOrderId(activeOrderId);
      }

      // 2. Poll for INVENTORY_RESERVED status
      // We need to wait because Kafka processes inventory asynchronously
      setPollingStatus("Confirming reservation...");
      let isReserved = false;
      const maxAttempts = 30; // 60 seconds total (30 * 2s)
      
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        try {
          // 1. Check for success (INVENTORY_RESERVED)
          const reservedRes = await inventoryApi.get('/orders/my/orders', { params: { status: 'INVENTORY_RESERVED' } });
          const reservedOrders = reservedRes.data || [];
          
          if (reservedOrders.some(o => Number(o.orderId) == activeOrderId)) {
            isReserved = true;
            break;
          }

          // 2. Check for failure (FAILED)
          const failedRes = await inventoryApi.get('/orders/my/orders', { params: { status: 'FAILED' } });
          const failedOrders = failedRes.data || [];
          if (failedOrders.some(o => Number(o.orderId) == activeOrderId)) {
            throw new Error("Inventory reservation failed. Items may be out of stock.");
          }

          // 3. Provide feedback if still PENDING
          const pendingRes = await inventoryApi.get('/orders/my/orders', { params: { status: 'PENDING' } });
          const pendingOrders = pendingRes.data || [];
          if (pendingOrders.some(o => Number(o.orderId) == activeOrderId)) {
            setPollingStatus(`Reserving... (Attempt ${attempt + 1}/${maxAttempts})`);
          } else {
            setPollingStatus(`Processing... (${attempt + 1}/${maxAttempts})`);
          }
        } catch (pollError) {
          if (pollError.message.includes("Inventory reservation failed")) throw pollError;
        }
      }

      if (!isReserved) {
        throw new Error("Inventory reservation timed out.");
      }

      // 3. Create Razorpay Payment Order
      setPollingStatus("Preparing payment...");
      const paymentRes = await inventoryApi.post(`/payment/create/${activeOrderId}`);
      const razorpayOrderId = paymentRes.data;

      // 4. Open Razorpay Checkout
      setPollingStatus(""); // Clear status before opening popup
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY || "rzp_test_SOEla7YCEkhR7j",
        amount: Math.round(finalTotal * 100),
        currency: "INR",
        name: "Career Vedha Store",
        description: `Order #${activeOrderId}`,
        order_id: razorpayOrderId,
        handler: async (response) => {
          try {
            await inventoryApi.post('/payment/verify', {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature
            });
            
            // Capture ebook IDs before clearing
            const ebooks = items.filter(i => i.category === 'EBOOK').map(i => i.id);
            setPurchasedEbooks(ebooks);

            setComplete(true);
            clear();
            showSnackbar("Order placed successfully!", "success");
          } catch (paymentError) {
            console.error("Payment Verification Error:", paymentError);
            showSnackbar("Payment verification failed. Please check your order history or contact support.", "error");
          }
        },
        prefill: {
          name: formData.name,
          email: formData.email,
          contact: formData.phone
        },
        theme: { color: "#D4A843" }
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.open();
    } catch (e) {
      console.error("Checkout process failed", e);
      const errorMsg = e.response?.data?.message || e.response?.data || e.message || "Checkout failed";
      showSnackbar(`Checkout Error: ${errorMsg}`, "error");
    } finally {
      setIsProcessing(false);
      setPollingStatus("");
    }
  };

  if (retryLoading) return (
    <div style={{ padding: '15rem 0', textAlign: 'center', background: '#111', minHeight: '100vh', color: '#fff' }}>
      <Loader2 size={48} className="animate-spin" style={{ margin: '0 auto 1.5rem', color: '#D4A843' }} />
      <p style={{ color: '#666', fontSize: '1.2rem' }}>Initializing your retry...</p>
    </div>
  );

  if (items.length === 0 && !complete && !retryOrderId) return (
    <div style={{ padding: '12rem 1.5rem', textAlign: 'center', color: '#aaa', background: '#111', minHeight: '100vh' }}>
      <h2 style={{ color: '#fff', marginBottom: '1rem' }}>Your cart is empty</h2>
      <Link to="/e-store/shop" style={{ color: '#D4A843' }}>Return to Shop</Link>
    </div>
  );

  if (complete) return (
    <div style={{ padding: '10rem 1.5rem', textAlign: 'center', background: '#111', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} style={{ background: '#1a1a1a', padding: '4rem', borderRadius: '2rem', border: '1px solid rgba(212, 168, 67, 0.2)', maxWidth: '500px', boxShadow: '0 30px 60px rgba(0,0,0,0.5)' }}>
        <div style={{ width: '80px', height: '80px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem', color: '#10b981' }}>
          <CheckCircle2 size={48} />
        </div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", color: '#fff', fontSize: '2.5rem', marginBottom: '1rem' }}>Order Placed!</h1>
        <p style={{ color: '#888', marginBottom: '2rem', lineHeight: 1.6 }}>Your order has been confirmed. Order ID: #{orderId}</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {purchasedEbooks.length > 0 && (
            <Link 
              to="/e-store/library" 
              state={{ highlightId: purchasedEbooks[0] }}
              style={{ padding: '1rem 2.5rem', background: '#D4A843', color: '#111', fontWeight: 800, borderRadius: '100px', textDecoration: 'none', display: 'inline-block' }}
            >
              Go to My Library
            </Link>
          )}
          <Link to="/e-store" style={{ padding: '1rem 2.5rem', background: purchasedEbooks.length > 0 ? 'rgba(255,255,255,0.05)' : '#D4A843', color: purchasedEbooks.length > 0 ? '#fff' : '#111', fontWeight: 800, borderRadius: '100px', textDecoration: 'none', display: 'inline-block' }}>
            Back to Store
          </Link>
        </div>
      </Motion.div>
    </div>
  );

  return (
    <div style={{ paddingTop: '8rem', paddingBottom: '8rem', background: '#111', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem' }}>
        
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4rem', gap: '4rem' }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', opacity: step >= s ? 1 : 0.3 }}>
              <div style={{ width: '40px', height: '40px', background: step >= s ? '#D4A843' : '#1a1a1a', color: step >= s ? '#111' : '#fff', borderRadius: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, border: '2px solid', borderColor: step >= s ? '#D4A843' : '#333' }}>
                {s < step ? <CheckCircle2 size={18} /> : s}
              </div>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: step >= s ? '#fff' : '#444' }}>
                {s === 1 ? 'Shipping' : s === 2 ? 'Payment' : 'Review'}
              </span>
            </div>
          ))}
        </div>

        <div className="store-process-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '4rem', alignItems: 'start' }}>
          <div style={{ background: '#1a1a1a', padding: '3rem', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.03)' }}>
            <AnimatePresence mode="wait">
              {step === 1 && (
                <Motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                  <h2 style={{ fontFamily: "'Playfair Display', serif", color: '#fff', fontSize: '2rem', marginBottom: '2rem' }}>Shipping Details</h2>
                  <div className="store-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ display: 'block', color: '#666', fontSize: '0.75rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Full Name</label>
                      <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ width: '100%', background: '#111', border: '1px solid #333', padding: '1rem', borderRadius: '0.75rem', color: '#fff', outline: 'none' }} />
                    </div>
                    <div className="store-form-full-mobile">
                      <label style={{ display: 'block', color: '#666', fontSize: '0.75rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Email Address</label>
                      <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} style={{ width: '100%', background: '#111', border: '1px solid #333', padding: '1rem', borderRadius: '0.75rem', color: '#fff', outline: 'none' }} />
                    </div>
                    <div className="store-form-full-mobile">
                      <label style={{ display: 'block', color: '#666', fontSize: '0.75rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Phone Number</label>
                      <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} style={{ width: '100%', background: '#111', border: '1px solid #333', padding: '1rem', borderRadius: '0.75rem', color: '#fff', outline: 'none' }} />
                    </div>
                  </div>
                  <button onClick={nextStep} style={{ marginTop: '2.5rem', width: '100%', padding: '1.25rem', background: '#D4A843', color: '#111', fontWeight: 800, borderRadius: '0.75rem', border: 'none', cursor: 'pointer' }}>Continue</button>
                </Motion.div>
              )}

              {step === 2 && (
                <Motion.div key="step2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                  <h2 style={{ fontFamily: "'Playfair Display', serif", color: '#fff', fontSize: '2rem', marginBottom: '2rem' }}>Payment</h2>
                  <div style={{ display: 'grid', gap: '1.5rem' }}>
                    <div style={{ padding: '1.5rem', border: '2px solid #D4A843', borderRadius: '1rem', background: 'rgba(212, 168, 67, 0.05)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '20px', height: '20px', borderRadius: '100px', border: '6px solid #D4A843' }} />
                      <div>
                        <p style={{ color: '#fff', fontWeight: 600 }}>Secured Checkout</p>
                        <p style={{ color: '#666', fontSize: '0.8rem' }}>Payment via Razorpay</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>
                       <button onClick={prevStep} style={{ flex: 1, padding: '1rem', background: 'none', color: '#666', fontWeight: 600, border: 'none' }}>Back</button>
                       <button onClick={nextStep} style={{ flex: 2, padding: '1.25rem', background: '#D4A843', color: '#111', fontWeight: 800, borderRadius: '0.75rem', border: 'none' }}>Review</button>
                    </div>
                  </div>
                </Motion.div>
              )}

              {step === 3 && (
                <Motion.div key="step3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                  <h2 style={{ fontFamily: "'Playfair Display', serif", color: '#fff', fontSize: '2rem', marginBottom: '2rem' }}>Final Review</h2>
                  <div style={{ background: '#111', padding: '2rem', borderRadius: '1rem', border: '1px solid #333', marginBottom: '2rem' }}>
                    <div style={{ marginBottom: '1.5rem' }}>
                      <h4 style={{ color: '#D4A843', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>
                        {retryOrderId ? 'Order Details' : 'Delivery To'}
                      </h4>
                      {retryOrderId ? (
                        <p style={{ color: '#fff' }}>Retrying Payment for Order #{retryOrderId}</p>
                      ) : (
                        <>
                          <p style={{ color: '#fff' }}>{formData.name}</p>
                          <p style={{ color: '#888', fontSize: '0.9rem' }}>{formData.email} • {formData.phone}</p>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '2rem' }}>
                     <button onClick={prevStep} style={{ flex: 1, padding: '1rem', background: 'none', color: '#666', fontWeight: 600, border: 'none' }}>Back</button>
                     <button 
                        onClick={handlePlaceOrder} 
                        disabled={isProcessing}
                        style={{ flex: 2, padding: '1.25rem', background: '#D4A843', color: '#111', fontWeight: 800, borderRadius: '0.75rem', border: 'none', cursor: isProcessing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', flexDirection: 'column' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          {isProcessing ? <Loader2 className="animate-spin" /> : `Pay ₹${finalTotal}`}
                          {!isProcessing && <Lock size={18} />}
                        </div>
                        {isProcessing && pollingStatus && (
                          <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8 }}>{pollingStatus}</span>
                        )}
                      </button>
                  </div>
                </Motion.div>
              )}
            </AnimatePresence>
          </div>

          <aside>
            <div style={{ background: '#1a1a1a', padding: '2.5rem', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.03)' }}>
              <h3 style={{ color: '#fff', fontSize: '1.25rem', marginBottom: '1.5rem' }}>Order Summary</h3>
              <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '2rem', paddingRight: '0.5rem' }}>
                {items.length > 0 ? items.map(i => (
                  <div key={i.id} style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                    <img src={i.image} style={{ width: '40px', height: '54px', objectFit: 'cover', borderRadius: '4px' }} alt="" />
                    <div style={{ flex: 1 }}>
                      <p style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 500 }}>{i.name}</p>
                      <p style={{ color: '#666', fontSize: '0.75rem' }}>Qty: {i.qty}</p>
                    </div>
                    <span style={{ color: '#fff', fontSize: '0.85rem' }}>₹{i.price * i.qty}</span>
                  </div>
                )) : retryOrderId ? (
                  <div style={{ padding: '1rem', background: '#111', borderRadius: '0.5rem', textAlign: 'center', color: '#888', fontSize: '0.85rem' }}>
                    Items for Order #{retryOrderId}
                  </div>
                ) : null}
              </div>
              
              <div style={{ borderTop: '1px solid #222', paddingTop: '1.5rem', display: 'grid', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#888', fontSize: '0.9rem' }}>
                  <span>Tax (GST)</span>
                  <span>₹{retryOrderId ? (retryTotal - retryTotal / 1.18).toFixed(2) : tax}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#D4A843', fontSize: '1.25rem', fontWeight: 800, marginTop: '1rem' }}>
                  <span>Total</span>
                  <span>₹{finalTotal}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Module_Process;
