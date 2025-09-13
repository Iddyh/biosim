import React, { useState } from 'react';
import type { SimulationStep, VideoStyle } from '../types';
import { LoadingSpinner } from './LoadingSpinner';
import { VideoStatus } from './VideoStatus';
import { ImageIcon } from './icons/ImageIcon';
import { PlayIcon } from './icons/PlayIcon';
import { RedoIcon } from './icons/RedoIcon';
import { ShareIcon } from './icons/ShareIcon';
import { DownloadIcon } from './icons/DownloadIcon';

type VisualContent = {
    type: 'image' | 'video';
    data: string;
    mimeType?: string;
};

type LoadingState = {
    plan: boolean;
    visual: boolean;
};

interface SimulationViewerProps {
    topic: string;
    simulationPlan: SimulationStep[];
    currentStepIndex: number;
    visualContent: VisualContent | null;
    loading: LoadingState;
    videoStatus: string;
    error: string | null;
    onImageEdit: (prompt: string) => void;
    onGoToStep: (index: number) => void;
    onVideoRegenerate: (style: VideoStyle) => void;
}

const ImageEditor: React.FC<{ onEdit: (prompt: string) => void, loading: boolean }> = ({ onEdit, loading }) => {
    const [prompt, setPrompt] = useState('');

    const handleEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (prompt.trim() && !loading) {
            onEdit(prompt.trim());
            setPrompt('');
        }
    };

    return (
        <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <h4 className="font-semibold text-slate-700 mb-2">Edit Image</h4>
            <form onSubmit={handleEdit} className="flex items-center gap-2">
                <input
                    type="text"
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    placeholder="e.g., 'add labels', 'zoom in on the mitochondria'"
                    className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-300"
                    disabled={loading}
                />
                <button type="submit" disabled={loading || !prompt.trim()} className="px-4 py-2 text-sm bg-slate-600 text-white font-semibold rounded-md hover:bg-slate-700 disabled:bg-slate-400">
                    {loading ? <LoadingSpinner className="w-5 h-5" /> : 'Apply'}
                </button>
            </form>
        </div>
    );
};

const VideoOptions: React.FC<{ onRegenerate: (style: VideoStyle) => void, loading: boolean }> = ({ onRegenerate, loading }) => {
    const [selectedStyle, setSelectedStyle] = useState<VideoStyle>('animation');
    const styles: { id: VideoStyle; label: string; description: string }[] = [
        { id: 'animation', label: 'Animation', description: 'Clear, educational style.' },
        { id: 'realistic', label: 'Realistic', description: 'Photorealistic, cinematic rendering.' },
        { id: 'documentary', label: 'Documentary', description: 'Nature film style.' },
    ];

    const handleRegenerateClick = () => {
        if (!loading) {
            onRegenerate(selectedStyle);
        }
    };

    return (
        <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                    <h4 className="font-semibold text-slate-700 mb-2">Video Style</h4>
                    <fieldset className="flex items-center gap-2 flex-wrap">
                        <legend className="sr-only">Choose a video generation style</legend>
                        {styles.map(style => (
                            <div key={style.id}>
                                <input
                                    type="radio"
                                    id={style.id}
                                    name="videoStyle"
                                    value={style.id}
                                    checked={selectedStyle === style.id}
                                    onChange={() => setSelectedStyle(style.id)}
                                    className="sr-only"
                                    disabled={loading}
                                />
                                <label
                                    htmlFor={style.id}
                                    title={style.description}
                                    className={`cursor-pointer px-3 py-1.5 text-sm font-semibold rounded-md transition-all duration-200 border ${
                                        selectedStyle === style.id
                                            ? 'bg-sky-500 text-white border-sky-500 ring-2 ring-sky-300 ring-offset-1'
                                            : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100 hover:border-slate-400'
                                    } ${loading ? 'cursor-not-allowed opacity-60' : ''}`}
                                >
                                    {style.label}
                                </label>
                            </div>
                        ))}
                    </fieldset>
                </div>
                <button
                    onClick={handleRegenerateClick}
                    disabled={loading}
                    className="flex-shrink-0 w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-sm bg-slate-600 text-white font-semibold rounded-md hover:bg-slate-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
                >
                    {loading ? (
                        <>
                            <LoadingSpinner className="w-4 h-4" />
                            <span>Regenerating...</span>
                        </>
                    ) : (
                        <>
                            <RedoIcon className="w-4 h-4" />
                            <span>Regenerate Video</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};


const SimulationViewer: React.FC<SimulationViewerProps> = ({
    topic,
    simulationPlan,
    currentStepIndex,
    visualContent,
    loading,
    videoStatus,
    error,
    onImageEdit,
    onGoToStep,
    onVideoRegenerate,
}) => {
    const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');

    const handleShare = async () => {
        const dataToShare = { topic, simulationPlan };
        const jsonString = JSON.stringify(dataToShare);
        const base64String = btoa(encodeURIComponent(jsonString));
        const url = `${window.location.origin}${window.location.pathname}?simulation=${base64String}`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: `BioSim AI: ${topic}`,
                    text: `Check out this biology simulation for "${topic}"!`,
                    url: url,
                });
            } catch (error) {
                console.error('Error sharing:', error);
            }
        } else {
            try {
                await navigator.clipboard.writeText(url);
                setCopyStatus('copied');
                setTimeout(() => setCopyStatus('idle'), 2500);
            } catch (err) {
                console.error('Failed to copy link:', err);
                alert('Failed to copy link. You can manually copy it from the address bar.');
            }
        }
    };

    const handleDownload = () => {
        if (!visualContent) return;

        const link = document.createElement('a');
        link.href = visualContent.data;

        const sanitizedTopic = topic.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const stepNumber = currentStepIndex + 1;
        
        let fileExtension = '';
        if (visualContent.type === 'image') {
            fileExtension = visualContent.mimeType?.split('/')[1] || 'png';
        } else {
            fileExtension = 'mp4';
        }

        link.download = `${sanitizedTopic}_step_${stepNumber}.${fileExtension}`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (!topic && !loading.plan) {
        return (
            <div className="text-center py-12">
                <ImageIcon className="mx-auto h-16 w-16 text-slate-300" />
                <h3 className="mt-2 text-lg font-medium text-slate-600">Your biology simulation will appear here.</h3>
                <p className="mt-1 text-slate-500">Enter a topic above to get started.</p>
            </div>
        );
    }

    if (loading.plan) {
        return <div className="flex justify-center items-center p-10"><LoadingSpinner className="h-8 w-8 text-sky-500" /> <span className="ml-3 text-slate-600">Generating lesson plan...</span></div>
    }

    if (simulationPlan.length === 0 && !loading.plan) {
        return null; // Don't show anything if plan is empty after loading (error will be shown by parent)
    }
    
    const currentStep = simulationPlan[currentStepIndex];

    return (
        <section className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-slate-200/80">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Left Panel: Steps */}
                <aside className="md:col-span-1 border-b md:border-b-0 md:border-r border-slate-200 pb-4 md:pb-0 md:pr-6">
                    <div className="flex items-center justify-between gap-2 mb-3">
                        <h3 className="font-bold text-lg truncate capitalize" title={topic}>{topic}</h3>
                        {simulationPlan.length > 0 && (
                            <button
                                onClick={handleShare}
                                disabled={copyStatus === 'copied'}
                                title="Share Simulation"
                                className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 rounded-md hover:bg-slate-200 disabled:bg-green-100 disabled:text-green-700 transition-all duration-200"
                            >
                                {copyStatus === 'copied' ? (
                                    'Link Copied!'
                                ) : (
                                    <>
                                        <ShareIcon className="h-3.5 w-3.5" />
                                        <span>Share</span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                    <nav className="flex flex-row md:flex-col gap-1">
                        {simulationPlan.map((step, index) => (
                            <button
                                key={index}
                                onClick={() => onGoToStep(index)}
                                className={`w-full text-left p-3 rounded-lg text-sm transition-colors duration-200 ${
                                    currentStepIndex === index
                                        ? 'bg-sky-100 text-sky-700 font-semibold'
                                        : 'text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                     {step.type === 'image' ? <ImageIcon className="h-4 w-4 flex-shrink-0" /> : <PlayIcon className="h-4 w-4 flex-shrink-0" />}
                                    <span className="flex-1">{index + 1}. {step.title}</span>
                                </div>
                            </button>
                        ))}
                    </nav>
                </aside>

                {/* Right Panel: Content */}
                <main className="md:col-span-3">
                    <div className="aspect-w-16 aspect-h-9 bg-slate-200 rounded-lg overflow-hidden flex items-center justify-center mb-4">
                        {loading.visual ? (
                            videoStatus ? <VideoStatus message={videoStatus} /> : <LoadingSpinner className="h-10 w-10 text-sky-500" />
                        ) : error ? (
                            <div className="text-center p-4">
                                <p className="text-red-600 font-medium">Error</p>
                                <p className="text-slate-600 text-sm">{error}</p>
                            </div>
                        ) : visualContent ? (
                            visualContent.type === 'image' ? (
                                <img src={visualContent.data} alt={currentStep.title} className="w-full h-full object-contain" />
                            ) : (
                                <video src={visualContent.data} controls autoPlay className="w-full h-full" />
                            )
                        ) : (
                            <div className="text-slate-400">Generating visual...</div>
                        )}
                    </div>
                    
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <h2 className="text-xl font-bold text-slate-800">{currentStep.title}</h2>
                            {visualContent && !loading.visual && !error && (
                                <button
                                    onClick={handleDownload}
                                    title="Download Visual"
                                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-slate-600 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors"
                                >
                                    <DownloadIcon className="h-4 w-4" />
                                    <span>Download</span>
                                </button>
                            )}
                        </div>
                        <p className="text-slate-600 leading-relaxed">{currentStep.description}</p>
                    </div>

                    {currentStep.type === 'video' && (
                        <VideoOptions onRegenerate={onVideoRegenerate} loading={loading.visual} />
                    )}

                    {visualContent?.type === 'image' && !loading.visual && (
                        <ImageEditor onEdit={onImageEdit} loading={loading.visual}/>
                    )}
                    
                    {/* Navigation */}
                    <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-200">
                         <button
                            onClick={() => onGoToStep(currentStepIndex - 1)}
                            disabled={currentStepIndex === 0}
                            className="px-4 py-2 text-sm bg-slate-200 text-slate-700 font-semibold rounded-md hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                         <span className="text-sm font-medium text-slate-500">
                            Step {currentStepIndex + 1} of {simulationPlan.length}
                        </span>
                        <button
                            onClick={() => onGoToStep(currentStepIndex + 1)}
                            disabled={currentStepIndex === simulationPlan.length - 1}
                            className="px-4 py-2 text-sm bg-slate-200 text-slate-700 font-semibold rounded-md hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                </main>
            </div>
        </section>
    );
};

export default SimulationViewer;