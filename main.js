   document.addEventListener('DOMContentLoaded', () => {
            const form = document.getElementById('userForm');
            const formMessage = document.getElementById('formMessage');
            const submitButton = form.querySelector('button[type="submit"]');

            form.addEventListener('submit', async (e) => {
                console.log('Submit event triggered');
                e.preventDefault();
                console.log('Default prevented');

                // Disable submit button and show loading message
                submitButton.disabled = true;
                formMessage.style.color = 'black';
                formMessage.textContent = 'Submitting...';
                formMessage.style.display = 'block';

                const formData = {
                    name: form.name.value,
                    email: form.email.value,
                    pincode: form.pincode.value,
                    phone: form.phone.value,
                    gender: form.gender.value
                };

                try {
                    const response = await fetch('http://localhost:3000/submit-form', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(formData)
                    });

                    if (response.ok) {
                        console.log('Form submitted successfully, redirecting...');
                        window.location.href = '/civic-sense/dashboard.html';
                    } else {
                        throw new Error('Failed to submit form');
                    }
                } catch (error) {
                    console.error('Error submitting form:', error);
                    formMessage.style.color = 'red';
                    formMessage.textContent = 'Error submitting form. Please try again.';
                    submitButton.disabled = false;
                }
            });
        });
