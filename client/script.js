// Toggle between login and register forms
function toggleForms() {
    const loginFormContainer = document.getElementById('loginFormContainer');
    const registerFormContainer = document.getElementById('registerFormContainer');

    loginFormContainer.classList.toggle('hidden');
    registerFormContainer.classList.toggle('hidden');
}

async function registerUser(event) {
    event.preventDefault();
    const username = document.getElementById('registerUsername').value;
    const password = document.getElementById('registerPassword').value;

    const response = await fetch('http://localhost:3000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });

    const result = await response.json();
    document.getElementById('message').innerText = result.message;
    if (response.ok) {
        document.getElementById('registerForm').reset();
        toggleForms();  // Automatically switch to login form after registration
    }
}

async function loginUser(event) {
    event.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    const response = await fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });

    const result = await response.json();
    document.getElementById('message').innerText = result.message;

    // Redirect if login is successful
    if (response.ok) {
        document.getElementById('loginForm').reset();
        window.location.href = "welcome.html"; // Redirect to the welcome page
    }
}

