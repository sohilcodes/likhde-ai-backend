const express = require("express");
const router = express.Router();
const Groq = require("groq-sdk");
const { freeLimiter } = require("../middleware/rateLimit");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const CONTENT_TYPES = {
  caption: {
    label: "Instagram Caption",
    prompt: (topic, tone, platform) =>
      `Tu ek top Indian social media content writer hai jo Hinglish mein likhta hai.
      
Topic: "${topic}"
Tone: ${tone}
Platform: ${platform}

Ek killer ${platform} caption likh Hinglish mein (Hindi + English mix).
Format:
- Hook line (attention grabbing)
- 3-4 lines body
- Call to action
- 5 relevant hashtags

Sirf caption de, koi explanation nahi.`,
  },
  hook: {
    label: "Video Hook",
    prompt: (topic, tone, platform) =>
      `Tu ek viral Indian content creator hai.

Topic: "${topic}"
Tone: ${tone}

5 different powerful video hooks likh Hinglish mein jo pehle 3 seconds mein viewer ko rok le.
Format: numbered list, har hook ek line ka.
Sirf hooks de, kuch aur nahi.`,
  },
  script: {
    label: "Short Video Script",
    prompt: (topic, tone, platform) =>
      `Tu ek experienced Indian YouTuber/Reels creator hai.

Topic: "${topic}"
Tone: ${tone}
Platform: ${platform}

Ek 30-60 second short video script likh Hinglish mein.
Format:
[HOOK] - pehli line
[BODY] - main content 3-4 points
[CTA] - end mein kya kare viewer

Natural Hinglish use kar, jaise dost se baat kar raha ho.`,
  },
  hashtags: {
    label: "Hashtag Set",
    prompt: (topic, tone, platform) =>
      `Topic: "${topic}"
Platform: ${platform}

30 best Hinglish/Hindi/English hashtags generate kar is topic ke liye ${platform} pe.
Mix kar: 10 high volume + 10 medium + 10 niche hashtags.
Sirf hashtags de, # ke saath, space separated.`,
  },
};

const TONES = ["funny", "motivational", "informative", "emotional", "viral", "professional", "casual", "bold"];
const PLATFORMS = ["Instagram", "YouTube", "Telegram", "Twitter/X"];

router.post("/", freeLimiter, async (req, res) => {
  try {
    const { topic, contentType, tone, platform, userId, plan } = req.body;

    if (!topic || !contentType) {
      return res.status(400).json({ error: "Topic aur content type dono chahiye!" });
    }

    if (!CONTENT_TYPES[contentType]) {
      return res.status(400).json({ error: "Invalid content type" });
    }

    const paidOnlyTypes = ["script", "hashtags"];
    if (paidOnlyTypes.includes(contentType) && plan !== "paid") {
      return res.status(403).json({
        error: "Yeh feature sirf paid users ke liye hai! 🔒",
        upgrade_url: "https://likhde.vercel.app/pricing",
      });
    }

    const selectedTone = tone || "casual";
    const selectedPlatform = platform || "Instagram";

    const promptFn = CONTENT_TYPES[contentType].prompt;
    const finalPrompt = promptFn(topic, selectedTone, selectedPlatform);

    // Call Groq
    const result = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: finalPrompt }],
      max_tokens: 1000,
    });
    const text = result.choices[0].message.content;

    return res.json({
      success: true,
      contentType,
      platform: selectedPlatform,
      tone: selectedTone,
      output: text,
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Generate error:", err);
    return res.status(500).json({ error: "Kuch gadbad ho gayi, dobara try karo!" });
  }
});

router.get("/types", (req, res) => {
  res.json({
    contentTypes: Object.entries(CONTENT_TYPES).map(([key, val]) => ({
      key,
      label: val.label,
    })),
    tones: TONES,
    platforms: PLATFORMS,
  });
});

module.exports = router;
