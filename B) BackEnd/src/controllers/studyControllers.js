const { getCollection } = require('../services/googleDriveService');

const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.getStudy = async (req, res) => {
    let grade = Number(req.query.grade); // ✅ Convert string → Number to match DB schema
    let board = req.query.board;
    try {
        let syllabus = null;

        if (board === 'SSC') {
            syllabus = await getCollection('SSC_Syllabi_Intermediate');
        } else if (board === 'CBSE') {
            syllabus = await getCollection('CBSE_Syllabi_Intermediate');
        } else if (board === 'ISC') {
            syllabus = await getCollection('ISC_Syllabi_Intermediate');
        } else {
            return res.status(400).send("Invalid board specified.");
        }

        syllabus = syllabus.filter(
            item => Number(item.grade) === grade
        );

        if (syllabus && syllabus.length > 0) {
            res.render('study', {
                studyGrade: grade,
                studyBoard: board,
                studySyllabus: syllabus
            });
        } else {
            // No data found — still render with empty array so EJS shows "No subjects found"
            res.render('study', {
                studyGrade: grade,
                studyBoard: board,
                studySyllabus: []
            });
        }
    } catch (err) { 
        console.error("Error fetching syllabus:", err);
        res.status(500).send("Internal Server Error");
    }
}

// Helper: strip markdown code fences from AI output
function stripCodeFences(text) {
    if (text.startsWith('```json')) {
        text = text.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (text.startsWith('```')) {
        text = text.replace(/^```/, '').replace(/```$/, '').trim();
    }
    return text;
}

// Question counts per theory question type
const THEORY_COUNTS = { very_short: 15, short: 10, long: 5 };

exports.generateTest = async (req, res) => {
    try {
        const { board, grade, subject, focusTopic, difficulty, numQuestions, testMode, questionType } = req.body;

        if (!board || !grade || !subject) {
            return res.status(400).json({ error: "Missing required test configuration parameters." });
        }

        let actualBoard = board;
        if (board === "SSC") {
            actualBoard = "Telangana SSC";
        }

        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
        let prompt;

        // ===== THEORY MODE (SSC) =====
        if (testMode === 'theory') {
            const qType = questionType || 'short';
            const count = THEORY_COUNTS[qType] || 10;

            const typeLabel = qType === 'very_short' ? 'Very Short Answer' : qType === 'short' ? 'Short Answer' : 'Long Answer';
            
            let marksPerQ = 1;
            const subLower = subject.toLowerCase();
            if (subLower.includes('maths iia') || subLower.includes('maths iib') || subLower.includes('maths ii a') || subLower.includes('maths ii b')) {
                marksPerQ = qType === 'very_short' ? 2 : qType === 'short' ? 4 : 7;
            } else if (subLower.includes('physics') || subLower.includes('chemistry') || subLower.includes('biology') || subLower.includes('botany') || subLower.includes('zoology')) {
                marksPerQ = qType === 'very_short' ? 2 : qType === 'short' ? 4 : 8;
            } else {
                // Default fallback
                marksPerQ = qType === 'very_short' ? 1 : qType === 'short' ? 2 : 5;
            }
            const answerGuidance = qType === 'very_short'
                ? 'Each answer should be 1-2 sentences.'
                : qType === 'short'
                    ? 'Each answer should be 3-5 sentences.'
                    : 'Each answer should be a detailed paragraph (8-12 sentences).';

            prompt = `You are an expert educational test generator for the Indian education system.
Generate a ${typeLabel} question paper based on **previous year Telangana SSC public examination papers** for the following:

- Board: ${actualBoard}
- Grade: ${grade}
- Subject: ${subject}
- Difficulty Level: ${difficulty || 'medium'}
- Question Type: ${typeLabel}
- Number of Questions: ${count}

IMPORTANT: The questions must be based on actual patterns and topics from previous year Telangana SSC board public examination question papers available publicly. Do NOT invent random questions. Model them after real exam questions.

${answerGuidance}

Also estimate the average total time (in seconds) a student of this grade level would need to complete all ${count} questions.

Return ONLY a valid JSON object (no markdown, no backticks, strictly parseable by JSON.parse()):
{
  "avgTimeSeconds": 900,
  "questions": [
    {
      "question": "Question text here",
      "idealAnswer": "The complete correct answer a student should write.",
      "marks": ${marksPerQ}
    }
  ]
}`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            let jsonText = stripCodeFences(response.text());

            try {
                const parsed = JSON.parse(jsonText);
                return res.status(200).json({
                    testMode: 'theory',
                    questionType: qType,
                    avgTimeSeconds: parsed.avgTimeSeconds || (count * 60),
                    questions: parsed.questions || []
                });
            } catch (parseError) {
                console.error("Error parsing Gemini theory output:", jsonText);
                return res.status(500).json({ error: "Failed to parse test data from AI.", rawOutput: jsonText });
            }
        }

        // ===== MCQ MODE (CBSE / ICSE / default) =====
        if (!focusTopic) {
            return res.status(400).json({ error: "Missing focusTopic for MCQ test." });
        }

        prompt = `You are an expert educational test generator for the Indian education system.
Create a multiple-choice question (MCQ) test based on the following curriculum parameters:

- Board: ${actualBoard}
- Grade: ${grade}
- Subject: ${subject}
- Focus Topic/Context: ${focusTopic}
- Difficulty Level: ${difficulty || 'medium'}
- Number of Questions: ${numQuestions || 5}

The questions should be appropriate for the specified grade level and board curriculum.
Also estimate the average total time (in seconds) a student of this grade level would need to thoughtfully complete all questions, considering the difficulty level.

Please return ONLY a valid JSON object (no markdown, no backticks, strictly parseable by JSON.parse()) with this exact shape:
{
  "avgTimeSeconds": 300,
  "questions": [
    {
      "question": "Question text here",
      "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
      "correctAnswerIndex": 0,
      "explanation": "Brief explanation of why the answer is correct."
    }
  ]
}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let jsonText = stripCodeFences(response.text());

        try {
            const parsed = JSON.parse(jsonText);
            return res.status(200).json({
                testMode: 'mcq',
                avgTimeSeconds: parsed.avgTimeSeconds || (parseInt(numQuestions || 5) * 60),
                questions: parsed.questions || parsed
            });
        } catch (parseError) {
            console.error("Error parsing Gemini MCQ output:", jsonText);
            return res.status(500).json({ error: "Failed to parse test data from AI.", rawOutput: jsonText });
        }

    } catch (err) {
        console.error("Error generating test:", err);
        return res.status(500).json({ error: "Internal server error while generating test." });
    }
};

// ===== BATCH EVALUATE THEORY ANSWERS =====
exports.evaluateTheoryTest = async (req, res) => {
    try {
        const { questions } = req.body;
        // questions: [{ question, idealAnswer, studentAnswer, marks, questionType }]

        if (!questions || !Array.isArray(questions) || questions.length === 0) {
            return res.status(400).json({ error: "No questions provided for evaluation." });
        }

        let questionsBlock = '';
        questions.forEach((q, i) => {
            questionsBlock += `
--- Question ${i + 1} (${q.marks} marks) ---
Question: ${q.question}
Ideal Answer: ${q.idealAnswer}
Student's Answer: ${q.studentAnswer || '(No answer provided)'}
`;
        });

        const prompt = `You are an expert examiner for the Indian education system (Telangana SSC board).
Evaluate the following student answers against the ideal answers. For each question, award marks out of the maximum and provide brief constructive feedback.

Be fair but strict. Award partial marks where the student demonstrates partial understanding. If the student left the answer blank, award 0 marks.

${questionsBlock}

Return ONLY a valid JSON object (no markdown, no backticks, strictly parseable by JSON.parse()):
{
  "results": [
    {
      "marksAwarded": 1,
      "maxMarks": 2,
      "feedback": "Brief feedback explaining the evaluation."
    }
  ]
}`;

        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let jsonText = stripCodeFences(response.text());

        try {
            const parsed = JSON.parse(jsonText);
            return res.status(200).json({ results: parsed.results || [] });
        } catch (parseError) {
            console.error("Error parsing Gemini evaluation output:", jsonText);
            return res.status(500).json({ error: "Failed to parse evaluation from AI.", rawOutput: jsonText });
        }

    } catch (err) {
        console.error("Error evaluating theory test:", err);
        return res.status(500).json({ error: "Internal server error while evaluating test." });
    }
};