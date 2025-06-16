// Background script for SweetDill price comparison extension

class SweetDillBackground {
    constructor() {
        this.initialize();
    }

    initialize() {
        // Listen for messages from content script and popup
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            switch (request.action) {
                case 'productPageDetected':
                    this.handleProductPageDetected(request.productId);
                    break;
                case 'getPriceHistory':
                    this.getPriceHistory(request.productId).then(sendResponse);
                    return true; // Required for async response
                case 'getPriceComparison':
                    this.getPriceComparison(request.productId).then(sendResponse);
                    return true; // Required for async response
            }
        });
    }

    async handleProductPageDetected(productId) {
        // When a product page is detected, fetch and cache the price data
        try {
            const priceData = await this.fetchPriceData(productId);
            await this.cachePriceData(productId, priceData);
        } catch (error) {
            console.error('SweetDill: Error handling product page:', error);
        }
    }

    async fetchPriceData(productId) {
        // TODO: Implement API call to fetch price data
        // This will be implemented when we have the backend API ready
        return {
            currentPrice: null,
            cheapestPrice: null,
            averagePrice: null,
            priceHistory: []
        };
    }

    async cachePriceData(productId, priceData) {
        // Store price data in chrome.storage
        try {
            await chrome.storage.local.set({
                [`price_${productId}`]: {
                    data: priceData,
                    timestamp: Date.now()
                }
            });
        } catch (error) {
            console.error('SweetDill: Error caching price data:', error);
        }
    }

    async getPriceHistory(productId) {
        try {
            // First check cache
            const cached = await this.getCachedPriceData(productId);
            if (cached) {
                return {
                    success: true,
                    data: cached.priceHistory
                };
            }

            // If not in cache, fetch new data
            const priceData = await this.fetchPriceData(productId);
            await this.cachePriceData(productId, priceData);
            
            return {
                success: true,
                data: priceData.priceHistory
            };
        } catch (error) {
            console.error('SweetDill: Error getting price history:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getPriceComparison(productId) {
        try {
            // First check cache
            const cached = await this.getCachedPriceData(productId);
            if (cached) {
                return {
                    success: true,
                    data: {
                        currentPrice: cached.currentPrice,
                        cheapestPrice: cached.cheapestPrice,
                        averagePrice: cached.averagePrice
                    }
                };
            }

            // If not in cache, fetch new data
            const priceData = await this.fetchPriceData(productId);
            await this.cachePriceData(productId, priceData);
            
            return {
                success: true,
                data: {
                    currentPrice: priceData.currentPrice,
                    cheapestPrice: priceData.cheapestPrice,
                    averagePrice: priceData.averagePrice
                }
            };
        } catch (error) {
            console.error('SweetDill: Error getting price comparison:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getCachedPriceData(productId) {
        try {
            const result = await chrome.storage.local.get(`price_${productId}`);
            const cached = result[`price_${productId}`];
            
            if (!cached) return null;

            // Check if cache is still valid (less than 1 hour old)
            const cacheAge = Date.now() - cached.timestamp;
            if (cacheAge > 3600000) { // 1 hour in milliseconds
                return null;
            }

            return cached.data;
        } catch (error) {
            console.error('SweetDill: Error getting cached price data:', error);
            return null;
        }
    }
}

// Initialize the background script
new SweetDillBackground(); 