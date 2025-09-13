import { GoogleGenAI, Type, Modality } from "@google/genai";
import type { SimulationStep, VideoStyle } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Utility to convert file to base64
const fileToGenerativePart = async (file: File) => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
    });
    return {
        inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
};

export const generateSimulationPlan = async (topic: string, simulationType: 'image' | 'video'): Promise<SimulationStep[]> => {
    const prompt = `Create a step-by-step biology simulation lesson plan about "${topic}". 
    Each step should include a title, a short description for a student, a concise prompt for an AI to generate a relevant visual, and the type of visual.
    The 'type' for all steps in the lesson plan MUST be '${simulationType}'. Do not mix types.
    Focus on key concepts. The plan should have 3 to 5 steps.
    
    For example, a step for Photosynthesis could be:
    { "title": "Sunlight Absorption", "description": "Chlorophyll inside chloroplasts absorbs sunlight.", "prompt": "An animation showing sunlight hitting a chloroplast and energy being absorbed by chlorophyll molecules.", "type": "video" }.
    
    Another example for the heart:
    { "title": "The Four Chambers", "description": "The heart has four chambers: two atria and two ventricles.", "prompt": "A clear, labeled diagram of the four chambers of the human heart.", "type": "image" }

    Generate a valid JSON array of these steps. Ensure every single step has the type '${simulationType}'.`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        prompt: { type: Type.STRING },
                        type: { type: Type.STRING, enum: ['image', 'video'] },
                    },
                    required: ["title", "description", "prompt", "type"],
                },
            },
        },
    });

    const jsonText = response.text.trim();
    try {
        return JSON.parse(jsonText);
    } catch (e) {
        console.error("Failed to parse simulation plan JSON:", e);
        throw new Error("The AI returned an invalid lesson plan format. Please try again.");
    }
};

export const generateImage = async (prompt: string): Promise<{ base64: string; mimeType: string }> => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [{ text: `Generate a scientific illustration for a biology textbook: ${prompt}` }] },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
            return {
                base64: part.inlineData.data,
                mimeType: part.inlineData.mimeType,
            };
        }
    }
    throw new Error("Image generation failed. No image data received.");
};


export const editImage = async (base64Image: string, mimeType: string, prompt: string): Promise<{ base64: string; mimeType: string }> => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: {
            parts: [
                { inlineData: { data: base64Image, mimeType: mimeType } },
                { text: prompt },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
            return {
                base64: part.inlineData.data,
                mimeType: part.inlineData.mimeType,
            };
        }
    }
    throw new Error("Image editing failed. No image data received.");
};

const videoGenerationMessages = [
    "Initializing the virtual microscope...",
    "Sequencing bio-data for simulation...",
    "Assembling cellular structures...",
    "Simulating biological processes...",
    "Rendering high-fidelity animation...",
    "This can take a few minutes, the result will be worth it!",
    "Finalizing video output...",
    "Almost there...",
];

export const generateVideo = async (prompt: string, style: VideoStyle, onProgress: (message: string) => void): Promise<string> => {
    onProgress(videoGenerationMessages[0]);

    const styleDescription = {
        animation: 'a clear, animated educational style, similar to a science explainer video',
        realistic: 'a photorealistic, cinematic rendering',
        documentary: 'a documentary style, like a nature film, with a calm and informative tone'
    };

    const finalPrompt = `Create a short, scientifically accurate, high-quality video simulation for a biology class about: ${prompt}. The visual style should be ${styleDescription[style]}.`;

    let operation = await ai.models.generateVideos({
        model: 'veo-2.0-generate-001',
        prompt: finalPrompt,
        config: { numberOfVideos: 1 }
    });

    let messageIndex = 1;
    while (!operation.done) {
        onProgress(videoGenerationMessages[messageIndex % videoGenerationMessages.length]);
        messageIndex++;
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
        throw new Error("Video generation failed to produce a download link.");
    }
    
    onProgress("Fetching generated video...");
    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    if (!response.ok) {
        throw new Error(`Failed to download video: ${response.statusText}`);
    }
    const videoBlob = await response.blob();
    return URL.createObjectURL(videoBlob);
};