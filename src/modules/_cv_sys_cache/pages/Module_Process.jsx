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

  const [pollingStatus, setPollingStatus] = useState("");
  const [purchasedEbooks, setPurchasedEbooks] = useState([]);
  const [retryTotal, setRetryTotal] = useState(null);

  const subTotal = summary.subTotal || 0;
  const tax = summary.gstAmount || 0;
  const grandTotal = summary.totalAmount || 0;

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  // Recover state from URL or sessionStorage (handles retry + page refresh)
  useEffect(() => {
    const urlOrderId = searchParams.get('orderId');
    const storedOrderId = sessionStorage.getItem("currentOrderId");
    const activeId = urlOrderId || storedOrderId;

    // Recover retry total from URL or sessionStorage
    const urlTotal = searchParams.get('total');
    const storedTotal = sessionStorage.getItem("retryTotal");
    const total = urlTotal || storedTotal;

    if (total) {
      setRetryTotal(Number(total));
      if (!storedTotal) sessionStorage.setItem("retryTotal", total);
    }

    if (activeId) {
      setOrderId(Number(activeId));
      if (!storedOrderId) sessionStorage.setItem("currentOrderId", activeId);
      
      // Only auto-jump to step 2 if we are explicitly retrying an old order.
      // For normal cart checkouts, we want the user to land on Step 1 to acknowledge the current flow.
      if (urlOrderId || searchParams.get('isRetry') === 'true') {
        setStep(2);
      }
    }
  }, [searchParams]);

  // isRetryFlow is ONLY for intentional retries from Order History.
  // Resuming a cart-based checkout should NOT be treated as a retry flow, 
  // as it must verify the current cart state.
  const isRetryFlow = searchParams.get('isRetry') === 'true';
  const finalTotal = retryTotal || grandTotal;

  // Poll by attempting /payment/create/{id}
  // Backend's createRazorPayOrder only succeeds when status is INVENTORY_RESERVED.
  // /orders/my/orders does NOT return PENDING/INVENTORY_RESERVED orders, so we can't poll status directly.
  const pollForPaymentCreation = async (activeId) => {
    const MAX_ATTEMPTS = 30; // 60 seconds total (30 * 2s)
    let notReadyCount = 0;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      setPollingStatus(`Confirming reservation... (${attempt + 1}/${MAX_ATTEMPTS})`);
      await new Promise(resolve => setTimeout(resolve, 2000));

      try {
        const paymentRes = await inventoryApi.post(`/payment/create/${activeId}`, {}, { timeout: 60000 });
        // Success — backend confirmed INVENTORY_RESERVED + Razorpay order created
        return paymentRes.data;
      } catch (pollError) {
        const errMsg = pollError.response?.data?.message || pollError.response?.data || '';
        const errStr = typeof errMsg === 'string' ? errMsg : '';

        // Terminal errors — stop immediately
        if (errStr.toLowerCase().includes('expired')) {
          throw new Error("Payment time expired. Please try again.");
        }
        if (errStr.toLowerCase().includes('failed')) {
          throw new Error("Inventory reservation failed. Items may be out of stock.");
        }

        // If order is in a permanent bad state (REPLACED, etc.), stop early
        if (errStr.includes('not ready') || errStr.includes('cannot')) {
          notReadyCount++;
          if (notReadyCount >= 10) {
            throw new Error("Order is not in a valid state for payment. Please go back and try again.");
          }
        }
      }
    }
    throw new Error("Inventory reservation timed out. Please check your orders and try again.");
  };

  const handlePlaceOrder = async () => {
    const { isAuthenticated } = getUserContext();
    if (!isAuthenticated) {
      showSnackbar("Your session has expired. Please login again.", "error");
      return;
    }

    if (isProcessing) return; // Guard against double-clicks
    setIsProcessing(true);

    try {
      if (isRetryFlow && orderId) {
        await processRetryFlow(orderId);
      } else {
        await processNormalFlow();
      }
    } catch (e) {
      console.error("Checkout process failed", e);
      const errorMsg = e.response?.data?.message || e.response?.data || e.message || "Checkout failed";
      showSnackbar(`Checkout Error: ${errorMsg}`, "error");
    } finally {
      setIsProcessing(false);
      setPollingStatus("");
    }
  };

  const processNormalFlow = async () => {
    if (items.length === 0) {
      showSnackbar("Your cart is empty.", "warning");
      return;
    }

    // 1. Create Order (PENDING → Kafka → INVENTORY_RESERVED)
    setPollingStatus("Creating your order...");
    const orderRes = await inventoryApi.post('/orders/checkout');
    const newId = Number(orderRes.data);
    setOrderId(newId);
    sessionStorage.setItem("currentOrderId", newId);

    // 2. Poll + Pay
    await openPayment(newId);
  };

  const processRetryFlow = async (activeId) => {
    // Retry: Order already created by /payment/retry, just poll + pay
    await openPayment(activeId);
  };

  const openPayment = async (activeId) => {
    // 1. Poll /payment/create until INVENTORY_RESERVED (returns razorpayOrderId on success)
    const razorpayOrderId = await pollForPaymentCreation(activeId);

    // 2. Load Razorpay SDK if not already loaded
    if (!window.Razorpay) {
      setPollingStatus("Loading payment gateway...");
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = resolve;
        script.onerror = () => reject(new Error('Failed to load Razorpay SDK.'));
        document.head.appendChild(script);
      });
    }

    // 3. Open Razorpay Checkout
    setPollingStatus("");
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY || "rzp_test_SOEla7YCEkhR7j",
      amount: Math.round(finalTotal * 100),
      currency: "INR",
      name: "Career Vedha Store",
      description: `Order #${activeId}`,
      order_id: razorpayOrderId,
      handler: async (response) => {
        setPollingStatus("Verifying payment...");
        try {
          await inventoryApi.post('/payment/verify', {
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature
          });

          // SUCCESS — clean up and show confirmation
          const ebooks = items.filter(i => i.category === 'EBOOK').map(i => i.id);
          setPurchasedEbooks(ebooks);
          setComplete(true);
          clear();
          sessionStorage.removeItem("currentOrderId");
          sessionStorage.removeItem("retryTotal");
          showSnackbar("Payment successful! 🎉", "success");
        } catch (verifyError) {
          console.error("Payment Verification Error:", verifyError);
          // FALLBACK: Webhook will eventually mark it PAID
          showSnackbar("Payment received. Confirming status…", "info");
          setPollingStatus("Status sync in progress...");

          // Mark as complete after delay — webhook handles final status
          setTimeout(() => {
            setComplete(true);
            clear();
            sessionStorage.removeItem("currentOrderId");
            sessionStorage.removeItem("retryTotal");
          }, 3000);
        }
      },
      theme: { color: "#62269e" },
      modal: {
        ondismiss: () => {
          // Silent — user knows they closed it
        }
      }
    };

    const rzp1 = new window.Razorpay(options);
    rzp1.on('payment.failed', (response) => {
      console.error("Razorpay payment failed:", response.error);
      // Terminal failure — clean session
      sessionStorage.removeItem("currentOrderId");
      sessionStorage.removeItem("retryTotal");
    });
    rzp1.open();
  };

  if (items.length === 0 && !complete && !isRetryFlow) return (
    <div style={{ padding: '12rem 1.5rem', textAlign: 'center', color: '#445566', background: '#f8fafc', minHeight: '100vh' }}>
      <h2 style={{ color: '#0F172A', marginBottom: '1rem', fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}>Your cart is empty</h2>
      <Link to="/e-store/shop" style={{ color: '#62269e', fontWeight: 600 }}>Return to Shop</Link>
    </div>
  );

  if (complete) return (
    <div style={{ padding: '10rem 1.5rem', textAlign: 'center', background: '#f8fafc', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} style={{ background: '#FFFFFF', padding: '4rem', borderRadius: '2rem', border: '1px solid rgba(98, 38, 158, 0.2)', maxWidth: '500px', boxShadow: '0 20px 50px rgba(0,0,0,0.06)' }}>
        <div style={{ width: '80px', height: '80px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem', color: '#10b981' }}>
          <CheckCircle2 size={48} />
        </div>
        <h1 style={{ fontFamily: "'Outfit', sans-serif", color: '#0F172A', fontSize: '2.5rem', marginBottom: '1rem', fontWeight: 800 }}>Order Placed!</h1>
        <p style={{ color: '#64748B', marginBottom: '2rem', lineHeight: 1.6 }}>Your order has been confirmed. Order ID: #{orderId}</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {purchasedEbooks.length > 0 && (
            <Link
              to="/e-store/library"
              state={{ highlightId: purchasedEbooks[0] }}
              style={{ padding: '1rem 2.5rem', background: '#62269e', color: '#0F172A', fontWeight: 800, borderRadius: '100px', textDecoration: 'none', display: 'inline-block' }}
            >
              Go to My Library
            </Link>
          )}
          <Link to="/e-store" style={{ padding: '1rem 2.5rem', background: purchasedEbooks.length > 0 ? '#f1f5f9' : '#62269e', color: purchasedEbooks.length > 0 ? '#62269e' : '#ffffff', fontWeight: 800, borderRadius: '100px', textDecoration: 'none', display: 'inline-block', border: purchasedEbooks.length > 0 ? '1px solid #e2e8f0' : 'none' }}>
            Back to Store
          </Link>
        </div>
      </Motion.div>
    </div>
  );

  return (
    <div style={{ paddingTop: '8rem', paddingBottom: '8rem', background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem' }}>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4rem', gap: '4rem' }}>
          {[1, 2].map(s => (
            <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', opacity: step >= s ? 1 : 0.3 }}>
              <div style={{ width: '40px', height: '40px', background: step >= s ? '#62269e' : '#FFFFFF', color: step >= s ? '#ffffff' : '#475569', borderRadius: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, border: '2px solid', borderColor: step >= s ? '#62269e' : '#e2e8f0' }}>
                {s < step ? <CheckCircle2 size={18} /> : s}
              </div>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: step >= s ? '#62269e' : '#94a3b8' }}>
                {s === 1 ? 'Payment' : 'Review & Pay'}
              </span>
            </div>
          ))}
        </div>

        <div className="store-process-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '4rem', alignItems: 'start' }}>
          <div style={{ background: '#FFFFFF', padding: '3rem', borderRadius: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <AnimatePresence mode="wait">
              {step === 1 && (
                <Motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                  <h2 style={{ fontFamily: "'Outfit', sans-serif", color: '#0F172A', fontSize: '2rem', marginBottom: '2rem', fontWeight: 700 }}>Payment</h2>
                  <div style={{ display: 'grid', gap: '1.5rem' }}>
                    <div style={{ padding: '1.5rem', border: '2px solid #62269e', borderRadius: '1rem', background: 'rgba(98, 38, 158, 0.05)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '20px', height: '20px', borderRadius: '100px', border: '6px solid #62269e' }} />
                      <div>
                        <p style={{ color: '#0F172A', fontWeight: 600 }}>Secured Checkout</p>
                        <p style={{ color: '#94A3B8', fontSize: '0.8rem' }}>Payment via Razorpay</p>
                      </div>
                    </div>
                    <p style={{ color: '#64748B', fontSize: '0.85rem', lineHeight: 1.6 }}>
                      Your ebooks will be available instantly in your library after successful payment.
                    </p>
                    <button onClick={nextStep} style={{ marginTop: '1rem', width: '100%', padding: '1.25rem', background: '#62269e', color: '#ffffff', fontWeight: 800, borderRadius: '0.75rem', border: 'none', cursor: 'pointer' }}>Review Order</button>
                  </div>
                </Motion.div>
              )}

              {step === 2 && (
                <Motion.div key="step2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                  <h2 style={{ fontFamily: "'Outfit', sans-serif", color: '#0F172A', fontSize: '2rem', marginBottom: '2rem', fontWeight: 700 }}>Review & Pay</h2>
                  <div style={{ background: '#f8fafc', padding: '2rem', borderRadius: '1rem', border: '1px solid #e2e8f0', marginBottom: '2rem' }}>
                    <div style={{ marginBottom: '1.5rem' }}>
                      <h4 style={{ color: '#62269e', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>
                        Order Details
                      </h4>
                      {isRetryFlow ? (
                        <p style={{ color: '#0F172A' }}>Retrying Payment for Order #{orderId}</p>
                      ) : (
                        <p style={{ color: '#64748B', fontSize: '0.9rem' }}>Digital delivery — your ebooks will appear in My Library immediately after payment.</p>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '2rem' }}>
                    {!isRetryFlow && (
                      <button onClick={prevStep} style={{ flex: 1, padding: '1rem', background: 'none', color: '#94A3B8', fontWeight: 600, border: 'none' }}>Back</button>
                    )}
                    <button
                      onClick={handlePlaceOrder}
                      disabled={isProcessing}
                      style={{ flex: 2, padding: '1.25rem', background: '#62269e', color: '#ffffff', fontWeight: 800, borderRadius: '0.75rem', border: 'none', cursor: isProcessing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', flexDirection: 'column' }}
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
            <div style={{ background: '#FFFFFF', padding: '2.5rem', borderRadius: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0,0,0,0.04)' }}>
              <h3 style={{ color: '#0F172A', fontSize: '1.25rem', marginBottom: '1.5rem' }}>Order Summary</h3>
              <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '2rem', paddingRight: '0.5rem' }}>
                {items.length > 0 ? items.map(i => (
                  <div key={i.id} style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                    <img src={i.image} style={{ width: '40px', height: '54px', objectFit: 'cover', borderRadius: '4px' }} alt="" />
                    <div style={{ flex: 1 }}>
                      <p style={{ color: '#0F172A', fontSize: '0.85rem', fontWeight: 500 }}>{i.name}</p>
                      <p style={{ color: '#94A3B8', fontSize: '0.75rem' }}>Qty: {i.qty}</p>
                    </div>
                    <span style={{ color: '#0F172A', fontSize: '0.85rem' }}>₹{i.price * i.qty}</span>
                  </div>
                )) : isRetryFlow ? (
                  <div style={{ padding: '1rem', background: '#FDFBF7', borderRadius: '0.5rem', textAlign: 'center', color: '#64748B', fontSize: '0.85rem' }}>
                    Items for Order #{orderId}
                  </div>
                ) : null}
              </div>

              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem', display: 'grid', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B', fontSize: '0.9rem' }}>
                  <span>Tax (GST)</span>
                  <span>₹{isRetryFlow ? (retryTotal - retryTotal / 1.18).toFixed(2) : tax}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#62269e', fontSize: '1.25rem', fontWeight: 800, marginTop: '1rem' }}>
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