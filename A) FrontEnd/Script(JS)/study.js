document.addEventListener('DOMContentLoaded', () => {
    const subjectCards = document.querySelectorAll('.subject-card');
    
    // Containers
    const subjectsGrid = document.getElementById('subjectsGrid');
    const unitsView = document.getElementById('unitsView');
    const chaptersView = document.getElementById('chaptersView');
    const resourceView = document.getElementById('resourceView');
    
    // Grids / Containers
    const unitsGrid = document.getElementById('unitsGrid');
    const chaptersGrid = document.getElementById('chaptersGrid');
    const videoContainer = document.getElementById('videoContainer');
    const videoControls = document.getElementById('videoControls');
    const videoStatus = document.getElementById('videoStatus');
    
    // Headers / Texts
    const pageTitle = document.querySelector('.page-header .title');
    const pageSubtitle = document.querySelector('.page-header .subtitle');
    const mainActions = document.getElementById('mainActions');

    // Buttons
    const backToSubjectsBtn = document.getElementById('backToSubjectsBtn');
    const backToUnitsBtn = document.getElementById('backToUnitsBtn');
    const backToPreviousBtn = document.getElementById('backToPreviousBtn');
    const prevVideoBtn = document.getElementById('prevVideoBtn');
    const nextVideoBtn = document.getElementById('nextVideoBtn');
    
    const syllabusData = window.SYLLABUS_DATA || [];
    
    let currentSubjectName = "";
    let currentUnitData = null;
    let resourceReturnView = ""; // 'units' or 'chapters'
    
    let currentVideoLinks = [];
    let currentVideoIndex = 0;

    subjectCards.forEach(card => {
        card.addEventListener('click', () => {
            const subjectName = card.getAttribute('data-subject');
            card.style.transform = 'scale(0.95)';
            setTimeout(() => {
                card.style.transform = '';
                openSubject(subjectName);
            }, 150);
        });
    });

    backToSubjectsBtn.addEventListener('click', () => {
        unitsView.style.display = 'none';
        subjectsGrid.style.display = 'grid';
        mainActions.style.display = 'flex';
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
        pageTitle.textContent = 'Your Subjects';
        pageSubtitle.textContent = 'Select a subject to dive into the syllabus.';
    });

    backToUnitsBtn.addEventListener('click', () => {
        chaptersView.style.display = 'none';
        unitsView.style.display = 'block';
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
        pageTitle.textContent = currentSubjectName;
        pageSubtitle.textContent = 'Select a unit or chapter to begin learning.';
    });

    backToPreviousBtn.addEventListener('click', () => {
        // Stop video playback by clearing iframe
        videoContainer.innerHTML = '';
        
        resourceView.style.display = 'none';
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        if (resourceReturnView === 'chapters') {
            chaptersView.style.display = 'block';
            pageTitle.textContent = currentUnitData ? currentUnitData.name : currentSubjectName;
            pageSubtitle.textContent = 'Select a chapter to watch the video.';
        } else {
            unitsView.style.display = 'block';
            pageTitle.textContent = currentSubjectName;
            pageSubtitle.textContent = 'Select a unit or chapter to begin learning.';
        }
    });

    prevVideoBtn.addEventListener('click', () => {
        if (currentVideoIndex > 0) {
            currentVideoIndex--;
            renderVideo();
        }
    });

    nextVideoBtn.addEventListener('click', () => {
        if (currentVideoIndex < currentVideoLinks.length - 1) {
            currentVideoIndex++;
            renderVideo();
        }
    });

    function getEmbedUrl(youtubeUrl) {
        if (!youtubeUrl) return "";
        let videoId = "";
        
        if (youtubeUrl.includes("youtu.be/")) {
            videoId = youtubeUrl.split("youtu.be/")[1]?.split("?")[0];
        } else if (youtubeUrl.includes("watch?v=")) {
            videoId = youtubeUrl.split("watch?v=")[1]?.split("&")[0];
        } else if (youtubeUrl.includes("embed/")) {
            videoId = youtubeUrl.split("embed/")[1]?.split("?")[0];
        }
        
        if (videoId) {
            return `https://www.youtube.com/embed/${videoId}`;
        }
        return youtubeUrl; // fallback
    }

    function countVideos(resources) {
        if (!resources) return 0;
        return resources.reduce((acc, curr) => acc + (curr.link ? curr.link.length : 0), 0);
    }

    function getAllLinks(resources) {
        if (!resources) return [];
        let links = [];
        resources.forEach(res => {
            if (res.link && Array.isArray(res.link)) {
                links = links.concat(res.link);
            }
        });
        return links;
    }

    function openSubject(subjectName) {
        currentSubjectName = subjectName;
        const subjectData = syllabusData.find(item => item.subject === subjectName);
        if (!subjectData) return;

        subjectsGrid.style.display = 'none';
        mainActions.style.display = 'none';
        unitsView.style.display = 'block';
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
        pageTitle.textContent = subjectName;
        pageSubtitle.textContent = 'Select a unit or chapter to begin learning.';

        unitsGrid.innerHTML = '';

        const itemsList = subjectData.units || subjectData.type || [];

        if (itemsList.length === 0) {
            unitsGrid.innerHTML = `
                <div class="no-data">
                    <p>No units found for this subject.</p>
                </div>
            `;
            return;
        }

        itemsList.forEach((item, index) => {
            const unitCard = document.createElement('div');
            unitCard.className = 'unit-card';
            unitCard.style.animationDelay = `${index * 0.05}s`;

            let subtext = '';
            let hasChapters = item.chapters && item.chapters.length > 0;
            
            if (hasChapters) {
                subtext = `${item.chapters.length} Chapter${item.chapters.length > 1 ? 's' : ''}`;
            } else {
                let vCount = countVideos(item.resources);
                subtext = `${vCount} Video${vCount !== 1 ? 's' : ''}`;
            }

            unitCard.innerHTML = `
                <div class="unit-number">
                    <span>${String(index + 1).padStart(2, '0')}</span>
                </div>
                <div class="unit-content">
                    <h3 class="unit-name">${item.name}</h3>
                    <p class="unit-meta">${subtext}</p>
                </div>
                <div class="unit-action">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                </div>
            `;

            unitCard.addEventListener('click', () => {
                unitCard.style.transform = 'translate(-2px, -2px) scale(0.98)';
                setTimeout(() => {
                    unitCard.style.transform = '';
                    currentUnitData = item;
                    
                    if (hasChapters) {
                        openChapters(item);
                    } else {
                        let links = getAllLinks(item.resources);
                        if (links.length > 0) {
                            resourceReturnView = 'units';
                            openResource(links, item.name);
                        } else {
                            alert("No chapters or resources available for this unit.");
                        }
                    }
                }, 150);
            });

            unitsGrid.appendChild(unitCard);
        });
    }

    function openChapters(unitData) {
        unitsView.style.display = 'none';
        chaptersView.style.display = 'block';
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
        pageTitle.textContent = unitData.name;
        pageSubtitle.textContent = 'Select a chapter to watch the video.';

        chaptersGrid.innerHTML = '';

        unitData.chapters.forEach((chapter, index) => {
            const chapterCard = document.createElement('div');
            chapterCard.className = 'chapter-card';
            chapterCard.style.animationDelay = `${index * 0.05}s`;
            
            let vCount = countVideos(chapter.resources);
            let subtext = `${vCount} Video${vCount !== 1 ? 's' : ''}`;

            chapterCard.innerHTML = `
                <div class="chapter-content">
                    <h3 class="chapter-name">${chapter.name}</h3>
                    <p class="unit-meta">${subtext}</p>
                </div>
                <div class="unit-action">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                </div>
            `;

            chapterCard.addEventListener('click', () => {
                chapterCard.style.transform = 'translate(-2px, -2px) scale(0.98)';
                setTimeout(() => {
                    chapterCard.style.transform = '';
                    let links = getAllLinks(chapter.resources);
                    if (links.length > 0) {
                        resourceReturnView = 'chapters';
                        openResource(links, chapter.name);
                    } else {
                        alert("No video resource available for this chapter.");
                    }
                }, 150);
            });

            chaptersGrid.appendChild(chapterCard);
        });
    }

    function openResource(links, titleName) {
        currentVideoLinks = links;
        currentVideoIndex = 0;

        unitsView.style.display = 'none';
        chaptersView.style.display = 'none';
        resourceView.style.display = 'block';

        window.scrollTo({ top: 0, behavior: 'smooth' });
        pageTitle.textContent = titleName;
        pageSubtitle.textContent = 'Enjoy the lesson!';

        renderVideo();
    }
    
    function renderVideo() {
        if (currentVideoLinks.length === 0) return;
        
        const videoLink = currentVideoLinks[currentVideoIndex];
        const embedUrl = getEmbedUrl(videoLink);
        
        videoContainer.innerHTML = `
            <iframe 
                src="${embedUrl}?autoplay=1&rel=0&enablejsapi=1" 
                title="Video Player" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen>
            </iframe>
        `;
        
        if (currentVideoLinks.length > 1) {
            videoControls.style.display = 'flex';
            videoStatus.textContent = `Video ${currentVideoIndex + 1} of ${currentVideoLinks.length}`;
            prevVideoBtn.disabled = currentVideoIndex === 0;
            nextVideoBtn.disabled = currentVideoIndex === currentVideoLinks.length - 1;
        } else {
            videoControls.style.display = 'none';
        }
    }

    // TEST CONFIGURATION MODAL LOGIC
    
    const testModal = document.getElementById('testModal');
    const testModalDesc = document.getElementById('testModalDesc');
    const cancelTestBtn = document.getElementById('cancelTestBtn');
    const startTestBtn = document.getElementById('startTestBtn');
    const testTriggers = document.querySelectorAll('.btn-test-trigger');
    const pillGroups = document.querySelectorAll('.pill-group');
    const mcqConfigSection = document.getElementById('mcqConfigSection');
    const sscConfigSection = document.getElementById('sscConfigSection');
    
    const isSSC = window.BOARD_NAME === 'SSC';
    let currentTestMode = isSSC ? 'theory' : 'mcq';
    let currentTestContext = 'subject';
    let currentResourceTitle = '';

    const originalOpenResource = openResource;
    openResource = function(links, titleName) {
        currentResourceTitle = titleName;
        originalOpenResource(links, titleName);
    };

    function openTestModal(contextLevel) {
        if (!testModal) return;
        currentTestContext = contextLevel;

        if (isSSC) {
            currentTestMode = 'theory';
            mcqConfigSection.style.display = 'none';
            sscConfigSection.style.display = '';
            testModalDesc.textContent = 'Select the difficulty and question type for your theory test.';
        } else {
            currentTestMode = 'mcq';
            mcqConfigSection.style.display = '';
            sscConfigSection.style.display = 'none';
            testModalDesc.textContent = 'Select the difficulty and length of your test.';
        }

        testModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeTestModal() {
        if (!testModal) return;
        testModal.classList.remove('active');
        document.body.style.overflow = '';
        startTestBtn.textContent = 'Start Test';
        startTestBtn.disabled = false;
    }

    testTriggers.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const ctx = btn.getAttribute('data-context') || 'subject';

            if (isSSC && ctx !== 'subject') return;

            openTestModal(ctx);
        });

        if (isSSC) {
            const ctx = btn.getAttribute('data-context') || 'subject';
            if (ctx === 'unit' || ctx === 'chapter') {
                const container = btn.closest('.test-suggestion-container');
                if (container) {
                    container.style.display = 'none';
                } else {
                    btn.style.display = 'none';
                }
            }
        }
    });

    cancelTestBtn?.addEventListener('click', closeTestModal);

    testModal?.addEventListener('click', (e) => {
        if (e.target === testModal) closeTestModal();
    });

    pillGroups.forEach(group => {
        const pills = group.querySelectorAll('.config-pill');
        pills.forEach(pill => {
            pill.addEventListener('click', () => {
                pills.forEach(p => p.classList.remove('selected'));
                pill.classList.add('selected');
            });
        });
    });

    function buildFocusTopic(contextLevel) {
        let topic = currentSubjectName;
        const subjectData = syllabusData.find(item => item.subject === currentSubjectName);
        if (!subjectData) return topic;

        if (contextLevel === 'subject') {
            const unitsList = subjectData.units || subjectData.type || [];
            let details = [];
            unitsList.forEach(u => {
                let unitStr = u.name;
                if (u.chapters && u.chapters.length > 0) {
                    const chapterNames = u.chapters.map(c => c.name).join(", ");
                    unitStr += ` (Chapters: ${chapterNames})`;
                }
                details.push(unitStr);
            });
            if (details.length > 0) topic += `\nUnits covered:\n- ` + details.join("\n- ");
        } 
        else if (contextLevel === 'unit' && currentUnitData) {
            topic += ` - ${currentUnitData.name}`;
            if (currentUnitData.chapters && currentUnitData.chapters.length > 0) {
                const chapterNames = currentUnitData.chapters.map(c => c.name).join(", ");
                topic += `\nChapters covered: ${chapterNames}`;
            }
        } 
        else if (contextLevel === 'chapter') {
            if (currentUnitData) topic += ` - ${currentUnitData.name}`;
            if (currentResourceTitle) topic += ` - ${currentResourceTitle}`;
        }

        return topic;
    }

    // Start Test Logic
    startTestBtn?.addEventListener('click', async () => {
        const diffPill = document.querySelector('#difficultyGroup .config-pill.selected');
        const difficulty = diffPill ? diffPill.getAttribute('data-value') : 'easy';

        let payload = {
            board: window.BOARD_NAME,
            grade: window.GRADE,
            subject: currentSubjectName,
            difficulty: difficulty
        };

        if (currentTestMode === 'theory') {
            // SSC theory mode
            const typePill = document.querySelector('#questionTypeGroup .config-pill.selected');
            payload.testMode = 'theory';
            payload.questionType = typePill ? typePill.getAttribute('data-value') : 'short';
        } else {
            // MCQ mode
            const countPill = document.querySelector('#questionsGroup .config-pill.selected');
            payload.testMode = 'mcq';
            payload.numQuestions = countPill ? countPill.getAttribute('data-value') : '5';
            payload.focusTopic = buildFocusTopic(currentTestContext);
        }

        startTestBtn.textContent = 'Generating...';
        startTestBtn.disabled = true;

        try {
            const response = await fetch('/study/generate-test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('Network response was not ok');

            const data = await response.json();
            closeTestModal();
            openTestView(data.questions, data.avgTimeSeconds, currentSubjectName, data.testMode || currentTestMode);
        } catch (error) {
            console.error("Error generating test:", error);
            alert("Failed to generate test. Please try again later.");
            startTestBtn.textContent = 'Start Test';
            startTestBtn.disabled = false;
        }
    });

    // TEST ENGINE

    const testViewOverlay = document.getElementById('testViewOverlay');
    const testViewLabel   = document.getElementById('testViewLabel');
    const timerArc        = document.getElementById('timerArc');
    const timerDigits     = document.getElementById('timerDigits');
    const testProgressFill  = document.getElementById('testProgressFill');
    const testProgressLabel = document.getElementById('testProgressLabel');
    const questionText    = document.getElementById('questionText');
    const optionsGrid     = document.getElementById('optionsGrid');
    const answerTextarea  = document.getElementById('answerTextarea');
    const marksBadge      = document.getElementById('marksBadge');
    const evaluatingOverlay = document.getElementById('evaluatingOverlay');
    const prevQBtn        = document.getElementById('prevQBtn');
    const nextQBtn        = document.getElementById('nextQBtn');
    const endTestBtn      = document.getElementById('endTestBtn');
    const timeUpModal     = document.getElementById('timeUpModal');
    const continueTestBtn = document.getElementById('continueTestBtn');
    const submitTestBtn   = document.getElementById('submitTestBtn');
    const resultsModal    = document.getElementById('resultsModal');
    const resultsArc      = document.getElementById('resultsArc');
    const resultsPct      = document.getElementById('resultsPct');
    const resultsTitle    = document.getElementById('resultsTitle');
    const resultsStat     = document.getElementById('resultsStat');
    const resultsBreakdown = document.getElementById('resultsBreakdown');
    const closeResultsBtn = document.getElementById('closeResultsBtn');

    const TIMER_CIRCUMFERENCE = 163.36; // 2π × 26
    const RESULTS_CIRCUMFERENCE = 213.6; // 2π × 34

    let testQuestions = [];
    let testAnswers   = [];   // MCQ: null|number, Theory: string
    let currentQIndex = 0;
    let timerInterval = null;
    let timerSecondsLeft = 0;
    let timerTotalSeconds = 0;
    let activeTestMode = 'mcq'; // 'mcq' or 'theory'

    function openTestView(questions, avgTimeSeconds, subjectName, testMode) {
        activeTestMode = testMode || 'mcq';
        testQuestions = questions;
        testAnswers = activeTestMode === 'theory'
            ? new Array(questions.length).fill('')
            : new Array(questions.length).fill(null);
        currentQIndex = 0;
        timerTotalSeconds  = avgTimeSeconds || questions.length * 60;
        timerSecondsLeft   = timerTotalSeconds;

        const iframe = videoContainer.querySelector('iframe');
        if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage(
                JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }),
                '*'
            );
        }

        testViewLabel.textContent = `${subjectName} — ${questions.length} Questions`;
        testViewOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';

        renderQuestion(0);
        startTimer();
    }

    function closeTestView() {
        testViewOverlay.classList.remove('active');
        document.body.style.overflow = '';
        stopTimer();
    }

    function startTimer() {
        stopTimer();
        updateTimerDisplay();
        timerInterval = setInterval(() => {
            timerSecondsLeft--;
            updateTimerDisplay();
            if (timerSecondsLeft <= 0) {
                stopTimer();
                showTimeUpDialog();
            }
        }, 1000);
    }

    function stopTimer() {
        if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
    }

    function updateTimerDisplay() {
        const mins = Math.floor(timerSecondsLeft / 60);
        const secs = timerSecondsLeft % 60;
        timerDigits.textContent = `${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;

        const fraction = timerSecondsLeft / timerTotalSeconds;
        timerArc.style.strokeDashoffset = TIMER_CIRCUMFERENCE * (1 - fraction);

        timerArc.classList.remove('warning','danger');
        if (fraction <= 0.2)       timerArc.classList.add('danger');
        else if (fraction <= 0.4)  timerArc.classList.add('warning');
    }

    function showTimeUpDialog() {
        timeUpModal.classList.add('active');
    }

    continueTestBtn?.addEventListener('click', () => {
        timeUpModal.classList.remove('active');
    });

    submitTestBtn?.addEventListener('click', () => {
        timeUpModal.classList.remove('active');
        finishTest();
    });

    function saveCurrentTheoryAnswer() {
        if (activeTestMode === 'theory' && answerTextarea) {
            testAnswers[currentQIndex] = answerTextarea.value;
        }
    }

    function renderQuestion(index) {
        const q = testQuestions[index];
        const total = testQuestions.length;

        const progressPct = ((index) / total) * 100;
        testProgressFill.style.width = `${progressPct}%`;
        testProgressLabel.textContent = `Question ${index + 1} of ${total}`;

        questionText.textContent = q.question;

        if (activeTestMode === 'theory') {
            optionsGrid.style.display = 'none';
            optionsGrid.innerHTML = '';
            answerTextarea.style.display = '';
            answerTextarea.value = testAnswers[index] || '';
            answerTextarea.focus();

            marksBadge.style.display = '';
            marksBadge.textContent = `${q.marks} mark${q.marks > 1 ? 's' : ''}`;
        } else {
            answerTextarea.style.display = 'none';
            marksBadge.style.display = 'none';
            optionsGrid.style.display = '';
            optionsGrid.innerHTML = '';
            const letters = ['A','B','C','D'];
            const answered = testAnswers[index];

            q.options.forEach((opt, i) => {
                const btn = document.createElement('button');
                btn.className = 'option-btn';
                btn.innerHTML = `<span class="option-letter">${letters[i]}</span><span>${opt}</span>`;

                if (answered !== null) {
                    btn.disabled = true;
                    if (i === q.correctAnswerIndex) btn.classList.add('correct');
                    if (i === answered && answered !== q.correctAnswerIndex) btn.classList.add('wrong');
                } else {
                    btn.addEventListener('click', () => selectAnswer(index, i));
                }

                optionsGrid.appendChild(btn);
            });

            if (answered !== null) {
                const exp = document.createElement('p');
                exp.className = 'option-explanation';
                exp.textContent = `💡 ${q.explanation}`;
                optionsGrid.appendChild(exp);
            }
        }

        prevQBtn.disabled = index === 0;
        nextQBtn.textContent = index === total - 1 ? 'Submit →' : 'Next →';
    }

    function selectAnswer(qIndex, optIndex) {
        if (testAnswers[qIndex] !== null) return;
        testAnswers[qIndex] = optIndex;
        renderQuestion(qIndex);
    }

    prevQBtn?.addEventListener('click', () => {
        saveCurrentTheoryAnswer();
        if (currentQIndex > 0) {
            currentQIndex--;
            renderQuestion(currentQIndex);
        }
    });

    nextQBtn?.addEventListener('click', () => {
        saveCurrentTheoryAnswer();
        if (currentQIndex < testQuestions.length - 1) {
            currentQIndex++;
            renderQuestion(currentQIndex);
        } else {
            finishTest();
        }
    });

    endTestBtn?.addEventListener('click', () => {
        saveCurrentTheoryAnswer();
        finishTest();
    });

    async function finishTest() {
        stopTimer();
        saveCurrentTheoryAnswer();

        if (activeTestMode === 'theory') {
            await finishTheoryTest();
        } else {
            finishMcqTest();
        }
    }

    function finishMcqTest() {
        closeTestView();

        let correct = 0;
        testAnswers.forEach((ans, i) => {
            if (ans === testQuestions[i].correctAnswerIndex) correct++;
        });

        const total   = testQuestions.length;
        const pct     = Math.round((correct / total) * 100);
        const skipped = testAnswers.filter(a => a === null).length;

        resultsPct.textContent = `${pct}%`;
        resultsTitle.textContent = pct === 100 ? '🎉 Perfect Score!' : pct >= 70 ? '👍 Well Done!' : pct >= 40 ? '📖 Keep Practising!' : '💪 Keep Going!';
        resultsStat.textContent = `${correct} correct · ${total - correct - skipped} wrong · ${skipped} skipped · out of ${total}`;

        animateResultsArc(pct);

        resultsBreakdown.innerHTML = '';
        testQuestions.forEach((q, i) => {
            const ans = testAnswers[i];
            const isCorrect = ans === q.correctAnswerIndex;
            const isSkipped = ans === null;

            const item = document.createElement('div');
            item.className = `breakdown-item ${isSkipped ? 'skipped-item' : isCorrect ? 'correct-item' : 'wrong-item'}`;

            const icon = isSkipped ? '⬜' : isCorrect ? '✅' : '❌';
            const letters = ['A','B','C','D'];
            const yourAns = isSkipped ? 'Skipped' : `Your answer: ${letters[ans]} — ${q.options[ans]}`;
            const correctAns = isCorrect ? '' : `Correct: ${letters[q.correctAnswerIndex]} — ${q.options[q.correctAnswerIndex]}`;

            item.innerHTML = `
                <p class="breakdown-q">${icon} Q${i+1}: ${q.question}</p>
                <p class="breakdown-a">${yourAns}${correctAns ? ' · ' + correctAns : ''}</p>
            `;
            resultsBreakdown.appendChild(item);
        });

        resultsModal.classList.add('active');
    }

    async function finishTheoryTest() {
        // Show evaluating overlay
        evaluatingOverlay.style.display = 'flex';

        const evalPayload = testQuestions.map((q, i) => ({
            question: q.question,
            idealAnswer: q.idealAnswer,
            studentAnswer: testAnswers[i] || '',
            marks: q.marks
        }));

        try {
            const response = await fetch('/study/evaluate-theory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ questions: evalPayload })
            });

            if (!response.ok) throw new Error('Evaluation failed');

            const data = await response.json();
            const results = data.results || [];

            evaluatingOverlay.style.display = 'none';
            closeTestView();

            let totalMarks = 0, maxMarks = 0;
            results.forEach((r, i) => {
                totalMarks += r.marksAwarded || 0;
                maxMarks += r.maxMarks || testQuestions[i].marks || 0;
            });

            const pct = maxMarks > 0 ? Math.round((totalMarks / maxMarks) * 100) : 0;

            resultsPct.textContent = `${pct}%`;
            resultsTitle.textContent = pct >= 80 ? '🎉 Excellent!' : pct >= 60 ? '👍 Well Done!' : pct >= 40 ? '📖 Keep Practising!' : '💪 Keep Going!';
            resultsStat.textContent = `${totalMarks} / ${maxMarks} marks`;

            animateResultsArc(pct);

            resultsBreakdown.innerHTML = '';
            testQuestions.forEach((q, i) => {
                const r = results[i] || { marksAwarded: 0, maxMarks: q.marks, feedback: 'No evaluation available.' };
                const studentAns = testAnswers[i] || '';
                const isSkipped = !studentAns.trim();
                const isFull = r.marksAwarded === r.maxMarks;

                const item = document.createElement('div');
                item.className = `breakdown-item ${isSkipped ? 'skipped-item' : isFull ? 'correct-item' : 'wrong-item'}`;

                const icon = isSkipped ? '⬜' : isFull ? '✅' : r.marksAwarded > 0 ? '🟡' : '❌';

                item.innerHTML = `
                    <p class="breakdown-q">${icon} Q${i+1}: ${q.question}</p>
                    <p class="breakdown-a"><strong>${r.marksAwarded}/${r.maxMarks} marks</strong> — ${r.feedback}</p>
                    ${!isSkipped ? `<p class="breakdown-a" style="opacity:0.7;font-style:italic;">Your answer: ${studentAns.substring(0, 200)}${studentAns.length > 200 ? '...' : ''}</p>` : ''}
                `;
                resultsBreakdown.appendChild(item);
            });

            resultsModal.classList.add('active');

        } catch (error) {
            console.error("Error evaluating theory test:", error);
            evaluatingOverlay.style.display = 'none';
            alert("Failed to evaluate test. Please try again.");
            closeTestView();
        }
    }

    function animateResultsArc(pct) {
        const offset = RESULTS_CIRCUMFERENCE * (1 - pct / 100);
        resultsArc.style.strokeDashoffset = RESULTS_CIRCUMFERENCE;
        resultsArc.style.stroke = pct >= 70 ? 'var(--ink-green)' : pct >= 40 ? 'var(--ink-orange)' : 'var(--ink-red)';
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                resultsArc.style.strokeDashoffset = offset;
            });
        });
    }

    closeResultsBtn?.addEventListener('click', () => {
        resultsModal.classList.remove('active');
        document.body.style.overflow = '';
    });
});
