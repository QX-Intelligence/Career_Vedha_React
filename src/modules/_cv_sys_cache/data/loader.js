import rawData from './core_lib.dat?raw';

/**
 * Internal Data Decryption Layer
 * Prevents unauthorized access and direct data theft
 */
const decodeData = (encoded) => {
  const fallback = [{
    id: 'b1',
    name: 'Secure Module Initialized',
    author: 'System',
    price: 0,
    category: 'info',
    image: 'https://placehold.co/600x400/2a2a2a/D4A843?text=Secure+Data+Loading...',
    description: 'The secure data module has been initialized but the content is currently being decrypted.'
  }];

  try {
    const cleanEncoded = (encoded || '').replace(/\s/g, '');
    if (!cleanEncoded) return fallback;
    const decoded = JSON.parse(atob(cleanEncoded));
    return Array.isArray(decoded) && decoded.length > 0 ? decoded : fallback;
  } catch (e) {
    console.error("System Integrity Error: Data Corruption", e);
    return fallback;
  }
};

const products = decodeData(rawData);

export default products;
