document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
    handleAuthDisplay();
    initializeTopUpModal();

    if (document.getElementById('register-form')) {
        handleRegisterForm();
    } else if (document.getElementById('login-form')) {
        handleLoginForm();
    } else if (document.querySelectorAll('.add-to-cart').length > 0) {
        handleAddToCartButtons();
    }

    if (window.location.pathname.includes('cart.html')) {
        renderCartItems();
        setupCartPageEvents();
    } else if (window.location.pathname.includes('checkout.html')) {
        renderCheckoutSummary();
        setupCheckoutEvents();
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logoutUser();
        });
    }
});

function updateCartCount() {
    const cart = getCart();
    const cartCountElement = document.getElementById('cart-count');
    if (cartCountElement) {
        let totalItems = 0;
        cart.forEach(item => totalItems += item.qty);
        cartCountElement.textContent = totalItems;
    }
}

function handleAuthDisplay() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const loggedInUser = localStorage.getItem('loggedInUser');
    const navLogin = document.getElementById('nav-login');
    const navRegister = document.getElementById('nav-register');
    const navLogout = document.getElementById('nav-logout');
    const navBalance = document.getElementById('nav-balance');
    const headerBalanceDisplay = document.getElementById('header-balance');

    if (navLogin && navRegister && navLogout && navBalance && headerBalanceDisplay) {
        if (isLoggedIn && loggedInUser) {
            navLogin.style.display = 'none';
            navRegister.style.display = 'none';
            navLogout.style.display = 'list-item';
            navBalance.style.display = 'list-item';
            headerBalanceDisplay.textContent = formatRupiah(getVirtualBalance(loggedInUser));
        } else {
            navLogin.style.display = 'list-item';
            navRegister.style.display = 'list-item';
            navLogout.style.display = 'none';
            navBalance.style.display = 'none';
        }
    }
}

function logoutUser() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('loggedInUser');
    alert('Anda telah berhasil logout.');
    window.location.href = 'index.html';
}

function getCart() {
    return JSON.parse(localStorage.getItem('cart')) || [];
}

function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function formatRupiah(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
}

function getUsers() {
    return JSON.parse(localStorage.getItem('users')) || {};
}

function saveUsers(users) {
    localStorage.setItem('users', JSON.stringify(users));
}

function getVirtualBalance(username) {
    const users = getUsers();
    if (users[username] && typeof users[username].balance !== 'undefined') {
        return users[username].balance;
    }
    return 0;
}

function setVirtualBalance(username, newBalance) {
    let users = getUsers();
    if (users[username]) {
        users[username].balance = newBalance;
        saveUsers(users);
        const headerBalanceDisplay = document.getElementById('header-balance');
        if (headerBalanceDisplay) {
            headerBalanceDisplay.textContent = formatRupiah(newBalance);
        }
    }
}

function handleRegisterForm() {
    const registerForm = document.getElementById('register-form');
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = registerForm['reg-username'].value.trim();
        const email = registerForm['reg-email'].value.trim().toLowerCase();
        const password = registerForm['reg-password'].value;
        const confirmPassword = registerForm['reg-confirm-password'].value;

        if (!username || !email || !password || !confirmPassword) {
            alert('Semua kolom harus diisi!');
            return;
        }

        if (password !== confirmPassword) {
            alert('Konfirmasi password tidak cocok!');
            return;
        }

        let users = getUsers();
        let emailExists = false;
        for (let key in users) {
            if (users[key].email === email) {
                emailExists = true;
                break;
            }
        }

        if (emailExists) {
            alert('Email ini sudah terdaftar. Silakan gunakan email lain atau login.');
            return;
        }

        users[username] = { email: email, password: password, balance: 0 };
        saveUsers(users);

        alert('Pendaftaran berhasil! Silakan login dengan email Anda.');
        window.location.href = 'login.html';
    });
}

function handleLoginForm() {
    const loginForm = document.getElementById('login-form');
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const inputEmail = loginForm['login-username'].value.trim().toLowerCase();
        const password = loginForm['login-password'].value;

        let users = getUsers();
        let foundUserKey = null;

        for (let key in users) {
            if (users[key].email === inputEmail && users[key].password === password) {
                foundUserKey = key;
                break;
            }
        }

        if (foundUserKey) {
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('loggedInUser', foundUserKey);
            alert(`Selamat datang, ${foundUserKey}! Login berhasil.`);
            window.location.href = 'index.html';
        } else {
            alert('Email atau password salah, atau belum terdaftar.');
        }
    });
}

function handleAddToCartButtons() {
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', (e) => {
            const productItem = e.target.closest('.product-item');
            const id = productItem.dataset.id;
            const name = productItem.dataset.name;
            const price = parseInt(productItem.dataset.price);
            const img = productItem.dataset.img;

            let cart = getCart();
            const existingItemIndex = cart.findIndex(item => item.id === id);

            if (existingItemIndex > -1) {
                cart[existingItemIndex].qty += 1;
            } else {
                cart.push({ id, name, price, img, qty: 1 });
            }

            saveCart(cart);
            updateCartCount();
            alert(`${name} ditambahkan ke keranjang!`);
        });
    });
}

function renderCartItems() {
    const cart = getCart();
    const cartTableBody = document.querySelector('#cart-table tbody');
    const cartTotalPriceElement = document.getElementById('cart-total-price');
    const emptyCartMessage = document.getElementById('empty-cart-message');
    const cartActions = document.querySelector('.cart-actions');

    if (!cartTableBody || !cartTotalPriceElement || !emptyCartMessage || !cartActions) return;

    cartTableBody.innerHTML = '';

    if (cart.length === 0) {
        emptyCartMessage.style.display = 'block';
        cartTableBody.style.display = 'none';
        cartActions.style.display = 'none';
        return;
    }

    emptyCartMessage.style.display = 'none';
    cartTableBody.style.display = 'table-row-group';
    cartActions.style.display = 'flex';

    let totalCartPrice = 0;

    cart.forEach(item => {
        const subtotal = item.price * item.qty;
        totalCartPrice += subtotal;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td data-label="Gambar"><img src="${item.img}" alt="${item.name}" class="cart-item-img"></td>
            <td data-label="Nama Item">${item.name}</td>
            <td data-label="Harga Satuan">${formatRupiah(item.price)}</td>
            <td data-label="Kuantitas">
                <div class="quantity-control">
                    <button class="decrease-qty" data-id="${item.id}">-</button>
                    <span>${item.qty}</span>
                    <button class="increase-qty" data-id="${item.id}">+</button>
                </div>
            </td>
            <td data-label="Subtotal">${formatRupiah(subtotal)}</td>
            <td data-label="Aksi"><button class="btn btn-danger remove-item" data-id="${item.id}">Hapus</button></td>
        `;
        cartTableBody.appendChild(row);
    });

    cartTotalPriceElement.textContent = formatRupiah(totalCartPrice);
}

function setupCartPageEvents() {
    const cartTableBody = document.querySelector('#cart-table tbody');
    if (cartTableBody) {
        cartTableBody.addEventListener('click', (e) => {
            let cart = getCart();
            const id = e.target.dataset.id;

            if (e.target.classList.contains('remove-item')) {
                cart = cart.filter(item => item.id !== id);
                saveCart(cart);
                renderCartItems();
                updateCartCount();
            } else if (e.target.classList.contains('increase-qty')) {
                const itemIndex = cart.findIndex(item => item.id === id);
                if (itemIndex > -1) {
                    cart[itemIndex].qty++;
                    saveCart(cart);
                    renderCartItems();
                    updateCartCount();
                }
            } else if (e.target.classList.contains('decrease-qty')) {
                const itemIndex = cart.findIndex(item => item.id === id);
                if (itemIndex > -1) {
                    if (cart[itemIndex].qty > 1) {
                        cart[itemIndex].qty--;
                    } else {
                        cart = cart.filter(item => item.id !== id);
                    }
                    saveCart(cart);
                    renderCartItems();
                    updateCartCount();
                }
            }
        });
    }

    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (localStorage.getItem('isLoggedIn') === 'true') {
                window.location.href = 'checkout.html';
            } else {
                alert('Anda harus login untuk melanjutkan pembayaran!');
                window.location.href = 'login.html';
            }
        });
    }
}

function calculateCartTotal() {
    const cart = getCart();
    let total = 0;
    cart.forEach(item => {
        total += item.price * item.qty;
    });
    return total;
}

function renderCheckoutSummary() {
    const checkoutTotalDisplay = document.getElementById('checkout-total-display');
    const virtualBalanceDisplay = document.getElementById('virtual-balance-display');
    const totalDonation = calculateCartTotal();
    const loggedInUser = localStorage.getItem('loggedInUser');
    const currentBalance = getVirtualBalance(loggedInUser);

    if (checkoutTotalDisplay && virtualBalanceDisplay) {
        checkoutTotalDisplay.textContent = formatRupiah(totalDonation);
        virtualBalanceDisplay.textContent = formatRupiah(currentBalance);
    }

    const payNowBtn = document.getElementById('pay-now-btn');
    const topupBtn = document.getElementById('topup-btn');
    if (payNowBtn && topupBtn) {
        if (currentBalance >= totalDonation) {
            payNowBtn.style.display = 'block';
            topupBtn.style.display = 'none';
        } else {
            payNowBtn.style.display = 'none';
            topupBtn.style.display = 'block';
            if (localStorage.getItem('alertedInsufficientBalance') !== 'true') {
                alert(`Saldo virtual Anda tidak cukup (${formatRupiah(currentBalance)}). Total donasi adalah ${formatRupiah(totalDonation)}. Silakan top up.`);
                localStorage.setItem('alertedInsufficientBalance', 'true');
            }
        }
    }
}

function setupCheckoutEvents() {
    const payNowBtn = document.getElementById('pay-now-btn');
    const topupBtn = document.getElementById('topup-btn');
    const topupOptionsDiv = document.getElementById('topup-options');
    const bcaTopupBtn = document.getElementById('bca-topup-btn');
    const bcaTopupInputDiv = document.getElementById('bca-topup-input');
    const confirmTopupBtn = document.getElementById('confirm-topup-btn');
    const topupAmountInput = document.getElementById('topup-amount');

    if (payNowBtn) {
        payNowBtn.addEventListener('click', () => {
            const totalDonation = calculateCartTotal();
            const loggedInUser = localStorage.getItem('loggedInUser');
            let currentBalance = getVirtualBalance(loggedInUser);

            if (currentBalance >= totalDonation) {
                currentBalance -= totalDonation;
                setVirtualBalance(loggedInUser, currentBalance);
                alert('Pembayaran berhasil! Terima kasih atas donasi Anda.');
                localStorage.removeItem('cart');
                localStorage.removeItem('alertedInsufficientBalance');
                updateCartCount();
                window.location.href = 'thanks.html';
            } else {
                alert(`Saldo virtual tidak cukup. Anda memiliki ${formatRupiah(currentBalance)}, namun total donasi adalah ${formatRupiah(totalDonation)}. Silakan top up.`);
                topupBtn.style.display = 'block';
                payNowBtn.style.display = 'none';
            }
        });
    }

    if (topupBtn) {
        topupBtn.addEventListener('click', () => {
            topupOptionsDiv.style.display = 'block';
            topupBtn.style.display = 'none';
            localStorage.removeItem('alertedInsufficientBalance');
        });
    }

    if (bcaTopupBtn) {
        bcaTopupBtn.addEventListener('click', () => {
            topupOptionsDiv.style.display = 'none';
            bcaTopupInputDiv.style.display = 'block';
            topupAmountInput.value = '';
        });
    }

    if (confirmTopupBtn) {
        confirmTopupBtn.addEventListener('click', () => {
            const amount = parseInt(topupAmountInput.value);
            const loggedInUser = localStorage.getItem('loggedInUser');

            if (isNaN(amount) || amount < 10000) {
                alert('Jumlah top up minimal Rp 10.000.');
                return;
            }

            let currentBalance = getVirtualBalance(loggedInUser);
            currentBalance += amount;
            setVirtualBalance(loggedInUser, currentBalance);
            alert(`Top up sebesar ${formatRupiah(amount)} berhasil! Saldo Anda sekarang ${formatRupiah(currentBalance)}.`);

            bcaTopupInputDiv.style.display = 'none';
            topupOptionsDiv.style.display = 'none';
            renderCheckoutSummary();
        });
    }
}

function initializeTopUpModal() {
    const headerTopupBtn = document.getElementById('header-topup-btn');
    if (!headerTopupBtn) return;

    let modalOverlay;
    let bcaTopupInputModal;
    let confirmTopupModalBtn;
    let topupAmountModalInput;
    let modalCloseBtn;

    headerTopupBtn.addEventListener('click', () => {
        if (!localStorage.getItem('isLoggedIn')) {
            alert('Anda harus login untuk melakukan top up!');
            window.location.href = 'login.html';
            return;
        }
        createTopUpModal();
    });

    function createTopUpModal() {
        if (document.getElementById('topup-modal-overlay')) {
            document.getElementById('topup-modal-overlay').remove();
        }

        modalOverlay = document.createElement('div');
        modalOverlay.id = 'topup-modal-overlay';
        modalOverlay.className = 'modal-overlay';
        modalOverlay.innerHTML = `
            <div class="modal-content">
                <button class="modal-close-btn">&times;</button>
                <div id="modal-topup-options">
                    <h3>Pilih Bank untuk Top Up:</h3>
                    <button id="modal-bca-topup-btn" class="btn btn-bca">Bank BCA</button>
                    <p style="margin-top: 10px; font-size: 0.9em; color: #666;">(Pilihan bank lain belum tersedia)</p>
                </div>
                <div id="modal-bca-topup-input" style="display:none; margin-top: 20px;">
                    <h3>Isi Saldo Top Up (BCA):</h3>
                    <div class="form-group">
                        <label for="modal-topup-amount">Jumlah Top Up (Rp):</label>
                        <input type="number" id="modal-topup-amount" name="topup_amount" min="10000" placeholder="Min. Rp 10.000" required>
                    </div>
                    <button id="modal-confirm-topup-btn" class="btn btn-primary">Konfirmasi Top Up</button>
                </div>
            </div>
        `;
        document.body.appendChild(modalOverlay);

        const modalBcaTopupBtn = document.getElementById('modal-bca-topup-btn');
        const modalTopupOptionsDiv = document.getElementById('modal-topup-options');
        bcaTopupInputModal = document.getElementById('modal-bca-topup-input');
        confirmTopupModalBtn = document.getElementById('modal-confirm-topup-btn');
        topupAmountModalInput = document.getElementById('modal-topup-amount');
        modalCloseBtn = document.querySelector('.modal-close-btn');

        modalBcaTopupBtn.addEventListener('click', () => {
            modalTopupOptionsDiv.style.display = 'none';
            bcaTopupInputModal.style.display = 'block';
            topupAmountModalInput.value = '';
        });

        confirmTopupModalBtn.addEventListener('click', handleModalTopUpConfirmation);
        modalCloseBtn.addEventListener('click', closeModal);
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                closeModal();
            }
        });
    }

    function handleModalTopUpConfirmation() {
        const amount = parseInt(topupAmountModalInput.value);
        const loggedInUser = localStorage.getItem('loggedInUser');

        if (isNaN(amount) || amount < 10000) {
            alert('Jumlah top up minimal Rp 10.000.');
            return;
        }

        let currentBalance = getVirtualBalance(loggedInUser);
        currentBalance += amount;
        setVirtualBalance(loggedInUser, currentBalance);
        alert(`Top up sebesar ${formatRupiah(amount)} berhasil! Saldo Anda sekarang ${formatRupiah(currentBalance)}.`);

        closeModal();
        handleAuthDisplay();
    }

    function closeModal() {
        if (modalOverlay) {
            modalOverlay.remove();
        }
    }
}