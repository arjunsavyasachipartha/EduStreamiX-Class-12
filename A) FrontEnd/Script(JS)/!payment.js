document.addEventListener('DOMContentLoaded', () => {
    const payButton = document.getElementById('payButton');
    const btnText = document.getElementById('btnText');
    const btnSpinner = document.getElementById('btnSpinner');
    
    const pageLoaderOverlay = document.getElementById('pageLoaderOverlay');
    const loaderText = document.getElementById('loaderText');
    
    const lockIcon = document.getElementById('lockIcon');
    const paymentTitle = document.getElementById('paymentTitle');
    const paymentDesc = document.getElementById('paymentDesc');
    const priceBadge = document.getElementById('priceBadge');

    payButton.addEventListener('click', async () => {
        // 1. Initial button state change
        btnText.style.display = 'none';
        btnSpinner.style.display = 'block';
        payButton.style.pointerEvents = 'none';
        
        // 2. Show the site-wide full-page loader ("Processing...")
        if (loaderText) loaderText.textContent = "Processing...";
        pageLoaderOverlay.classList.add('active');
        
        try {
            // 3. Initiate Order Creation Request
            const response = await fetch("/create-order", {
                method: "POST",
                credentials: "include",
            });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error("Unauthorized (401): You are not logged in or your session has expired.");
                }
                throw new Error(`Server Error (${response.status})`);
            }

            const order = await response.json();

            // 4. Setup Razorpay Options customized for the site's aesthetic
            const options = {
                // We will look for the key in the order response, a window global, or fallback to the test key.
                key: order.key || window.RAZORPAY_KEY_ID || "rzp_live_StWdaDbr2hsk3Q",
                amount: order.amount,
                currency: order.currency,
                order_id: order.id,
                name: "EduStreamiX",
                description: "Grade 11 Classroom Access",
                image: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png", // Nice academic cap icon for the popup
                
                // Force an IMMEDIATE and EXCLUSIVE UPI QR Code display
                config: {
                    display: {
                        blocks: {
                            qr_only: {
                                name: "Scan to Pay",
                                instruments: [
                                    {
                                        method: "upi",
                                        flows: ["qr"] // Forces only the QR code to appear, skipping the UPI app list or VPA entry
                                    }
                                ]
                            }
                        },
                        sequence: ["block.qr_only"],
                        preferences: {
                            show_default_blocks: false
                        }
                    }
                },
                
                // Pre-fill user details and make them non-editable
                prefill: {
                    contact: "9099097528"
                },
                readonly: {
                    contact: true
                },

                theme: {
                    color: "#0952A5",
                    backdrop_color: "rgba(26, 26, 26, 0.85)" // Dark overlay behind the Razorpay modal
                },
                modal: {
                    ondismiss: function() {
                        // Triggers when user cancels/closes the Razorpay popup in the middle
                        if (loaderText) {
                            loaderText.textContent = "Cancelling...";
                        }
                        // Let it show "Cancelling..." for a moment, then fade out back to "Pay ₹10 Now"
                        setTimeout(() => {
                            resetButtonState();
                        }, 800);
                    }
                },

                handler: async function(response) {
                    pageLoaderOverlay.classList.add('active');
                    if (loaderText) {
                        loaderText.textContent = "Verifying Payment...";
                    }
                    try {
                        const verifyResponse = await fetch(
                            "/verify-payment",
                            {
                                method: "POST",

                                credentials: "include",

                                headers: {
                                    "Content-Type": "application/json"
                                },

                                body: JSON.stringify(response)
                            }
                        );
                        if (!verifyResponse.ok) {
                            throw new Error(
                                `Verification failed with status: ${verifyResponse.status}`
                            );
                        }

                        const data = await verifyResponse.json();
                        console.log("Verification Response:", data);

                        pageLoaderOverlay.classList.remove('active');
                        lockIcon.textContent = '🔓';
                        lockIcon.style.background = 'var(--ink-green)';
                        paymentTitle.textContent = 'Welcome Aboard!';
                        paymentDesc.textContent =
                            'Payment successful. Get ready to stream your classes!';
                        priceBadge.style.display = 'none';
                        btnSpinner.style.display = 'none';
                        btnText.style.display = 'block';
                        btnText.textContent = 'Unlocked!';
                        payButton.style.background = 'var(--ink-blue)';

                        // Wait a few seconds for the user to read the success message
                        setTimeout(() => {
                            // Apply a strong CSS-based fade-out class to override any existing styles
                            document.body.classList.add('fade-out-page');

                            // Once fade out is complete, redirect to the home page
                            setTimeout(() => {
                                window.location.href = "/";
                            }, 800);
                        }, 2500);
                    } catch (err) {
                        console.error("Verification Error:", err);
                        alert(
                            "Payment verification failed. Please contact support."
                        );
                        resetButtonState();
                    }
                }
            };

            const rzp = new Razorpay(options);

            // Handle if the user closes the payment window or it fails
            rzp.on('payment.failed', function (response){
                console.error("Payment Failed:", response.error);
                alert("Payment Failed: " + response.error.description);
                resetButtonState();
            });

            // We intentionally do NOT hide the pageLoaderOverlay here.
            // It will remain active in the background ("Processing...") while the Razorpay modal sits on top.

            // Open the Razorpay checkout overlay
            rzp.open();
            
        } catch (error) {
            alert("Could not initiate payment. Ensure backend server is running and configured correctly.");
            resetButtonState();
        }
    });

    // Helper to revert UI state if something fails or is canceled
    function resetButtonState() {
        pageLoaderOverlay.classList.remove('active');
        btnSpinner.style.display = 'none';
        btnText.style.display = 'block';
        payButton.style.pointerEvents = 'auto';
        if (loaderText) loaderText.textContent = "Processing...";
    }
});
