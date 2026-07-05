import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import { Mistral } from "@mistralai/mistralai"
import dotenv from "dotenv"
import crypto from "crypto"

dotenv.config()

const API_KEY = process.env.MISTRAL_API_KEY;

let client = null;
let cachedAgentId = null;

const systemPrompt = `Create a cozy, high-quality indie game pixel art asset in a warm modern aesthetic.



Art Style:

- Premium handcrafted pixel art

- Similar visual quality to Stardew Valley, Eastward, or modern indie pixel games

- Clean, readable silhouette

- Rich but limited color palette

- Soft lighting

- Cozy and welcoming atmosphere

- Slightly stylized proportions

- No realism

- No anime

- No painterly brush strokes

- No 3D rendering

- No vector art

- No photorealism



Pixel Characteristics:

- Crisp pixels

- No anti-aliasing

- Consistent pixel density

- 32x32 to 64x64 asset scale

- Sharp edges

- Clean outlines where appropriate

- Subtle internal shading

- Simple but expressive forms



Lighting:

- Warm indoor lighting

- Gentle ambient occlusion

- Soft shadows

- Cozy evening room feeling

- Slight golden hue

- Light coming from upper-left unless specified otherwise



Colors:

- Warm wood tones

- Soft creams

- Muted greens

- Cozy oranges

- Deep blues

- Earth tones

- Avoid oversaturated colors unless the object intentionally stands out



Object Design:

- Cute

- Friendly

- Slightly rounded

- Feels hand crafted

- Fits inside a relaxing bedroom/living room

- Consistent proportions with other furniture



Perspective:

- Straight side-view for a 2D room game

- NOT isometric

- NOT top-down

- Objects sit naturally on the floor

- Camera is perpendicular to the wall



Background (mandatory — no exceptions):

- Fully transparent PNG with alpha channel, OR
- A perfectly flat solid fill that exactly matches the room background hex color given in the user prompt
- NO gradient, NO floor plane, NO wall, NO room scene, NO vignette
- NO drop shadow extending outside the object silhouette
- Asset only — object floating on transparent or exact-match solid color



Quality:

- Extremely clean

- Professional indie game asset

- Production-ready

- No artifacts

- No watermark

- No text

- No cropping

- Entire object visible



If generating furniture:

- Place object centered

- Keep enough transparent padding

- Maintain consistent visual scale with existing furniture



If generating decorations:

- Small

- Readable

- Charming

- Fits naturally inside a cozy room



If generating electronics:

- Stylized rather than realistic

- Friendly shapes

- Pixel-perfect buttons and details



If generating plants:

- Soft organic curves

- Vibrant but muted greens

- Cozy home aesthetic



If generating books:

- Warm colored covers

- Slight wear

- Cozy library aesthetic



Mood:

The room should feel like a place someone genuinely enjoys spending time in.

Everything should communicate comfort, personality, warmth, and individuality.



Negative Prompt:

photorealistic, realistic, CGI, Blender, Unity render, Unreal Engine, low quality, blurry, noisy, messy, distorted, stretched, cropped, watermark, logo, text, anime, manga, vector, flat icon, emoji, clipart, sketch, oil painting, watercolor, thick outlines, inconsistent perspective, oversaturated colors, dark horror aesthetic.
`

function getClient() {
    if (!API_KEY) {
        throw new Error('Missing MISTRAL_API_KEY environment variable.');
    }
    if (!client) {
        client = new Mistral({ apiKey: API_KEY });
    }
    return client;
}

/**
 * Creates (or reuses) an agent configured with the image_generation tool.
 * The agent is cached in-memory so repeated calls don't create a new agent each time.
 */
async function getImageAgent() {
    const mistral = getClient();
    if (cachedAgentId) return cachedAgentId;

    const agent = await mistral.beta.agents.create({
        model: 'mistral-medium-latest',
        name: 'Image Generation Agent',
        description: 'Agent used to generate images.',
        instructions: 'Use the image generation tool whenever asked to create an image.',
        tools: [{ type: 'image_generation' }],
        completionArgs: {
            temperature: 0.3,
            topP: 0.95,
        },
    });

    cachedAgentId = agent.id;
    return cachedAgentId;
}

/**
 * Generate one or more images from a text prompt using Mistral's image generation tool.
 *
 * @param {string} prompt - Description of the image(s) to generate
 * @param {Object} [options]
 * @param {string} [options.outDir='.'] - Directory to save generated images into
 * @param {string} [options.filePrefix='image_generated'] - Filename prefix
 * @returns {Promise<string[]>} - Local file paths of the saved images
 */
export default async function generateImage(prompt, options = {}) {
    if (!prompt) {
        throw new Error('A text prompt is required.');
    }

    const uuid = crypto.randomUUID();

    const {
        outDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "../images"),
        filePrefix = uuid,
        backgroundColor,
    } = options;

    let userPrompt = prompt;
    if (backgroundColor) {
        userPrompt += `\n\nBACKGROUND REQUIREMENT (mandatory): Use either (A) a fully transparent PNG background, OR (B) a flat solid fill of exactly ${backgroundColor} — no gradient, no floor, no wall, no shadow plate, no other colors outside the object.`;
    } else {
        userPrompt += `\n\nBACKGROUND REQUIREMENT (mandatory): Fully transparent PNG background only — no floor, no wall, no shadow plate.`;
    }

    const mistral = getClient();
    const agentId = await getImageAgent();

    const response = await mistral.beta.conversations.start({
        agentId,
        inputs: `${systemPrompt}\n\n${userPrompt}`,
    });

    const lastOutput = response.outputs[response.outputs.length - 1];
    const fileChunks = (lastOutput.content || []).filter(
        (chunk) => chunk.type === 'tool_file' && chunk.tool === 'image_generation'
    );

    if (!fileChunks.length) {
        throw new Error('No image was generated. Full response: ' + JSON.stringify(response, null, 2));
    }

    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
    }

    const savedPaths = [];
    for (let i = 0; i < fileChunks.length; i++) {
        const chunk = fileChunks[i];
        const fileStream = await mistral.files.download({
            fileId: chunk.fileId,
        });

        const buffer = Buffer.from(
            await new Response(fileStream).arrayBuffer()
        );

        const ext = chunk.fileType || 'png';
        const outPath = path.join(outDir, `${filePrefix}_${i}.${ext}`);
        fs.writeFileSync(outPath, buffer);
        savedPaths.push(outPath);
    }

    return savedPaths;
}
