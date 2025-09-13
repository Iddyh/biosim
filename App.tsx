import React, { useState, useEffect, useCallback } from 'react';
import type { SimulationStep, VideoStyle } from './types';
import { generateSimulationPlan, generateImage, editImage, generateVideo } from './services/geminiService';
import TopicInput from './components/TopicInput';
import SimulationViewer from './components/SimulationViewer';
import { DnaIcon } from './components/icons/DnaIcon';

type LoadingState = {
    plan: boolean;
    visual: boolean;
};

type VisualContent = {
    type: 'image' | 'video';
    data: string; // base64 for image, url for video
    mimeType?: string; // for images
};

const App: React.FC = () => {
    const [topic, setTopic] = useState<string>('');
    const [simulationPlan, setSimulationPlan] = useState<SimulationStep[]>([]);
    const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
    const [visualContent, setVisualContent] = useState<VisualContent | null>(null);
    const [loading, setLoading] = useState<LoadingState>({ plan: false, visual: false });
    const [videoStatus, setVideoStatus] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // This effect runs only once on initial component mount to check for shared simulation data in the URL
        const loadSimulationFromURL = () => {
            const params = new URLSearchParams(window.location.search);
            const sharedData = params.get('simulation');
            if (sharedData) {
                try {
                    const jsonString = decodeURIComponent(atob(sharedData));
                    const data = JSON.parse(jsonString);
                    if (data.topic && Array.isArray(data.simulationPlan) && data.simulationPlan.length > 0) {
                        setTopic(data.topic);
                        setSimulationPlan(data.simulationPlan);
                    }
                } catch (e) {
                    console.error("Failed to load shared simulation:", e);
                } finally {
                    // Clean up URL to prevent re-loading the same shared state on refresh
                     window.history.replaceState({}, document.title, window.location.pathname);
                }
            }
        };
        loadSimulationFromURL();
    }, []);

    const handleTopicSubmit = async (newTopic: string, simulationType: 'image' | 'video') => {
        // Clear URL of any previous shared state when generating a new one
        if (window.location.search.includes('simulation=')) {
            window.history.replaceState({}, document.title, window.location.pathname);
        }
        
        setTopic(newTopic);
        setSimulationPlan([]);
        setCurrentStepIndex(0);
        setVisualContent(null);
        setError(null);
        setLoading({ plan: true, visual: false });

        try {
            const plan = await generateSimulationPlan(newTopic, simulationType);
            if (plan && plan.length > 0) {
                setSimulationPlan(plan);
            } else {
                setError("Could not generate a simulation plan for this topic. Please try another one.");
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : 'An unknown error occurred.');
        } finally {
            setLoading({ plan: false, visual: false });
        }
    };

    const generateVisualForCurrentStep = useCallback(async (styleOverride?: VideoStyle) => {
        if (!simulationPlan || simulationPlan.length === 0) return;

        const currentStep = simulationPlan[currentStepIndex];
        if (!currentStep) return;

        setLoading(prev => ({ ...prev, visual: true }));
        setVisualContent(null);
        setError(null);
        setVideoStatus('');

        try {
            if (currentStep.type === 'image') {
                const { base64, mimeType } = await generateImage(currentStep.prompt);
                const imageDataUrl = `data:${mimeType};base64,${base64}`;
                setVisualContent({ type: 'image', data: imageDataUrl, mimeType });
            } else if (currentStep.type === 'video') {
                const styleToUse = styleOverride || 'animation'; // Default style
                const videoUrl = await generateVideo(currentStep.prompt, styleToUse, setVideoStatus);
                setVisualContent({ type: 'video', data: videoUrl });
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to generate visual content.');
        } finally {
            setLoading(prev => ({ ...prev, visual: false }));
            setVideoStatus('');
        }
    }, [currentStepIndex, simulationPlan]);

    useEffect(() => {
        if (simulationPlan.length > 0) {
            generateVisualForCurrentStep();
        }
    }, [currentStepIndex, simulationPlan.length]); // Depend on length to trigger initial load

    const handleImageEdit = async (editPrompt: string) => {
        if (!visualContent || visualContent.type !== 'image' || !visualContent.mimeType) return;
        
        setLoading(prev => ({ ...prev, visual: true }));
        setError(null);
        
        try {
            const base64Data = visualContent.data.split(',')[1];
            const { base64, mimeType } = await editImage(base64Data, visualContent.mimeType, editPrompt);
            const newImageDataUrl = `data:${mimeType};base64,${base64}`;
            setVisualContent({ type: 'image', data: newImageDataUrl, mimeType });
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to edit image.');
        } finally {
             setLoading(prev => ({ ...prev, visual: false }));
        }
    };
    
    const handleVideoRegenerate = async (newStyle: VideoStyle) => {
        await generateVisualForCurrentStep(newStyle);
    };

    const goToStep = (index: number) => {
        if (index >= 0 && index < simulationPlan.length) {
            setCurrentStepIndex(index);
        }
    };

    return (
        <div className="min-h-screen bg-slate-100/50 font-sans text-slate-800">
            <header className="bg-white shadow-sm">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <DnaIcon className="h-8 w-8 text-sky-500" />
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">BioSim AI</h1>
                    </div>
                     <a href="https://github.com/google/genai-js" target="_blank" rel="noopener noreferrer" className="text-sm text-slate-500 hover:text-sky-600 transition-colors">
                        Powered by Gemini
                    </a>
                </div>
            </header>
            
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="max-w-3xl mx-auto">
                    <section className="bg-white p-6 rounded-xl shadow-lg border border-slate-200/80 mb-8">
                        <h2 className="text-xl font-semibold mb-1">Biology Topic Simulator</h2>
                        <p className="text-slate-500 mb-4">Enter a biology topic and choose your preferred simulation format to generate an interactive lesson.</p>
                        <TopicInput onSubmit={handleTopicSubmit} loading={loading.plan} />
                    </section>
                    
                    <SimulationViewer
                        topic={topic}
                        simulationPlan={simulationPlan}
                        currentStepIndex={currentStepIndex}
                        visualContent={visualContent}
                        loading={loading}
                        videoStatus={videoStatus}
                        error={error}
                        onImageEdit={handleImageEdit}
                        onGoToStep={goToStep}
                        onVideoRegenerate={handleVideoRegenerate}
                    />
                </div>
            </main>
        </div>
    );
};

export default App;