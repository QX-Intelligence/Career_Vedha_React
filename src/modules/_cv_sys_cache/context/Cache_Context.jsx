import React, { createContext, useContext, useState, useEffect } from 'react';
import inventoryApi from '../api/inventoryApi';
import { getUserContext } from '../../../services/api';
import { useSnackbar } from '../../../context/SnackbarContext';

const CacheContext = createContext();

export const useCache = () => useContext(CacheContext);

export const CacheProvider = ({ children }) => {
  const { showSnackbar } = useSnackbar();
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({ totalAmount: 0, gstAmount: 0, subTotal: 0 });
  const [loading, setLoading] = useState(true);

  const fetchCart = async () => {
    try {
      const [cartRes, totalRes] = await Promise.all([
        inventoryApi.get('/cart'),
        inventoryApi.get('/cart/total')
      ]);
      
      const normalizedItems = cartRes.data.map(item => ({
        id: item.bookId,
        cartItemId: item.cartItemId,
        name: item.bookName,
        price: item.price,
        qty: item.quantity,
        image: item.coverPhotoUrl,
        category: item.languageCategory
      }));
      
      setItems(normalizedItems);
      setSummary(totalRes.data);
    } catch (e) {
      console.error("Cart Fetch Error", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const { isAuthenticated } = getUserContext();
    if (isAuthenticated) {
      fetchCart();
    } else {
      setLoading(false);
    }
  }, []);

  const WHATSAPP_NUMBER = '918790699260';

  const add = async (payload, qty = 1) => {
    const { isAuthenticated } = getUserContext();
    if (!isAuthenticated) {
      showSnackbar('Please login to add items to your cart', 'warning');
      window.location.href = '/e-store/login';
      return;
    }

    // Physical books are handled via WhatsApp — redirect instead of cart
    const category = (payload.category || payload.bookCategory || '').toUpperCase();
    if (category === 'PHYSICAL') {
      const bookId = payload.id || payload.bookId;
      const productUrl = bookId ? `${window.location.origin}/e-store/view/${bookId}` : '';
      const msg = encodeURIComponent(
        `Hi! I'm interested in buying the physical book *"${payload.name || payload.bookName}"* by ${payload.author || payload.bookAuthor} (₹${payload.price || payload.bookPrice}).${productUrl ? `\n\n🔗 Product Link: ${productUrl}` : ''}\n\nCould you please guide me on the purchase process?`
      );
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, '_blank');
      showSnackbar('Opening WhatsApp to place your physical book order!', 'info');
      return;
    }

    try {
      setLoading(true);
      // Backend expects bookId in path
      await inventoryApi.post(`/cart/${payload.id || payload.bookId}`);
      await fetchCart();
      showSnackbar('Added to cart', 'success');
    } catch (e) {
      console.error("Error adding to cart", e);
      showSnackbar('Failed to add to cart', 'error');
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id) => {
    const item = items.find(i => i.id === id);
    if (!item?.cartItemId) return;
    try {
      await inventoryApi.delete(`/cart/${item.cartItemId}`);
      await fetchCart();
    } catch (e) {
      console.error("Error removing from cart", e);
    }
  };

  const update = async (id, n) => {
    const item = items.find(i => i.id === id);
    if (!item?.cartItemId) return;
    
    try {
      const diff = n - item.qty;
      if (diff > 0) {
        for(let i=0; i<diff; i++) await inventoryApi.put(`/cart/increase/${item.cartItemId}`);
      } else if (diff < 0) {
        for(let i=0; i<Math.abs(diff); i++) await inventoryApi.put(`/cart/decrease/${item.cartItemId}`);
      }
      await fetchCart();
    } catch (e) {
      console.error("Error updating qty", e);
    }
  };

  const clear = () => {
    // Backend might not have a full clear, we'll remove items one by one or ignore for now
    // as the checkout usually handles it.
    setItems([]);
  };

  const total = summary.totalAmount;
  const count = items.reduce((acc, i) => acc + i.qty, 0);

  return (
    <CacheContext.Provider value={{ 
      items, 
      add, 
      remove, 
      update, 
      clear,
      total, 
      count,
      summary,
      loading,
      refresh: fetchCart
    }}>
      {children}
    </CacheContext.Provider>
  );
};
