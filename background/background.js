// Background script for SweetDill price comparison extension

class SweetDillBackground {
    constructor() {
        this.initialize();
    }

    initialize() {
        // Listen for messages from content script
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            console.log('SweetDill Background: Received message:', request.action);
            switch (request.action) {
                case 'getNearbyRetailers':
                    console.log('SweetDill Background: Getting nearby retailers for zipcode:', request.zipcode);
                    this.getNearbyRetailers(request.zipcode, sender).then(sendResponse);
                    return true;
                case 'searchProductPrices':
                    console.log('SweetDill Background: Searching product prices for:', request.productSlug);
                    this.searchProductPrices(request.productSlug, request.retailers, sender).then(sendResponse);
                    return true;
            }
        });
    }

    async getNearbyRetailers(zipcode, sender) {
        try {
            console.log('SweetDill Background: Executing script to get retailers...');
            // Execute content script to extract retailer information from the current page
            const results = await chrome.scripting.executeScript({
                target: { tabId: sender.tab.id },
                func: () => {
                    console.log('SweetDill Background Script: Getting current retailer info...');
                    // Get the current retailer info from the page
                    const currentRetailer = {
                        id: window.location.pathname.split('/')[2],
                        name: document.querySelector('[data-testid="store-name"]')?.textContent.trim(),
                        distance: 'Current Store'
                    };
                    console.log('SweetDill Background Script: Current retailer:', currentRetailer);

                    // Get other retailers from the store switcher
                    console.log('SweetDill Background Script: Getting store switcher...');
                    const storeSwitcher = document.querySelector('[data-testid="store-switcher"]');
                    console.log('SweetDill Background Script: Store switcher found:', !!storeSwitcher);
                    
                    const retailers = Array.from(storeSwitcher?.querySelectorAll('[data-testid="store-card"]') || [])
                        .map(store => {
                            const name = store.querySelector('[data-testid="store-name"]')?.textContent.trim();
                            const distance = store.querySelector('[data-testid="store-distance"]')?.textContent.trim();
                            const id = store.getAttribute('data-store-id') || 
                                     store.querySelector('a')?.href?.match(/\/stores\/([^\/]+)/)?.[1];
                            
                            return {
                                id,
                                name,
                                distance
                            };
                        })
                        .filter(retailer => retailer.id && retailer.name);

                    console.log('SweetDill Background Script: Found retailers:', retailers);
                    // Add current retailer to the list
                    return [currentRetailer, ...retailers].slice(0, 10);
                }
            });

            console.log('SweetDill Background: Got retailer results:', results[0].result);
            return {
                success: true,
                retailers: results[0].result
            };
        } catch (error) {
            console.error('SweetDill Background: Error getting nearby retailers:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async searchProductPrices(productSlug, retailers, sender) {
        try {
            console.log('SweetDill Background: Executing script to get product prices...');
            // Execute content script to extract price information from the current page
            const results = await chrome.scripting.executeScript({
                target: { tabId: sender.tab.id },
                func: (retailers) => {
                    console.log('SweetDill Background Script: Getting GTM data...');
                    // Get the current product data from GTM
                    const gtmData = window.dataLayer?.find(event => 
                        event.product_details_page?.page_view
                    )?.product_details_page?.page_view;
                    console.log('SweetDill Background Script: GTM data:', gtmData);

                    if (!gtmData) {
                        console.log('SweetDill Background Script: No GTM data found');
                        return retailers.map(retailer => ({
                            retailer,
                            price: null,
                            inStock: false
                        }));
                    }

                    // Extract current price and stock info
                    const currentPrice = parseFloat(gtmData.price?.replace(/[^0-9.]/g, ''));
                    const currentStock = gtmData.stock_level === 'highly_in_stock';
                    console.log('SweetDill Background Script: Current price:', currentPrice, 'Current stock:', currentStock);

                    // Map retailers to their prices
                    const results = retailers.map(retailer => {
                        // If this is the current retailer, use the current price
                        if (retailer.id === gtmData.retailer_id) {
                            return {
                                retailer,
                                price: currentPrice,
                                inStock: currentStock
                            };
                        }

                        // For other retailers, we'll need to make an API call
                        // This will be implemented in the next step
                        return {
                            retailer,
                            price: null,
                            inStock: false
                        };
                    });

                    console.log('SweetDill Background Script: Price results:', results);
                    return results;
                },
                args: [retailers]
            });

            console.log('SweetDill Background: Got price results:', results[0].result);
            return {
                success: true,
                results: results[0].result
            };
        } catch (error) {
            console.error('SweetDill Background: Error searching product prices:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// Initialize the background script
new SweetDillBackground(); 