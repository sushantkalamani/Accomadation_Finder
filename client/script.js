function toggleForms() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    loginForm.classList.toggle('active');
    registerForm.classList.toggle('active');
}

async function loginUser(event) {
    event.preventDefault();
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value.trim();

    try {
        const response = await fetch('http://localhost:3000/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const result = await response.json();
        document.getElementById('message').innerText = result.message || 'Error occurred';

        if (response.ok) {
            window.location.href = 'welcome.html'; // Redirect to the welcome page
        }
    } catch (error) {
        console.error('Login failed:', error);
        document.getElementById('message').innerText = 'Login failed. Please try again later.';
    }
}

async function registerUser(event) {
    event.preventDefault();
    const email = document.getElementById('registerEmail').value.trim();
    const username = document.getElementById('registerUsername').value.trim();
    const password = document.getElementById('registerPassword').value.trim();

    try {
        const response = await fetch('http://localhost:3000/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, username, password })
        });

        const result = await response.json();
        document.getElementById('message').innerText = result.message || 'Error occurred';

        if (response.ok) {
            document.getElementById('registerForm').reset();
            toggleForms(); // Automatically switch to login form after registration
        }
    } catch (error) {
        console.error('Registration failed:', error);
        document.getElementById('message').innerText = 'Registration failed. Please try again later.';
    }
}
