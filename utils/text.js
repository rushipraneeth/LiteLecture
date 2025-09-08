// Text utilities extracted from App for reuse across components


export const simpleExtractiveSummarizer = (text, sentenceCount = 3) => {
const stopwords = new Set([
'the','is','in','and','to','of','a','that','it','on','for','with','as','this','was','are','be','by','an','or','from','at','we','you','i'
]);
const sentences = text
.replace(/\n/g, ' ')
.split(/(?<=[.?!])\s+/)
.map((s) => s.trim())
.filter(Boolean);
if (sentences.length <= sentenceCount) return sentences.join(' ');


const freq = {};
text
.toLowerCase()
.replace(/[^a-z\s]/g, ' ')
.split(/\s+/)
.filter(Boolean)
.forEach((w) => {
if (stopwords.has(w)) return;
freq[w] = (freq[w] || 0) + 1;
});


const sentenceScores = sentences.map((s) => {
const words = s.toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(Boolean);
let score = 0;
words.forEach((w) => { if (freq[w]) score += freq[w]; });
return { s, score };
});


sentenceScores.sort((a, b) => b.score - a.score);
const top = sentenceScores.slice(0, sentenceCount).map((x) => x.s);
return top.join(' ');
};


export const generateFillInTheBlankQuestions = (text, count = 5) => {
const sentences = text
.replace(/\n/g, ' ')
.split(/(?<=[.?!])\s+/)
.map((s) => s.trim())
.filter((s) => s.length > 20);
if (sentences.length === 0) return [];


const wordsAll = text
.replace(/[^a-zA-Z\s]/g, ' ')
.split(/\s+/)
.filter((w) => w.length > 3)
.map((w) => w.trim());


const uniqueWords = Array.from(new Set(wordsAll)).slice(0, 200);


const qs = [];
for (let i = 0; i < Math.min(count, sentences.length); i++) {
const sent = sentences[i % sentences.length];
const words = sent.replace(/[^a-zA-Z\s]/g, ' ').split(/\s+/).filter((w) => w.length > 3);
if (!words.length) continue;
const candidate = words[Math.floor(Math.random() * words.length)];
const correct = candidate;
const distractors = [];
const pool = uniqueWords.filter((w) => w.toLowerCase() !== correct.toLowerCase());
for (let k = 0; k < 3 && pool.length; k++) {
const idx = Math.floor(Math.random() * pool.length);
distractors.push(pool.splice(idx, 1)[0]);
}
const options = [correct, ...distractors].sort(() => Math.random() - 0.5);
const questionText = sent.replace(new RegExp(`\\b${escapeRegExp(correct)}\\b`), '____');
qs.push({ id: i + 1, question: questionText, answer: correct, options, userAnswer: null, correctWord: correct });
}
return qs;
};


export const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&');