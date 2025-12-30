// API Configuration
// Backend API URL - Update this to your deployed backend server URL
// For local development: http://localhost:3000
// For production: https://your-backend-domain.com
const BACKEND_API_URL = "http://localhost:3000"; // TODO: Update to your production backend URL

const NOWPAYMENTS_API_KEY = "0ZTX41M-WJ5M083-HRC29PA-FRY69MH";
const NOWPAYMENTS_API_URL = "https://api.nowpayments.io/v1/invoice";
const NOWPAYMENTS_MIN_AMOUNT_URL = "https://api.nowpayments.io/v1/min-amount";

// Note: Model selection and API key are now handled by the backend server
const FREE_USES_LIMIT = 3;
const COOLDOWN_HOURS = 24;
const COOLDOWN_MS = COOLDOWN_HOURS * 60 * 60 * 1000;

// Plan configurations
const PLAN_CONFIGS = {
  monthly: {
    price: "10.00",
    description: "Pro Monthly Subscription - LinkedIn Reply AI"
  },
  yearly: {
    price: "99.00",
    description: "Pro Yearly Subscription - LinkedIn Reply AI"
  },
  lifetime: {
    price: "199.00",
    description: "Pro Lifetime Access - LinkedIn Reply AI"
  }
};

// Fetch minimal supported amount for BTC vs USDT-TRC20 (used as a safeguard for small payments)
async function fetchBtcMinAmount() {
  try {
    const url = `${NOWPAYMENTS_MIN_AMOUNT_URL}?currency_from=btc&currency_to=usdttrc20`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "x-api-key": NOWPAYMENTS_API_KEY
      }
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      const msg = data.message || data.error || `Min-amount API error: ${response.status}`;
      const err = new Error(msg);
      err.isMinCheckFailed = true;
      err.status = response.status;
      throw err;
    }

    const body = await response.json();
    const min = parseFloat(body.min_amount);
    if (Number.isNaN(min)) {
      const err = new Error("Invalid minimum amount response");
      err.isMinCheckFailed = true;
      throw err;
    }
    return min;
  } catch (error) {
    console.error("Failed to fetch BTC minimum amount from NOWPayments:", error);
    throw error;
  }
}

// DOM Elements
const statusEl = document.getElementById('status');
const upgradeScreen = document.getElementById('upgradeScreen');
const mainContent = document.getElementById('mainContent');
const generateBtn = document.getElementById('generateBtn');
const loadingEl = document.getElementById('loading');
const repliesContainer = document.getElementById('repliesContainer');
const repliesList = document.getElementById('repliesList');
const errorEl = document.getElementById('error');
const proBadge = document.getElementById('proBadge');
const freeBadge = document.getElementById('freeBadge');
const tierIndicator = document.getElementById('tierIndicator');
const tierLabel = document.getElementById('tierLabel');
const tierDetails = document.getElementById('tierDetails');
const activationSection = document.getElementById('activationSection');
const activateProBtn = document.getElementById('activateProBtn');

// Get storage data
async function getStorageData() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['freeUsesCount', 'cooldownStartTime', 'isPro', 'proPlan'], (result) => {
      resolve(result);
    });
  });
}

// Set storage data
async function setStorageData(data) {
  return new Promise((resolve) => {
    chrome.storage.local.set(data, () => {
      resolve();
    });
  });
}

// Check Pro status and update badge/indicators
async function updateProBadge() {
  const data = await getStorageData();
  
  if (data.isPro) {
    // Pro user
    if (proBadge) proBadge.style.display = 'inline-block';
    if (freeBadge) freeBadge.style.display = 'none';
    if (tierIndicator) {
      tierIndicator.style.display = 'block';
      tierIndicator.className = 'tier-indicator pro';
      if (tierLabel) tierLabel.textContent = '✓ Pro Plan Active';
      if (tierDetails) tierDetails.textContent = 'Unlimited AI replies • No cooldowns • Priority support';
    }
  } else {
    // Free tier user
    if (proBadge) proBadge.style.display = 'none';
    if (freeBadge) freeBadge.style.display = 'inline-block';
    
    // Update tier indicator with free tier info
    const freeUsesCount = data.freeUsesCount || 0;
    const remainingUses = FREE_USES_LIMIT - freeUsesCount;
    
    if (tierIndicator) {
      tierIndicator.style.display = 'block';
      tierIndicator.className = 'tier-indicator';
      if (tierLabel) tierLabel.textContent = 'Free Tier Mode';
      if (tierDetails) {
        if (remainingUses > 0) {
          tierDetails.textContent = `${remainingUses} of ${FREE_USES_LIMIT} free uses remaining`;
        } else {
          tierDetails.textContent = 'Free trial limit reached • Upgrade to Pro for unlimited access';
        }
      }
    }
  }
}

// Check cooldown status and update UI accordingly
async function checkCooldownAndUpdateUI() {
  const data = await getStorageData();
  
  // If Pro user, always show main content
  if (data.isPro) {
    await updateProBadge();
    showMainContent(0);
    return;
  }
  
  const freeUsesCount = data.freeUsesCount || 0;
  const cooldownStartTime = data.cooldownStartTime;
  
  // Check if cooldown exists and is still active
  if (cooldownStartTime) {
    const now = Date.now();
    const timeSinceCooldown = now - cooldownStartTime;
    
    if (timeSinceCooldown < COOLDOWN_MS) {
      // Still in cooldown - show pricing screen
      showPricingScreen();
      return;
    } else {
      // Cooldown expired - reset silently
      await setStorageData({
        freeUsesCount: 0,
        cooldownStartTime: null
      });
      showMainContent(0);
      return;
    }
  }
  
  // No cooldown - show main content
  showMainContent(freeUsesCount);
}

// Show main content (generate button visible)
async function showMainContent(freeUsesCount) {
  mainContent.style.display = 'block';
  upgradeScreen.style.display = 'none';
  generateBtn.style.display = 'block';
  generateBtn.disabled = false;
  
  // Update tier indicators
  await updateProBadge();
}

// Show pricing screen (cooldown active)
function showPricingScreen() {
  mainContent.style.display = 'none';
  upgradeScreen.style.display = 'block';
  generateBtn.style.display = 'none';
}

// Increment free uses count and start cooldown if needed
async function incrementFreeUses() {
  const data = await getStorageData();
  const currentCount = data.freeUsesCount || 0;
  const newCount = currentCount + 1;
  
  const updateData = {
    freeUsesCount: newCount
  };
  
  // If this is the 3rd use, start cooldown
  if (newCount >= FREE_USES_LIMIT) {
    updateData.cooldownStartTime = Date.now();
  }
  
  await setStorageData(updateData);
  return newCount;
}

// Extract text from current tab
async function extractPageText() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab.url || !tab.url.includes('linkedin.com')) {
      throw new Error('Please navigate to a LinkedIn page');
    }

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: extractText
    });

    if (!results || !results[0] || !results[0].result) {
      throw new Error('Failed to extract page text');
    }

    return results[0].result;
  } catch (error) {
    console.error('Error extracting page text:', error);
    throw error;
  }
}

// Function to be injected into page
function extractText() {
  const text = document.body.innerText.trim();
  // Limit to 1500 characters
  return text.length > 1500 ? text.substring(0, 1500) : text;
}

// Call backend API to generate replies (secure - API key is on server)
async function generateReplies(pageText) {
  try {
    const response = await fetch(`${BACKEND_API_URL}/api/generate-reply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        pageText: pageText
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || errorData.error || `API error: ${response.status}`;
      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    if (!data.success || !data.text) {
      throw new Error('Invalid API response format');
    }

    // Return the generated text
    console.log(`Successfully generated replies using model: ${data.model || 'unknown'}`);
    return data.text;
  } catch (error) {
    console.error('Error calling backend API:', error);
    
    // Provide user-friendly error messages
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      throw new Error('Unable to connect to server. Please check your internet connection and ensure the backend server is running.');
    }
    
    throw error;
  }
}

// Parse replies from API response
function parseReplies(text) {
  // Split by numbered lines (1., 2., 3.) or by newlines
  const lines = text.split('\n').filter(line => line.trim());
  const replies = [];
  
  for (const line of lines) {
    // Remove numbering (1., 2., 3., etc.)
    const cleaned = line.replace(/^\d+[\.\)]\s*/, '').trim();
    if (cleaned && cleaned.length > 10) {
      replies.push(cleaned);
    }
  }
  
  // If we didn't get 3 replies, try splitting by double newlines or other patterns
  if (replies.length < 3) {
    const altSplit = text.split(/\n\s*\n/).filter(line => line.trim());
    if (altSplit.length >= 3) {
      return altSplit.slice(0, 3).map(r => r.replace(/^\d+[\.\)]\s*/, '').trim());
    }
  }
  
  // Return up to 3 replies
  return replies.slice(0, 3);
}

// Display replies
function displayReplies(replies) {
  repliesList.innerHTML = '';
  
  replies.forEach((reply, index) => {
    const replyItem = document.createElement('div');
    replyItem.className = 'reply-item';
    
    const replyText = document.createElement('div');
    replyText.textContent = reply;
    
    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-btn';
    copyBtn.textContent = 'Copy';
    copyBtn.onclick = () => {
      navigator.clipboard.writeText(reply).then(() => {
        copyBtn.textContent = 'Copied!';
        setTimeout(() => {
          copyBtn.textContent = 'Copy';
        }, 2000);
      });
    };
    
    replyItem.appendChild(replyText);
    replyItem.appendChild(copyBtn);
    repliesList.appendChild(replyItem);
  });
  
  repliesContainer.classList.add('show');
}

// Show error
function showError(message) {
  errorEl.textContent = message;
  errorEl.classList.add('show');
  setTimeout(() => {
    errorEl.classList.remove('show');
  }, 5000);
}

// Hide error
function hideError() {
  errorEl.classList.remove('show');
}

// Main generate function
async function handleGenerate() {
  // Check backend URL is configured
  if (!BACKEND_API_URL || BACKEND_API_URL.includes('localhost') && BACKEND_API_URL.includes('TODO')) {
    showError('Backend API URL not configured. Please update BACKEND_API_URL in popup.js');
    return;
  }

  const data = await getStorageData();
  
  // Pro users bypass all limits
  if (!data.isPro) {
    // Check if we're in cooldown (shouldn't happen if UI is correct, but double-check)
    if (data.cooldownStartTime) {
      const timeSinceCooldown = Date.now() - data.cooldownStartTime;
      if (timeSinceCooldown < COOLDOWN_MS) {
        showPricingScreen();
        return;
      }
    }

    // Check if limit reached (shouldn't happen if UI is correct)
    const freeUsesCount = data.freeUsesCount || 0;
    if (freeUsesCount >= FREE_USES_LIMIT) {
      showPricingScreen();
      return;
    }
  }

  // Reset UI
  hideError();
  repliesContainer.classList.remove('show');
  loadingEl.classList.add('show');
  generateBtn.disabled = true;

  try {
    // Extract page text
    const pageText = await extractPageText();
    
    if (!pageText || pageText.length < 50) {
      throw new Error('Could not extract enough text from the page. Please make sure you are on a LinkedIn post page.');
    }

    // Generate replies
    const responseText = await generateReplies(pageText);
    const replies = parseReplies(responseText);
    
    if (replies.length === 0) {
      throw new Error('Failed to parse replies from API response');
    }

    // Only increment count if not Pro
    if (!data.isPro) {
      const newCount = await incrementFreeUses();
      
      // Update UI based on new count
      if (newCount >= FREE_USES_LIMIT) {
        // Just used the 3rd generation - show pricing screen
        setTimeout(() => {
          showPricingScreen();
        }, 2000); // Show pricing after 2 seconds so user can see the replies
      } else {
        // Update status
        showMainContent(newCount);
      }
    }
    
    // Display replies
    displayReplies(replies);
  } catch (error) {
    console.error('Error generating replies:', error);
    showError(error.message || 'Failed to generate replies. Please try again.');
  } finally {
    loadingEl.classList.remove('show');
    generateBtn.disabled = false;
  }
}

// Create NOWPayments invoice
async function createInvoice(planType) {
  const plan = PLAN_CONFIGS[planType];
  if (!plan) {
    throw new Error('Invalid plan type');
  }

  // Request body without pay_currency to allow user to choose any supported crypto (BTC, USDT, etc.)
  const priceAmount = parseFloat(plan.price);
  const requestBody = {
    price_amount: plan.price,
    price_currency: "usd",
    order_description: plan.description,
    order_id: `pro-upgrade-${planType}-${Date.now()}`
    // No pay_currency field → NOWPayments allows "All currencies" selection
  };

  try {
    // Pre-check: compare plan price vs BTC minimum if we can fetch it
    try {
      const btcMin = await fetchBtcMinAmount();
      if (!Number.isNaN(priceAmount) && priceAmount < btcMin) {
        const err = new Error(
          `Amount too small for BTC. Current minimum is approximately ${btcMin.toFixed(
            2
          )} USD.`
        );
        err.isMinAmountError = true;
        err.minAmount = btcMin;
        throw err;
      }
    } catch (minErr) {
      // If the min-check itself fails for network/API reasons, bubble up with a flag
      if (!minErr.isMinAmountError) {
        minErr.isMinCheckFailed = true;
      }
      throw minErr;
    }

    const response = await fetch(NOWPAYMENTS_API_URL, {
      method: 'POST',
      headers: {
        'x-api-key': NOWPAYMENTS_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || errorData.error || `API error: ${response.status}`;
      
      // Check for minimum amount errors
      const msgLower = errorMessage.toLowerCase();
      const isMinAmountError = 
        response.status === 400 ||
        msgLower.includes('minimal amount') ||
        msgLower.includes('minimum') ||
        msgLower.includes('too small') ||
        msgLower.includes('amount');
      
      const err = new Error(errorMessage);
      err.status = response.status;
      err.isMinAmountError = isMinAmountError;
      throw err;
    }

    const data = await response.json();
    
    if (!data.invoice_url) {
      throw new Error('Invalid API response: missing invoice_url');
    }

    return data.invoice_url;
  } catch (error) {
    console.error('Error creating invoice:', error);
    throw error;
  }
}

// Handle pricing plan selection with NOWPayments
async function handlePlanSelection(planType) {
  const payBtn = document.getElementById(`pay${planType.charAt(0).toUpperCase() + planType.slice(1)}`);
  if (!payBtn) return;

  // Disable button and show loading
  payBtn.disabled = true;
  payBtn.classList.add('loading');
  const originalText = payBtn.innerHTML;
  payBtn.innerHTML = '<span class="payment-loading"></span> Creating invoice...';

  try {
    const invoiceUrl = await createInvoice(planType);
    
    // Open invoice in new tab
    window.open(invoiceUrl, '_blank');
    
    // Show activation section
    if (activationSection) {
      activationSection.style.display = 'block';
      // Store plan type for activation
      await setStorageData({ pendingPlanType: planType });
    }
    
    // Reset button
    payBtn.disabled = false;
    payBtn.classList.remove('loading');
    payBtn.innerHTML = originalText;
  } catch (error) {
    console.error('Payment setup failed:', error);

    // Check for minimum amount errors or pre-check failures
    if (error.isMinAmountError || error.status === 400) {
      const approxMin =
        typeof error.minAmount === "number"
          ? ` (current min ~${error.minAmount.toFixed(2)} USD)`
          : "";
      showError(
        `Amount too small for BTC${approxMin}. Switch to USDT-Tron or choose a higher plan.`
      );
    } else if (error.isMinCheckFailed) {
      showError('Could not verify current minimum amounts. Please check the latest limits on the NOWPayments status page.');
    } else {
      showError('Payment setup failed, try again later');
    }
    
    // Reset button
    payBtn.disabled = false;
    payBtn.classList.remove('loading');
    payBtn.innerHTML = originalText;
  }
}

// Activate Pro access (manual activation for MVP)
async function activatePro() {
  const data = await getStorageData();
  const planType = data.pendingPlanType || 'monthly';
  
  await setStorageData({
    isPro: true,
    proPlan: planType,
    pendingPlanType: null
  });
  
  // Hide activation section
  if (activationSection) {
    activationSection.style.display = 'none';
  }
  
  // Update UI
  await updateProBadge();
  showMainContent(0);
  
  // Show success message
  showError(''); // Clear any errors
  const successMsg = document.createElement('div');
  successMsg.className = 'error';
  successMsg.style.background = '#d1fae5';
  successMsg.style.borderColor = '#10b981';
  successMsg.style.color = '#065f46';
  successMsg.textContent = 'Pro activated! Enjoy unlimited AI replies.';
  errorEl.parentNode.insertBefore(successMsg, errorEl);
  setTimeout(() => {
    successMsg.remove();
  }, 3000);
}

// Initialize event listeners
function initializeEventListeners() {
  // Generate button
  generateBtn.addEventListener('click', handleGenerate);
  
  // Pricing plan payment buttons
  const payMonthlyBtn = document.getElementById('payMonthly');
  const payYearlyBtn = document.getElementById('payYearly');
  const payLifetimeBtn = document.getElementById('payLifetime');
  
  if (payMonthlyBtn) {
    payMonthlyBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      handlePlanSelection('monthly');
    });
  }
  if (payYearlyBtn) {
    payYearlyBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      handlePlanSelection('yearly');
    });
  }
  if (payLifetimeBtn) {
    payLifetimeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      handlePlanSelection('lifetime');
    });
  }
  
  // Activation button
  if (activateProBtn) {
    activateProBtn.addEventListener('click', activatePro);
  }
  
  // Remove click handlers from plan cards (only buttons should be clickable)
  const planCards = document.querySelectorAll('.plan-card');
  planCards.forEach(card => {
    card.style.cursor = 'default';
  });
}

// Initialize on popup open
document.addEventListener('DOMContentLoaded', async () => {
  initializeEventListeners();
  await updateProBadge();
  await checkCooldownAndUpdateUI();
  
  // Show activation section if payment was made but not activated
  const data = await getStorageData();
  if (data.pendingPlanType && !data.isPro && activationSection) {
    activationSection.style.display = 'block';
  }
});

