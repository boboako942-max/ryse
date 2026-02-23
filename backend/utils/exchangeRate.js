const axios = require('axios');

// Cache for exchange rates (5 minutes TTL)
let exchangeRateCache = {
  rate: null,
  timestamp: null,
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
};

/**
 * Fetch real-time USD to PHP exchange rate
 * Uses multiple APIs with fallback options
 */
const fetchExchangeRate = async () => {
  try {
    // Check cache first
    if (exchangeRateCache.rate && Date.now() - exchangeRateCache.timestamp < exchangeRateCache.CACHE_DURATION) {
      console.log('Using cached exchange rate:', exchangeRateCache.rate);
      return {
        rate: exchangeRateCache.rate,
        source: 'cache',
        timestamp: exchangeRateCache.timestamp,
      };
    }

    // Try primary API (exchangerate-api.com)
    try {
      const response = await axios.get(
        'https://api.exchangerate-api.com/v4/latest/USD',
        { timeout: 5000 }
      );
      const rate = response.data.rates.PHP;
      
      // Cache the rate
      exchangeRateCache.rate = rate;
      exchangeRateCache.timestamp = Date.now();

      console.log('Fetched exchange rate from exchangerate-api:', rate);
      return {
        rate,
        source: 'api',
        timestamp: Date.now(),
      };
    } catch (error) {
      console.warn('Primary API failed, trying fallback');
      
      // Try fallback API (open-exchange-rates)
      const response = await axios.get(
        `https://openexchangerates.org/api/latest.json?app_id=${process.env.OPENEXCHANGE_APP_ID || 'test'}&symbols=PHP`,
        { timeout: 5000 }
      );
      const rate = response.data.rates.PHP;

      exchangeRateCache.rate = rate;
      exchangeRateCache.timestamp = Date.now();

      console.log('Fetched exchange rate from openexchangerates API:', rate);
      return {
        rate,
        source: 'api',
        timestamp: Date.now(),
      };
    }
  } catch (error) {
    console.error('Exchange rate fetch failed, using default rate:', error.message);
    
    // Fallback to default rate if API fails
    const defaultRate = 56.5; // Default USD to PHP rate
    exchangeRateCache.rate = defaultRate;
    exchangeRateCache.timestamp = Date.now();

    return {
      rate: defaultRate,
      source: 'default',
      timestamp: Date.now(),
    };
  }
};

/**
 * Convert USD to PHP with proper decimal handling
 */
const convertUSDtoPHP = (usdAmount, exchangeRate) => {
  if (!usdAmount || !exchangeRate) {
    throw new Error('USD amount and exchange rate are required');
  }

  // Use decimal-like calculation to avoid floating point errors
  const phpAmount = parseFloat((usdAmount * exchangeRate).toFixed(2));
  return phpAmount;
};

/**
 * Convert PHP to USD with proper decimal handling
 */
const convertPHPtoUSD = (phpAmount, exchangeRate) => {
  if (!phpAmount || !exchangeRate) {
    throw new Error('PHP amount and exchange rate are required');
  }

  const usdAmount = parseFloat((phpAmount / exchangeRate).toFixed(2));
  return usdAmount;
};

/**
 * Clear exchange rate cache (for manual refresh)
 */
const clearExchangeRateCache = () => {
  exchangeRateCache.rate = null;
  exchangeRateCache.timestamp = null;
  console.log('Exchange rate cache cleared');
};

module.exports = {
  fetchExchangeRate,
  convertUSDtoPHP,
  convertPHPtoUSD,
  clearExchangeRateCache,
};
