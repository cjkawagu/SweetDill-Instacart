// Content script for SweetDill price comparison extension

class SweetDillContent {
    constructor() {
        this.initialize();
    }

    async initialize() {
        // Create and inject the sidebar immediately
        this.createSidebar();
        
        // Initialize sidebar state
        this.sidebar = document.querySelector('.sweetdill-sidebar');
        this.toggle = document.querySelector('.sweetdill-toggle');
        this.closeButton = document.querySelector('.sweetdill-close-button');
        this.toggleText = document.getElementById('sweetdill-toggle-text-id');
        
        // Add event listeners
        if (this.toggle) {
            this.toggle.addEventListener('click', () => this.toggleSidebar());
        }
        if (this.closeButton) {
            this.closeButton.addEventListener('click', () => this.closeSidebar());
        }

        // Initial check if we're on a product page
        this.checkProductPage();
    }

    createSidebar() {
        // Create container if it doesn't exist
        let container = document.getElementById('sweetdill-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'sweetdill-container';
            document.body.appendChild(container);
        }

        // Set the sidebar HTML
        container.innerHTML = `
            <div class="sweetdill-sidebar">
                <div class="sweetdill-sidebar-header">
                    <div class="header-icons-left">
                        <div id="sweetdill-settings-icon" class="header-icon" title="Settings">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 15.5C13.93 15.5 15.5 13.93 15.5 12C15.5 10.07 13.93 8.5 12 8.5C10.07 8.5 8.5 10.07 8.5 12C8.5 13.93 10.07 15.5 12 15.5ZM19.43 12.97C19.47 12.65 19.5 12.33 19.5 12C19.5 11.67 19.47 11.35 19.43 11.03L21.54 9.46C21.73 9.31 21.78 9.06 21.64 8.87L19.5 5.13C19.36 4.93 19.1 4.88 18.91 5.03L16.48 6.94C16.09 6.64 15.65 6.38 15.19 6.18L14.71 3.59C14.65 3.34 14.43 3.16 14.18 3.16H9.82C9.57 3.16 9.35 3.34 9.29 3.59L8.81 6.18C8.35 6.38 7.91 6.64 7.52 6.94L5.09 5.03C4.9 4.88 4.64 4.93 4.5 5.13L2.36 8.87C2.22 9.06 2.27 9.31 2.46 9.46L4.57 11.03C4.53 11.35 4.5 11.67 4.5 12C4.5 12.33 4.53 12.65 4.57 12.97L2.46 14.54C2.27 14.69 2.22 14.94 2.36 15.13L4.5 18.87C4.64 19.07 4.9 19.12 5.09 18.97L7.52 17.06C7.91 17.36 8.35 17.62 8.81 17.82L9.29 20.41C9.35 20.66 9.57 20.84 9.82 20.84H14.18C14.43 20.84 14.65 20.66 14.71 20.41L15.19 17.82C15.65 17.62 16.09 17.36 16.48 17.06L18.91 18.97C19.1 19.12 19.36 19.07 19.5 18.87L21.64 15.13C21.78 14.94 21.73 14.69 21.54 14.54L19.43 12.97Z" fill="currentColor"/>
                            </svg>
                        </div>
                    </div>
                    <h1 class="sweetdill-sidebar-title">SweetDill</h1>
                    <button class="sweetdill-close-button" title="Close sidebar">×</button>
                </div>
                <div class="sweetdill-sidebar-content">
                    <div id="product-info">
                        <div class="product-header-row">
                            <div class="product-image-container">
                                <img id="product-image" src="" alt="Product Image">
                            </div>
                            <div class="product-main-info">
                                <h2 id="product-name">Loading...</h2>
                                <div class="current-price-inline">
                                    <span id="current-price-value">Loading...</span>
                                </div>
                            </div>
                        </div>
                        <div class="price-comparison">
                            <h2>Price Comparison</h2>
                            <div id="price-comparison-content">
                                <div class="loading-spinner">Searching for prices...</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="sweetdill-toggle">
                <div class="sweetdill-toggle-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 18H21V16H3V18ZM3 13H21V11H3V13ZM3 6V8H21V6H3Z" fill="currentColor"/>
                    </svg>
                </div>
                <span id="sweetdill-toggle-text-id" class="sweetdill-toggle-text">Price Compare</span>
            </div>
        `;

        // Immediately try to get product information
        this.updateProductInfo();
    }

    toggleSidebar() {
        if (this.sidebar) {
            this.sidebar.classList.toggle('open');
            document.body.classList.toggle('sweetdill-sidebar-open');
        }
    }

    closeSidebar() {
        if (this.sidebar) {
            this.sidebar.classList.remove('open');
            document.body.classList.remove('sweetdill-sidebar-open');
        }
    }

    updateProductInfo() {
        // Get product information
        const productName = this.getProductName();
        const productSlug = this.getProductId();
        const productImage = this.getProductImage();
        const currentPrice = this.getCurrentPrice();

        // Update the sidebar with the product information
        const productNameElement = document.getElementById('product-name');
        const productImageElement = document.getElementById('product-image');
        const currentPriceElement = document.getElementById('current-price-value');

        if (productNameElement) productNameElement.textContent = productName || 'Product Name Not Found';
        if (productImageElement) {
            if (productImage) {
                // Create a new image object to preload and verify the image
                const img = new Image();
                img.onload = () => {
                    productImageElement.src = productImage;
                    productImageElement.style.maxWidth = '100%';
                    productImageElement.style.maxHeight = '100%';
                };
                img.onerror = () => {
                    productImageElement.src = chrome.runtime.getURL('assets/icon128.png');
                };
                img.src = productImage;
            } else {
                productImageElement.src = chrome.runtime.getURL('assets/icon128.png');
            }
        }
        if (currentPriceElement) {
            currentPriceElement.textContent = currentPrice ? this.formatPrice(currentPrice) : 'Price Not Found';
        }

        // Store current price for later comparison
        this.currentProductPrice = currentPrice;
    }

    getProductName() {
        const nameElement = document.querySelector('h1');
        return nameElement ? nameElement.textContent.trim() : null;
    }

    getProductId() {
        const url = window.location.href;
        const urlMatch = url.match(/\/products\/([^\/]+)/);
        return urlMatch ? urlMatch[1] : null;
    }

    getProductImage() {
        const images = document.querySelectorAll('img');
        for (const img of images) {
            if (img.src && 
                !img.src.includes('logo') && 
                !img.src.includes('icon') &&
                img.width > 100) {
                // Get the base image URL without size parameters
                let imageUrl = img.src;
                imageUrl = imageUrl.replace(/\/\d+x\d+\//, '/');
                imageUrl = imageUrl.replace(/\?.*$/, '');
                return imageUrl;
            }
        }
        return null;
    }

    getCurrentPrice() {
        // Try to find the price element with the specific class
        const priceElement = document.querySelector('span.e-0');
        
        if (priceElement) {
            const text = priceElement.textContent.trim();
            const price = this.parsePrice(text);
            if (price) {
                return price;
            }
        }

        // Fallback: Look for any span with a price
        const spans = document.querySelectorAll('span');
        for (const span of spans) {
            const text = span.textContent.trim();
            if (span.closest('.sweetdill-sidebar')) continue;
            
            if (text.match(/^\$?\d+\.\d{2}$/)) {
                const price = this.parsePrice(text);
                if (price) return price;
            }
        }

        return null;
    }

    parsePrice(priceText) {
        const cleanPrice = priceText.replace(/[^0-9.]/g, '');
        const price = parseFloat(cleanPrice);
        return (isNaN(price) || price <= 0) ? null : price;
    }

    formatPrice(price) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(price);
    }

    getDealRating(originalPrice, competitorPrice) {
        if (originalPrice === null || competitorPrice === null) {
            return { dealType: 'Unknown', colorClass: 'unknown', emoji: '❓' };
        }

        const percentageDifference = ((originalPrice - competitorPrice) / originalPrice) * 100;

        if (percentageDifference >= 20) {
            return { dealType: 'Sweet', colorClass: 'sweet', emoji: '🍯' };
        } else if (percentageDifference > 0) { // Cheaper but less than 20%
            return { dealType: 'Meh', colorClass: 'meh', emoji: '😐' };
        } else {
            return { dealType: 'Sour', colorClass: 'sour', emoji: '🍋' };
        }
    }

    async checkProductPage() {
        const productSlug = this.getProductId();
        if (productSlug) {
            this.updateProductInfo();
            this.startPriceComparison();
        }
    }

    async startPriceComparison() {
        try {
            const comparisonContent = document.getElementById('price-comparison-content');
            if (comparisonContent) {
                comparisonContent.innerHTML = '<div class="loading-spinner">Searching for prices...</div>';
            }

            // Load sample data
            const response = await fetch(chrome.runtime.getURL('data/sample-prices.json'));
            const data = await response.json();
            
            // Get price results and coupons
            const priceResults = data.retailers.map(retailer => ({
                retailer: {
                    id: retailer.id,
                    name: retailer.name,
                    distance: retailer.distance
                },
                price: retailer.price,
                inStock: retailer.inStock
            }));

            // Filter coupons for the current product
            const coupons = data.coupons;
            
            this.updatePriceComparison(priceResults, coupons);
        } catch (error) {
            console.error('SweetDill: Error comparing prices:', error);
            this.showPriceComparisonError();
        }
    }

    updatePriceComparison(priceResults, coupons) {
        const comparisonContent = document.getElementById('price-comparison-content');
        if (!comparisonContent) return;

        const validResults = priceResults.filter(result => result.price !== null);
        validResults.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));

        // Determine if a cheaper deal is found
        let cheaperDealFound = false;
        if (this.currentProductPrice !== null && this.currentProductPrice !== undefined) {
            cheaperDealFound = validResults.some(result => parseFloat(result.price) < this.currentProductPrice);
        }

        // Update toggle button text
        if (this.toggleText) {
            this.toggleText.textContent = cheaperDealFound ? 'Deal Found!' : 'Price Compare';
        }

        if (validResults.length === 0) {
            comparisonContent.innerHTML = `
                <div class="error-message">
                    No price information available at this time.
                </div>
            `;
            if (this.toggleText) {
                this.toggleText.textContent = 'Price Compare';
            }
            return;
        }

        // Create HTML for price comparison
        const priceHtml = (visibleResults) => visibleResults.map(result => {
            const dealRating = this.getDealRating(this.currentProductPrice, result.price);
            return `
            <div class="retailer-price ${result.inStock ? 'in-stock' : 'out-of-stock'}">
                <div class="retailer-info">
                    <span class="retailer-name">${result.retailer.name}</span>
                    <span class="retailer-distance">${result.retailer.distance}</span>
                </div>
                <div class="price-info">
                    <span class="price">${this.formatPrice(result.price)}</span>
                    <span class="stock-status">${result.inStock ? 'In Stock' : 'Out of Stock'}</span>
                    <div class="deal-rating-box ${dealRating.colorClass}">
                        ${dealRating.emoji} ${dealRating.dealType} Deal
                    </div>
                    ${result.inStock ? `<div class="retailer-btn-row"><button class="view-button" data-retailer="${result.retailer.id}">View on Instacart</button></div>` : ''}
                </div>
            </div>
        `}).join('');

        const initialRetailerDisplayLimit = 3;
        const initialRetailers = validResults.slice(0, initialRetailerDisplayLimit);
        const moreRetailersExist = validResults.length > initialRetailerDisplayLimit;

        // Create HTML for coupons
        // Sort coupons: prioritize by lowest minimum purchase, then by earliest expiration
        const sortedCoupons = [...coupons].sort((a, b) => {
            if (a.minimumPurchase !== b.minimumPurchase) {
                return a.minimumPurchase - b.minimumPurchase;
            }
            return new Date(a.expires).getTime() - new Date(b.expires).getTime();
        });

        const initialCouponDisplayLimit = 3;
        const initialCoupons = sortedCoupons.slice(0, initialCouponDisplayLimit);
        const moreCouponsExist = sortedCoupons.length > initialCouponDisplayLimit;

        const couponHtml = (visibleCoupons) => visibleCoupons.length > 0 ? `
            <div class="coupons-section">
                <h2>Available Coupons</h2>
                ${visibleCoupons.map(coupon => `
                    <div class="coupon-card">
                        <div class="coupon-info">
                            <h3>${coupon.description}</h3>
                            <p class="coupon-summary">${coupon.aiSummary}</p>
                            <p class="coupon-details">
                                Min. purchase: ${this.formatPrice(coupon.minimumPurchase)} • 
                                Expires: ${new Date(coupon.expires).toLocaleDateString()}
                            </p>
                        </div>
                        <div class="coupon-code" data-code="${coupon.code}">
                            <span>${coupon.code}</span>
                            <button class="copy-button" title="Copy to clipboard">Copy</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        ` : '';

        // Combine both sections
        comparisonContent.innerHTML = `
            <div class="price-comparison-section">
                <h2>Price Comparison</h2>
                <div id="retailer-list">${priceHtml(initialRetailers)}</div>
                ${moreRetailersExist ? '<button id="show-all-retailers" class="show-all-button">Show All Retailers</button>' : ''}
            </div>
            <div id="coupon-list-container">${couponHtml(initialCoupons)}</div>
            ${moreCouponsExist ? '<button id="show-all-coupons" class="show-all-button">Show All Coupons</button>' : ''}
        `;

        // Add event listeners to view buttons
        const viewButtons = comparisonContent.querySelectorAll('.view-button');
        viewButtons.forEach(button => {
            button.addEventListener('click', () => {
                const retailerId = button.dataset.retailer;
                this.redirectToRetailer(retailerId);
            });
        });

        // Add event listeners to copy buttons
        const copyButtons = comparisonContent.querySelectorAll('.copy-button');
        copyButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const couponCode = e.target.closest('.coupon-code').dataset.code;
                navigator.clipboard.writeText(couponCode).then(() => {
                    button.textContent = 'Copied!';
                    setTimeout(() => {
                        button.textContent = 'Copy';
                    }, 2000);
                });
            });
        });

        // Add event listener for "Show All Retailers" button
        const showAllRetailersButton = document.getElementById('show-all-retailers');
        if (showAllRetailersButton) {
            showAllRetailersButton.addEventListener('click', () => {
                const retailerList = document.getElementById('retailer-list');
                if (retailerList) {
                    retailerList.innerHTML = priceHtml(validResults);
                    showAllRetailersButton.style.display = 'none'; // Hide button after expansion
                }
            });
        }

        // Add event listener for "Show All Coupons" button
        const showAllCouponsButton = document.getElementById('show-all-coupons');
        if (showAllCouponsButton) {
            showAllCouponsButton.addEventListener('click', () => {
                const couponListContainer = document.getElementById('coupon-list-container');
                if (couponListContainer) {
                    couponListContainer.innerHTML = couponHtml(sortedCoupons);
                    showAllCouponsButton.style.display = 'none'; // Hide button after expansion
                }
            });
        }
    }

    redirectToRetailer(retailerId) {
        const productSlug = this.getProductId();
        if (productSlug) {
            const url = `https://www.instacart.com/stores/${retailerId}/products/${productSlug}`;
            window.open(url, '_blank');
        }
    }

    showPriceComparisonError() {
        const comparisonContent = document.getElementById('price-comparison-content');
        if (comparisonContent) {
            comparisonContent.innerHTML = `
                <div class="error-message">
                    Unable to compare prices at this time. Please try again later.
                </div>
            `;
        }
        if (this.toggleText) {
            this.toggleText.textContent = 'Price Compare';
        }
    }
}

// Initialize the content script
new SweetDillContent(); 