// Content script for SweetDill price comparison extension

class SweetDillContent {
    constructor() {
        this.initialize();
    }

    initialize() {
        // Inject sidebar HTML
        this.injectSidebar();
        
        // Initialize sidebar state
        this.sidebar = document.querySelector('.sweetdill-sidebar');
        this.toggle = document.querySelector('.sweetdill-toggle');
        this.closeButton = document.querySelector('.sweetdill-close-button');
        
        // Add event listeners
        this.toggle.addEventListener('click', () => this.toggleSidebar());
        this.closeButton.addEventListener('click', () => this.closeSidebar());
        
        // Listen for messages from the background script
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === 'getProductInfo') {
                this.getProductInfo().then(sendResponse);
                return true; // Required for async response
            }
        });

        // Initial check if we're on a product page
        this.checkProductPage();
    }

    injectSidebar() {
        // Create a container for the sidebar
        const container = document.createElement('div');
        container.id = 'sweetdill-container';
        
        // Load the sidebar HTML
        fetch(chrome.runtime.getURL('content/sidebar.html'))
            .then(response => response.text())
            .then(html => {
                container.innerHTML = html;
                document.body.appendChild(container);
            })
            .catch(error => console.error('SweetDill: Error loading sidebar:', error));
    }

    toggleSidebar() {
        this.sidebar.classList.toggle('open');
    }

    closeSidebar() {
        this.sidebar.classList.remove('open');
    }

    async getProductInfo() {
        try {
            const productData = {
                name: this.getProductName(),
                currentPrice: this.getCurrentPrice(),
                retailer: this.getRetailer(),
                productId: this.getProductId(),
                imageUrl: this.getProductImage(),
                url: window.location.href
            };

            // Log the extracted data for debugging
            console.log('SweetDill: Extracted product data:', productData);

            // Update the sidebar with the product information
            this.updateSidebar(productData);

            return {
                success: true,
                data: productData
            };
        } catch (error) {
            console.error('SweetDill: Error getting product info:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    updateSidebar(data) {
        // Update product image
        const productImage = document.getElementById('product-image');
        if (data.imageUrl && productImage) {
            productImage.src = data.imageUrl;
            productImage.onerror = () => {
                productImage.src = chrome.runtime.getURL('assets/icon128.png');
            };
        }

        // Update product name
        const productName = document.getElementById('product-name');
        if (data.name && productName) {
            productName.textContent = data.name;
        }

        // Update product ID
        const productId = document.getElementById('product-id');
        if (data.productId && productId) {
            productId.textContent = `ID: ${data.productId}`;
        }

        // Update current price
        const currentPrice = document.getElementById('current-price-value');
        if (data.currentPrice && currentPrice) {
            currentPrice.textContent = this.formatPrice(data.currentPrice);
        }
    }

    getProductName() {
        // Try multiple selectors for product name
        const selectors = [
            'h1[data-testid="product-name"]',
            'h1[class*="product-name"]',
            'h1[class*="ProductName"]',
            'h1[class*="product-title"]',
            'h1[class*="ProductTitle"]'
        ];

        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                return element.textContent.trim();
            }
        }

        // Fallback: Look for any h1 that might contain the product name
        const h1Elements = document.querySelectorAll('h1');
        for (const h1 of h1Elements) {
            if (h1.textContent.trim() && !h1.textContent.includes('Instacart')) {
                return h1.textContent.trim();
            }
        }

        return null;
    }

    getCurrentPrice() {
        // Try multiple selectors for price
        const selectors = [
            '[data-testid="product-price"]',
            '[class*="product-price"]',
            '[class*="ProductPrice"]',
            '[class*="price-value"]',
            '[class*="PriceValue"]'
        ];

        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                const priceText = element.textContent.trim();
                return this.parsePrice(priceText);
            }
        }

        // Fallback: Look for price patterns in the page
        const pricePattern = /\$?\d+\.\d{2}/;
        const elements = document.querySelectorAll('*');
        for (const element of elements) {
            if (element.textContent.match(pricePattern)) {
                return this.parsePrice(element.textContent);
            }
        }

        return null;
    }

    getRetailer() {
        // Try multiple selectors for retailer name
        const selectors = [
            '[data-testid="retailer-name"]',
            '[class*="retailer-name"]',
            '[class*="RetailerName"]',
            '[class*="store-name"]',
            '[class*="StoreName"]'
        ];

        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                return element.textContent.trim();
            }
        }

        // Fallback: Look for retailer name in the URL
        const url = window.location.href;
        const retailerMatch = url.match(/\/stores\/([^\/]+)/);
        if (retailerMatch) {
            return retailerMatch[1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        }

        return null;
    }

    getProductId() {
        // Try to get product ID from URL
        const url = window.location.href;
        const urlMatch = url.match(/\/products\/(\d+)/);
        if (urlMatch) {
            return urlMatch[1];
        }

        // Try to find product ID in page data
        const scripts = document.querySelectorAll('script[type="application/json"]');
        for (const script of scripts) {
            try {
                const data = JSON.parse(script.textContent);
                if (data.productId || data.id) {
                    return data.productId || data.id;
                }
            } catch (e) {
                continue;
            }
        }

        // Fallback: Look for product ID in meta tags
        const metaTags = document.querySelectorAll('meta[property*="product"]');
        for (const meta of metaTags) {
            const content = meta.getAttribute('content');
            if (content && content.match(/\d+/)) {
                return content.match(/\d+/)[0];
            }
        }

        return null;
    }

    getProductImage() {
        // Try multiple selectors for product image
        const selectors = [
            'img[data-testid="product-image"]',
            'img[class*="product-image"]',
            'img[class*="ProductImage"]',
            'img[class*="product-photo"]',
            'img[class*="ProductPhoto"]'
        ];

        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                return element.src;
            }
        }

        // Fallback: Look for the first product image in the page
        const images = document.querySelectorAll('img');
        for (const img of images) {
            if (img.src && 
                img.src.includes('instacart') && 
                !img.src.includes('logo') && 
                !img.src.includes('icon')) {
                return img.src;
            }
        }

        return null;
    }

    parsePrice(priceText) {
        // Remove currency symbol and convert to number
        const cleanPrice = priceText.replace(/[^0-9.]/g, '');
        const price = parseFloat(cleanPrice);
        return isNaN(price) ? null : price;
    }

    formatPrice(price) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(price);
    }

    checkProductPage() {
        // Check if we're on a product page
        if (this.getProductId()) {
            // Notify background script that we're on a product page
            chrome.runtime.sendMessage({
                action: 'productPageDetected',
                productId: this.getProductId()
            });
        }
    }
}

// Initialize the content script
new SweetDillContent(); 