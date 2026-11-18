const fs = require("fs/promises");
const path = require("path");
// the package's index runs a self-test when required directly; use its library file
const pdfParse = require("pdf-parse/lib/pdf-parse.js");
const { resumeSkills } = require("./skills");

const MAX_BYTES = 5 * 1024 * 1024;

// Reads a resume PDF from its URL: our own uploads folder, or any https URL
// (cloud storage in production).
const readResume = async (url) => {
    const name = String(url).split("/uploads/")[1];
    if (name && !name.includes("..")) {
        const local = path.join(__dirname, "..", "uploads", path.basename(decodeURIComponent(name)));
        try {
            return await fs.readFile(local);
        } catch {
            // not on this server: fetch it below
        }
    }
    if (!/^https?:\/\//i.test(url)) throw new Error("Resume link is not a URL");
    const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
    if (!res.ok) throw new Error(`Could not download the resume (${res.status})`);
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length > MAX_BYTES) throw new Error("Resume is larger than 5 MB");
    return buffer;
};

// Text and skills of a resume PDF.
exports.parseResume = async (url) => {
    const buffer = await readResume(url);
    if (buffer.subarray(0, 5).toString() !== "%PDF-") throw new Error("Resume is not a PDF");
    const { text } = await pdfParse(buffer);
    return { text, skills: resumeSkills(text) };
};

// Re-reads the user's resume and saves its skills. Never throws: a resume we
// cannot read just means no match scores yet.
exports.refreshResumeSkills = async (user) => {
    try {
        if (!user.resume) {
            user.resumeSkills = undefined;
            user.resumeParsedAt = undefined;
        } else {
            const { skills } = await exports.parseResume(user.resume);
            user.resumeSkills = skills;
            user.resumeParsedAt = new Date();
        }
        await user.save();
        return { ok: true, skills: user.resumeSkills || [] };
    } catch (error) {
        console.error("resume parse failed:", error.message);
        return { ok: false, error: error.message };
    }
};
