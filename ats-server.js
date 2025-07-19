import express from "express";
import multer from "multer";
import pdfParse from "pdf-parse";
import dotenv from "dotenv";
import axios from "axios";
import cors from "cors";

dotenv.config();
const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// Enable CORS for the Next.js frontend
app.use(cors());
app.use(express.json());

const getAtsAnalysis = async (resumeText, jobDescription) => {
    const prompt = `
    Act like an experienced ATS with expertise in software engineering, data science, and big data. 
    Evaluate the resume against the given job description. 
    Provide a JSON response in the format:
    {"JD Match":"%", "MissingKeywords":[], "Profile Summary":""}

    Resume: ${resumeText}
    Job Description: ${jobDescription}
    `;

    try {
        const response = await axios.post(
            "https://api.openai.com/v1/chat/completions",
            {
                model: "gpt-4",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.7,
            },
            {
                headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
            }
        );

        return response.data.choices[0].message.content;
    } catch (error) {
        console.error("Error fetching AI response:", error);
        return null;
    }
};

app.post("/upload", upload.single("resume"), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const resumeText = (await pdfParse(req.file.buffer)).text;
    const jobDescription = req.body.jobDescription;

    const atsResponse = await getAtsAnalysis(resumeText, jobDescription);
    if (!atsResponse) return res.status(500).json({ error: "AI processing failed" });

    try {
        // Handle case where response might not be valid JSON
        const parsedResponse = JSON.parse(atsResponse);
        res.json(parsedResponse);
    } catch (error) {
        console.error("Error parsing response:", error);
        res.status(500).json({ error: "Failed to parse AI response" });
    }
});

// Health check endpoint
app.get("/", (req, res) => {
    res.json({ status: "ATS Analysis server running" });
});

const PORT = process.env.ATS_SERVER_PORT || 5000;
app.listen(PORT, () => console.log(`ATS Server running on port ${PORT}`)); 