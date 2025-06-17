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
            this.makeToggleDraggable();
        }
        if (this.closeButton) {
            this.closeButton.addEventListener('click', () => this.closeSidebar());
        }

        // Initial check if we're on a product page
        this.checkProductPage();
    }

    async makeToggleDraggable() {
        const toggleButton = this.toggle;
        if (!toggleButton) return;

        let isDragging = false;
        let startX, startY, initialLeft, initialTop;

        // Load saved position
        chrome.storage.sync.get(['sweetdillTogglePosition'], (result) => {
            if (result.sweetdillTogglePosition) {
                const { left, top } = result.sweetdillTogglePosition;
                toggleButton.style.left = `${left}px`;
                toggleButton.style.top = `${top}px`;
                toggleButton.style.right = 'auto'; // Disable right positioning
                toggleButton.style.bottom = 'auto'; // Disable bottom positioning
            } else {
                // Set initial position if not saved, and store it
                toggleButton.style.right = '20px';
                toggleButton.style.bottom = '20px';
                toggleButton.style.left = 'auto';
                toggleButton.style.top = 'auto';
                // Save the initial position once rendered
                setTimeout(() => {
                    chrome.storage.sync.set({
                        sweetdillTogglePosition: {
                            left: toggleButton.offsetLeft,
                            top: toggleButton.offsetTop
                        }
                    });
                }, 500); // Give some time for rendering
            }
        });

        toggleButton.addEventListener('mousedown', (e) => {
            // Only allow dragging with the left mouse button
            if (e.button !== 0) return;

            // Prevent sidebar from toggling when starting a drag
            e.stopPropagation();
            e.preventDefault(); // Prevent default drag behavior

            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            initialLeft = toggleButton.offsetLeft;
            initialTop = toggleButton.offsetTop;

            // Set cursor to 'grabbing' during drag
            toggleButton.style.cursor = 'grabbing';

            // Add a class to body to prevent text selection during drag
            document.body.classList.add('sweetdill-no-select');
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;

            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            let newLeft = initialLeft + dx;
            let newTop = initialTop + dy;

            // Keep button within viewport bounds
            newLeft = Math.max(0, Math.min(newLeft, window.innerWidth - toggleButton.offsetWidth));
            newTop = Math.max(0, Math.min(newTop, window.innerHeight - toggleButton.offsetHeight));

            toggleButton.style.left = `${newLeft}px`;
            toggleButton.style.top = `${newTop}px`;

            // Prevent text selection during drag
            e.preventDefault();
        });

        document.addEventListener('mouseup', () => {
            if (!isDragging) return;

            isDragging = false;
            // Save new position
            chrome.storage.sync.set({
                sweetdillTogglePosition: {
                    left: toggleButton.offsetLeft,
                    top: toggleButton.offsetTop
                }
            });

            // Reset cursor
            toggleButton.style.cursor = 'grab';

            // Remove no-select class
            document.body.classList.remove('sweetdill-no-select');
        });

        // Set initial cursor style
        toggleButton.style.cursor = 'grab';
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
                                    <span id="current-deal-indicator"></span>
                                </div>
                            </div>
                        </div>
                        <div class="price-comparison">
                            <div id="price-comparison-content">
                                <div class="loading-spinner">Searching for prices...</div>
                            </div>
                        </div>
                        <div class="unit-price-comparison">
                            <h2>Unit Price Comparison</h2>
                            <div id="unit-price-comparison-content">
                                <div class="loading-spinner">Calculating unit prices...</div>
                            </div>
                        </div>
                        <div class="price-history">
                            <h2>Price History</h2>
                            <div class="chart-container">
                                <canvas id="price-history-chart"></canvas>
                            </div>
                        </div>
                        <div id="coupon-list-container">
                            <div class="loading-spinner">Checking for coupons...</div>
                        </div>
                        <button id="toggle-coupons-button" class="show-all-button" style="display: none;">Show All Coupons</button>
                    </div>
                    <img src="${chrome.runtime.getURL('assets/sweet_mascot.png')}" alt="SweetDill Mascot" class="sweetdill-mascot-footer">
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
            currentPriceElement.textContent = this.formatPrice(currentPrice);
        }

        const currentDealIndicatorElement = document.getElementById('current-deal-indicator');
        if (currentDealIndicatorElement) {
            // Initial state, will be updated by updatePriceComparison
            currentDealIndicatorElement.className = 'deal-rating-box meh';
            currentDealIndicatorElement.innerHTML = '❓ Loading...';
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

    // Overall deal rating for the current Instacart product
    getOverallDealRating(currentInstacartPrice, cheapestOverallPrice, averageOverallPrice) {
        if (currentInstacartPrice === null || cheapestOverallPrice === null || averageOverallPrice === null) {
            return { dealType: 'Unknown', colorClass: 'unknown', emoji: '❓' };
        }

        const SWEET_THRESHOLD_PERCENT_FROM_CHEAPEST = 0.05; // within 5% of cheapest
        const MEH_THRESHOLD_PERCENT_DEVIATION_FROM_AVERAGE = 0.15; // within 15% of average

        // Sweet Deal: Current price is best or almost best (within X% of cheapest) AND significantly below average
        if (currentInstacartPrice <= cheapestOverallPrice * (1 + SWEET_THRESHOLD_PERCENT_FROM_CHEAPEST) && 
            currentInstacartPrice < averageOverallPrice * (1 - 0.10)) { // e.g., 10% below average
            return { dealType: 'Sweet', colorClass: 'sweet', emoji: '🍯' };
        }

        // Meh Deal: Current price is within a normal range (e.g., +/- 15% of average)
        if (currentInstacartPrice >= averageOverallPrice * (1 - MEH_THRESHOLD_PERCENT_DEVIATION_FROM_AVERAGE) && 
            currentInstacartPrice <= averageOverallPrice * (1 + MEH_THRESHOLD_PERCENT_DEVIATION_FROM_AVERAGE)) {
            return { dealType: 'Meh', colorClass: 'meh', emoji: '😐' };
        }

        // Sour Deal: Current price is more expensive than normal
        return { dealType: 'Sour', colorClass: 'sour', emoji: '🍋' };
    }

    // Deal rating for an individual retailer's price compared to the current Instacart price
    getDealRatingForRetailer(retailerPrice, currentInstacartPrice) {
        if (retailerPrice === null || currentInstacartPrice === null) {
            return { dealType: 'Unknown', colorClass: 'unknown', emoji: '❓' };
        }

        const SWEET_PERCENT_CHEAPER = 0.20; // 20% cheaper
        const MEH_PERCENT_DEVIATION = 0.05; // 5% deviation (either cheaper or more expensive)

        const percentageDifference = (currentInstacartPrice - retailerPrice) / currentInstacartPrice;

        if (percentageDifference >= SWEET_PERCENT_CHEAPER) {
            return { dealType: 'Sweet', colorClass: 'sweet', emoji: '🍯' };
        } else if (percentageDifference > -MEH_PERCENT_DEVIATION && percentageDifference < MEH_PERCENT_DEVIATION) { // within +/- 5% of current price
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

    async getNearbyRetailers(zipcode) {
        try {
            const response = await chrome.runtime.sendMessage({
                action: 'getNearbyRetailers',
                zipcode: zipcode
            });

            if (!response.success) {
                throw new Error(response.error || 'Failed to get nearby retailers');
            }

            return response.retailers;
        } catch (error) {
            console.error('SweetDill: Error getting nearby retailers:', error);
            throw error;
        }
    }

    async searchProductPrices(productSlug, retailers) {
        try {
            const response = await fetch(chrome.runtime.getURL('data/sample-prices.json'));
            const data = await response.json();
            
            // Get both price results and coupons
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
            
            return {
                priceResults,
                coupons
            };
        } catch (error) {
            console.error('SweetDill: Error searching product prices:', error);
            throw error;
        }
    }

    async startPriceComparison() {
        try {
            const comparisonContent = document.getElementById('price-comparison-content');
            if (comparisonContent) {
                comparisonContent.innerHTML = '<div class="loading-spinner">Searching for prices...</div>';
            }

            // Load sample data
            const { priceResults, coupons } = await this.searchProductPrices();
            
            this.updatePriceComparison(priceResults);
            this.fetchAndRenderUnitPriceComparison();
            this.renderPriceHistory();
            this.renderCoupons(coupons);

        } catch (error) {
            console.error('SweetDill: Error comparing prices:', error);
            this.showPriceComparisonError();
        }
    }

    updatePriceComparison(priceResults) {
        const comparisonContent = document.getElementById('price-comparison-content');
        if (!comparisonContent) return;

        const validResults = priceResults.filter(result => result.price !== null);
        validResults.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));

        // Determine if a cheaper deal is found for the toggle button text
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
            // Reset current deal indicator on error
            const currentDealIndicatorElement = document.getElementById('current-deal-indicator');
            if (currentDealIndicatorElement) {
                currentDealIndicatorElement.className = 'deal-rating-box meh';
                currentDealIndicatorElement.innerHTML = '❓ N/A';
            }
            return;
        }

        // Determine overall deal type for current product page price
        const cheapestOverallPrice = Math.min(this.currentProductPrice, ...validResults.map(r => r.price));
        const allPrices = [this.currentProductPrice, ...validResults.map(r => r.price)].filter(p => p !== null);
        const averageOverallPrice = allPrices.reduce((sum, p) => sum + p, 0) / allPrices.length;

        const overallDealRating = this.getOverallDealRating(this.currentProductPrice, cheapestOverallPrice, averageOverallPrice);

        const currentDealIndicatorElement = document.getElementById('current-deal-indicator');
        if (currentDealIndicatorElement) {
            currentDealIndicatorElement.className = `deal-rating-box ${overallDealRating.colorClass}`;
            currentDealIndicatorElement.innerHTML = `${overallDealRating.emoji} ${overallDealRating.dealType} Deal`;
        }

        // Create HTML for price comparison
        const priceHtml = (visibleResults) => visibleResults.map(result => {
            const dealRatingForRetailer = this.getDealRatingForRetailer(result.price, this.currentProductPrice);
            return `
            <div class="retailer-price ${result.inStock ? 'in-stock' : 'out-of-stock'} ${dealRatingForRetailer.colorClass}">
                <div class="retailer-info">
                    <span class="retailer-name">${result.retailer.name}</span>
                    <span class="retailer-distance">${result.retailer.distance}</span>
                </div>
                <div class="price-info">
                    <span class="price">${this.formatPrice(result.price)}</span>
                    <span class="stock-status">${result.inStock ? 'In Stock' : 'Out of Stock'}</span>
                    <div class="deal-rating-box ${dealRatingForRetailer.colorClass}">
                        ${dealRatingForRetailer.emoji} ${dealRatingForRetailer.dealType} Deal
                    </div>
                    ${result.inStock ? `<div class="retailer-btn-row"><button class="view-button" data-retailer="${result.retailer.id}">View on Instacart</button></div>` : ''}
                </div>
            </div>
        `}).join('');

        const initialRetailerDisplayLimit = 3;
        const initialRetailers = validResults.slice(0, initialRetailerDisplayLimit);
        const moreRetailersExist = validResults.length > initialRetailerDisplayLimit;

        // Remove coupon-related HTML rendering from here
        comparisonContent.innerHTML = `
            <div class="price-comparison-section">
                <h2>Price Comparison</h2>
                <div id="retailer-list">${priceHtml(initialRetailers)}</div>
                ${moreRetailersExist ? `<button id="toggle-retailers-button" class="show-all-button">Show All Retailers</button>` : ''}
            </div>
        `;

        // Add event listeners to view buttons
        const viewButtons = comparisonContent.querySelectorAll('.view-button');
        viewButtons.forEach(button => {
            button.addEventListener('click', () => {
                const retailerId = button.dataset.retailer;
                this.redirectToRetailer(retailerId);
            });
        });

        // Add event listener for "Show All / Show Less Retailers" button
        const toggleRetailersButton = document.getElementById('toggle-retailers-button');
        if (toggleRetailersButton) {
            let showingAllRetailers = false;
            toggleRetailersButton.addEventListener('click', () => {
                showingAllRetailers = !showingAllRetailers;
                const retailerList = document.getElementById('retailer-list');
                if (retailerList) {
                    retailerList.innerHTML = priceHtml(showingAllRetailers ? validResults : initialRetailers);
                    toggleRetailersButton.textContent = showingAllRetailers ? 'Show Less' : 'Show More';
                }
            });
            // Set initial button text
            toggleRetailersButton.textContent = 'Show More';
        }
    }

    async renderPriceHistory() {
        const priceHistoryContainer = document.querySelector('.price-history .chart-container');
        if (!priceHistoryContainer) return;

        priceHistoryContainer.innerHTML = '<canvas id="price-history-chart"></canvas>';
        const canvas = document.getElementById('price-history-chart');
        if (!canvas) return;

        try {
            // Chart.js is now loaded via manifest.json as a regular script,
            // making it available on the window object in the isolated world.
            const Chart = window.Chart;

            if (!Chart || typeof Chart !== 'function') {
                throw new Error("Chart.js Chart constructor not found on window object. Ensure chart.umd.min.js is loaded.");
            }

            const response = await fetch(chrome.runtime.getURL('data/price-history-sample.json'));
            const data = await response.json();

            if (!Array.isArray(data) || data.length === 0) {
                console.error('SweetDill: Invalid or empty price history data');
                priceHistoryContainer.innerHTML = '<div class="error-message">No price history data available.</div>';
                return;
            }

            // Sort data by date
            const sortedData = data.sort((a, b) => new Date(a.date) - new Date(b.date));
            
            // Prepare data for Chart.js
            const chartData = {
                labels: sortedData.map(item => new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
                datasets: [{
                    label: 'Price History',
                    data: sortedData.map(item => item.price),
                    borderColor: '#4CAF50', // Using primary color
                    backgroundColor: 'rgba(39, 174, 96, 0.1)',
                    tension: 0.2, // Slightly less tension for a simpler curve
                    fill: true,
                    pointRadius: 3, // Smaller points
                    pointBackgroundColor: '#4CAF50', // Primary color for points
                    pointBorderColor: '#fff', // White border for points
                    pointBorderWidth: 1, // Thinner border
                    pointHoverRadius: 5, // Slightly larger on hover
                    pointHoverBackgroundColor: '#333333', // Text color on hover
                    pointHoverBorderColor: '#fff'
                }]
            };

            // Chart configuration
            const config = {
                type: 'line',
                data: chartData,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            backgroundColor: 'rgba(51, 51, 51, 0.9)', // Dark grey, slightly translucent
                            titleColor: '#fff',
                            bodyColor: '#fff',
                            borderColor: 'transparent',
                            borderWidth: 0,
                            padding: 10,
                            cornerRadius: 4, // Softer corners
                            displayColors: true, // Display the color box (point style)
                            usePointStyle: true, // Use the point style in the tooltip
                            callbacks: {
                                title: function() { return ''; }, // Remove title for a simpler look
                                label: function(context) {
                                    return `Price: ${new Intl.NumberFormat('en-US', {
                                        style: 'currency',
                                        currency: 'USD'
                                    }).format(context.parsed.y)}`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: {
                                display: false
                            },
                            border: {
                                display: false // Remove X-axis line
                            },
                            ticks: {
                                color: '#333333',
                                maxRotation: 0,
                                minRotation: 0,
                                maxTicksLimit: 7,
                                padding: 5 // Add padding to labels
                            }
                        },
                        y: {
                            grid: {
                                display: false
                            },
                            border: {
                                display: false // Remove Y-axis line
                            },
                            ticks: {
                                color: '#333333',
                                callback: function(value) {
                                    return new Intl.NumberFormat('en-US', {
                                        style: 'currency',
                                        currency: 'USD'
                                    }).format(value);
                                },
                                maxTicksLimit: 7,
                                padding: 5 // Add padding to labels
                            }
                        }
                    },
                    interaction: {
                        intersect: false,
                        mode: 'index'
                    }
                }
            };

            // Create the chart
            new Chart(canvas, config);

        } catch (error) {
            console.error('SweetDill: Error rendering price history chart:', error);
            priceHistoryContainer.innerHTML = '<div class="error-message">Unable to load price history.</div>';
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
        const currentDealIndicatorElement = document.getElementById('current-deal-indicator');
        if (currentDealIndicatorElement) {
            currentDealIndicatorElement.className = 'deal-rating-box meh';
            currentDealIndicatorElement.innerHTML = '❓ N/A';
        }
    }

    async fetchAndRenderUnitPriceComparison() {
        const unitComparisonContent = document.getElementById('unit-price-comparison-content');
        if (!unitComparisonContent) return;

        unitComparisonContent.innerHTML = '<div class="loading-spinner">Calculating unit prices...</div>';

        try {
            const response = await fetch(chrome.runtime.getURL('data/unit-price-comparison-sample.json'));
            const data = await response.json();

            if (!Array.isArray(data) || data.length === 0) {
                unitComparisonContent.innerHTML = '<div class="error-message">No unit price data available.</div>';
                return;
            }

            let bestUnitPrice = Infinity;
            let bestUnitPriceItem = null;

            const itemsWithUnitPrice = data.map(item => {
                const unitPrice = item.total_price / item.unit_value;
                if (unitPrice < bestUnitPrice) {
                    bestUnitPrice = unitPrice;
                    bestUnitPriceItem = item;
                }
                return { ...item, unitPrice };
            });

            // Sort by unit price for display
            itemsWithUnitPrice.sort((a, b) => a.unitPrice - b.unitPrice);

            const html = `
                <div class="unit-price-list">
                    ${itemsWithUnitPrice.map(item => {
                        const isBestValue = item === bestUnitPriceItem;
                        const isCurrentProduct = item.is_current_product;
                        return `
                            <div class="unit-price-item ${isBestValue ? 'best-value' : ''} ${isCurrentProduct ? 'current-product' : ''}">
                                <div class="size-info">
                                    <span class="size-description">${item.size_description}</span>
                                    ${isCurrentProduct ? '<span class="current-label"> (Current Size)</span>' : ''}
                                </div>
                                <div class="unit-price-controls">
                                    <div class="price-info">
                                        <span class="unit-price-value">${this.formatPrice(item.unitPrice)}/${item.unit}</span>
                                        <span class="total-price">(${this.formatPrice(item.total_price)})</span>
                                    </div>
                                    <div class="actions">
                                        <button class="view-size-button" data-url="${item.url}">View</button>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;

            unitComparisonContent.innerHTML = html;

            // Add event listeners for view buttons
            const viewSizeButtons = unitComparisonContent.querySelectorAll('.view-size-button');
            viewSizeButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const url = button.dataset.url;
                    if (url) {
                        window.open(url, '_blank');
                    }
                });
            });

        } catch (error) {
            console.error('SweetDill: Error fetching or rendering unit price comparison:', error);
            unitComparisonContent.innerHTML = '<div class="error-message">Unable to compare unit prices.</div>';
        }
    }

    // New function to render coupons
    renderCoupons(coupons) {
        const couponListContainer = document.getElementById('coupon-list-container');
        if (!couponListContainer) return;

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

        couponListContainer.innerHTML = couponHtml(initialCoupons);

        // Add event listeners to copy buttons
        const copyButtons = couponListContainer.querySelectorAll('.copy-button');
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

        // Add event listener for "Show All / Show Less Coupons" button
        const toggleCouponsButton = document.getElementById('toggle-coupons-button');
        if (toggleCouponsButton) {
            let showingAllCoupons = false;
            toggleCouponsButton.addEventListener('click', () => {
                showingAllCoupons = !showingAllCoupons;
                if (couponListContainer) {
                    couponListContainer.innerHTML = couponHtml(showingAllCoupons ? sortedCoupons : initialCoupons);
                    toggleCouponsButton.textContent = showingAllCoupons ? 'Show Less Coupons' : 'Show All Coupons';
                }
            });
        }
    }
}

// Initialize the content script
new SweetDillContent(); 