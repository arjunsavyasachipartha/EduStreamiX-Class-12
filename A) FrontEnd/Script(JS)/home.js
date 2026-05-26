(function () {
    'use strict';

    // Prevent scroll restoration
    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);

    // Elements
    const brandHeading      = document.getElementById('brandHeading');
    const highlightTarget   = document.getElementById('highlightTarget');
    const subtitle          = document.querySelector('.brand-subtitle');
    const heroBadge         = document.querySelector('.hero-badge');
    const primaryHero       = document.getElementById('primaryHero');
    const boardContainer    = document.getElementById('boardSelectionContainer');
    const continueBtn       = document.getElementById('continueBtn');
    const logosRow          = document.querySelector('.logos-row');

    // Helper: Recursively wrap letters inside elements in spans of class 'char'
    function wrapTextInSpans(element) {
        const nodes = Array.from(element.childNodes);
        nodes.forEach(node => {
            if (node.nodeType === Node.TEXT_NODE) {
                const text = node.textContent;
                // Skip empty newline/whitespace nodes
                if (!text.trim() && text.includes('\n')) return;
                
                const fragment = document.createDocumentFragment();
                for (let i = 0; i < text.length; i++) {
                    const char = text[i];
                    if (char === ' ') {
                        fragment.appendChild(document.createTextNode(' '));
                    } else {
                        const span = document.createElement('span');
                        span.textContent = char;
                        span.className = 'char';
                        fragment.appendChild(span);
                    }
                }
                node.parentNode.replaceChild(fragment, node);
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                wrapTextInSpans(node);
            }
        });
    }

    // The user requested to play the long typing animation EVERY time they visit the site.
    // (No skipping to board selection directly)

    // Initialize typewriter preparation
    if (brandHeading) {
        // Hide the heading to completely prevent any "Flash of Unstyled Content"
        brandHeading.style.opacity = '0';
        
        wrapTextInSpans(brandHeading);
        
        // Once wrapped in hidden spans, it's safe to reveal the container
        brandHeading.style.opacity = '1';
        
        const chars = brandHeading.querySelectorAll('.char');
        let charIndex = 0;
        const typingSpeed = 95; // ms per letter

        // Typing loop function
        const typeNextChar = () => {
            if (charIndex < chars.length) {
                // Trigger logo fade-in once 40% of characters have been typed
                const threshold = Math.floor(chars.length * 0.4);
                if (charIndex === threshold && logosRow) {
                    logosRow.classList.add('show');
                }

                chars[charIndex].classList.add('typed');
                charIndex++;
                setTimeout(typeNextChar, typingSpeed + (Math.random() * 24 - 12));
            } else {
                finishTypingBrand();
            }
        };

        // Start typing immediately after a short load buffer (500ms)
        setTimeout(typeNextChar, 500);
    }

    function finishTypingBrand() {
        // Show the hero-badge and the subtitle
        if (heroBadge) {
            heroBadge.classList.add('show');
        }
        if (subtitle) {
            subtitle.classList.add('show');
        }

        // Trigger highlighter drawing shortly after subtitle has faded in
        setTimeout(() => {
            if (highlightTarget) {
                highlightTarget.classList.add('active');
            }
        }, 150);

        // Show videos ad after subtitle finishes animating
        setTimeout(() => {
            const videosAd = document.getElementById('videosAd');
            if (videosAd) {
                videosAd.classList.add('show');
            }
        }, 800);

        // Transition starts a bit later to let users read the ad
        setTimeout(transitionToBoardSelection, 3000);
    }

    function transitionToBoardSelection() {
        if (primaryHero && boardContainer) {
            // Slowly fade out primary hero in 5 seconds
            primaryHero.classList.add('fade-out');
            
            // Wait until 60% of the fade is out (3 seconds of 5 seconds) to start fading in board selection
            setTimeout(() => {
                boardContainer.classList.add('fade-in');
            }, 3000);
        }
    }

    // --- BOARD SELECTION LOGIC ---
    const boardCards = document.querySelectorAll('.board-card');
    const boardInput = document.getElementById('selectedBoardInput');

    boardCards.forEach(card => {
        card.addEventListener('click', () => {
            // Clear current selection
            boardCards.forEach(c => c.classList.remove('selected'));
            
            // Select clicked card
            card.classList.add('selected');
            const boardValue = card.dataset.value;
            
            if (boardInput) {
                boardInput.value = boardValue;
            }
            
            // Visual feedback on the board selection container
            if (boardContainer) {
                boardContainer.style.pointerEvents = 'none';
            }
            
            // Show page loader overlay
            const pageLoaderOverlay = document.getElementById('pageLoaderOverlay');
            if (pageLoaderOverlay) {
                pageLoaderOverlay.classList.add('active');
            }
            
            // Redirect to study path after a small delay to allow animation to start
            setTimeout(() => {
                window.location.href = `/study?grade=11&board=${encodeURIComponent(boardValue)}`;
            }, 400);
        });
    });

    // Reset UI state when user navigates back to this page
    window.addEventListener('pageshow', () => {
        const pageLoaderOverlay = document.getElementById('pageLoaderOverlay');
        if (pageLoaderOverlay) {
            pageLoaderOverlay.classList.remove('active');
        }
        if (boardContainer) {
            boardContainer.style.pointerEvents = '';
        }
        boardCards.forEach(c => c.classList.remove('selected'));
        if (boardInput) {
            boardInput.value = '';
        }
    });

})();